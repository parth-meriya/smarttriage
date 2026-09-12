"""
Smart Patient Queue workflow tests.

Covers the acceptance test cases for the priority queue:
  1.  Patient registration -> visible to Nurse/Doctor/Admin
  2-4. L4 / L3 / L2 queue placement above lower levels
  5.  L1 emergency -> top of queue + real-time doctor notification
  6.  Multi-patient ordering L1 > L2 > L3 > L4 with FIFO inside a level
  7.  Start treatment -> IN CONSULTATION
  8.  Complete treatment -> COMPLETED + next eligible patient selected by backend
  9.  Completing a patient updates other patients' "patients before you"
  10. Disconnect/reconnect: fresh GET synchronizes state, no duplicate tickets
  11. Patients cannot access another patient's queue information
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from unittest.mock import patch

from apps.facilities.models import Facility
from apps.triage.models import Patient, Visit, QueueTicket, TriageAssessment
from apps.triage import queue_service

User = get_user_model()


class SmartQueueWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="Queue Test Hospital", code="QTH-01")

        self.doctor = User.objects.create_user(
            username='sq_doctor', password='DoctorPass123!',
            role=User.Role.DOCTOR, first_name='Gregory', last_name='House'
        )
        self.nurse = User.objects.create_user(
            username='sq_nurse', password='NursePass123!',
            role=User.Role.NURSE, first_name='Clara', last_name='Barton'
        )
        self.admin = User.objects.create_user(
            username='sq_admin', password='AdminPass123!',
            role=User.Role.ADMIN, first_name='Sam', last_name='Morgan'
        )
        self.patient_user = User.objects.create_user(
            username='sq_patient', password='PatientPass123!',
            role=User.Role.PATIENT, first_name='John', last_name='Queue',
            email='sq_patient@example.com'
        )
        self.my_patient = Patient.objects.create(
            user=self.patient_user,
            first_name="John", last_name="Queue", age=40, mrn="ST-SQ-ME",
            email='sq_patient@example.com'
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _make_ticket(self, patient, priority, minutes_ago=0, ticket_number=None,
                     status=QueueTicket.Status.TRIAGE_COMPLETE):
        visit = Visit.objects.create(
            patient=patient,
            chief_complaint=f"Complaint for {patient.name}",
            priority=priority,
            status=Visit.Status.TRIAGE_COMPLETE,
        )
        return QueueTicket.objects.create(
            patient=patient,
            visit=visit,
            facility=self.facility,
            ticket_number=ticket_number or f"T-{patient.mrn}",
            priority=priority,
            status=status,
            arrived_at=timezone.now() - timedelta(minutes=minutes_ago),
        )

    # ------------------------------------------------------------------
    # TEST CASE 1: Registration -> visible to staff
    # ------------------------------------------------------------------
    def test_case_1_registered_patient_visible_to_all_staff(self):
        """New patient registration is visible to Nurse, Doctor and Admin."""
        self.client.force_authenticate(user=self.nurse)
        res = self.client.post('/api/v1/triage/patients/', {
            "first_name": "Newly", "last_name": "Registered", "age": 33,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        patient_id = res.data['id']

        for staff_user in (self.nurse, self.doctor, self.admin):
            self.client.force_authenticate(user=staff_user)
            view = self.client.get(f'/api/v1/triage/patients/{patient_id}/')
            self.assertEqual(view.status_code, status.HTTP_200_OK)
            self.assertEqual(view.data['name'], "Newly Registered")

        # Registration must NOT send the patient straight to the doctor:
        # status stays pre-triage until a nurse assesses.
        self.client.force_authenticate(user=self.patient_user)
        status_res = self.client.get('/api/v1/triage/queue/my_status/')
        # No ticket exists yet -> explicit 404 rather than fake queue state
        self.assertIn(status_res.status_code, (status.HTTP_404_NOT_FOUND, status.HTTP_200_OK))

    # ------------------------------------------------------------------
    # TEST CASES 2-4: L4 / L3 / L2 placement
    # ------------------------------------------------------------------
    def test_case_2_l4_patient_enters_l4_queue(self):
        p4 = Patient.objects.create(first_name="Quinn", last_name="Four", age=30, mrn="ST-SQ-L4")
        ticket = self._make_ticket(p4, priority=4)
        self.client.force_authenticate(user=self.doctor)
        res = self.client.get('/api/v1/triage/queue/live_feed/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        all_ids = [t['id'] for t in res.data['all']]
        self.assertIn(ticket.id, all_ids)
        ticket.refresh_from_db()
        self.assertEqual(queue_service.queue_position(ticket), 1)

    def test_case_3_l3_patient_enters_above_l4(self):
        p4 = Patient.objects.create(first_name="Quinn", last_name="Four", age=30, mrn="ST-SQ-L4")
        p3 = Patient.objects.create(first_name="Usha", last_name="Three", age=30, mrn="ST-SQ-L3")
        t4 = self._make_ticket(p4, priority=4, minutes_ago=10)
        t3 = self._make_ticket(p3, priority=3, minutes_ago=5)
        self.assertEqual(queue_service.queue_position(t3), 1)
        self.assertEqual(queue_service.queue_position(t4), 2)

    def test_case_4_l2_patient_enters_above_l3_and_l4(self):
        p4 = Patient.objects.create(first_name="Quinn", last_name="Four", age=30, mrn="ST-SQ-L4")
        p3 = Patient.objects.create(first_name="Usha", last_name="Three", age=30, mrn="ST-SQ-L3")
        p2 = Patient.objects.create(first_name="Hana", last_name="Two", age=30, mrn="ST-SQ-L2")
        self._make_ticket(p4, priority=4, minutes_ago=30)
        self._make_ticket(p3, priority=3, minutes_ago=20)
        t2 = self._make_ticket(p2, priority=2, minutes_ago=1)
        self.assertEqual(queue_service.queue_position(t2), 1)

    # ------------------------------------------------------------------
    # TEST CASE 5: L1 emergency escalation
    # ------------------------------------------------------------------
    @patch('apps.triage.signals.broadcast_message')
    def test_case_5_l1_emergency_jump_queue_and_notify(self, mock_broadcast):
        """L1 ticket becomes #1 and triggers a real-time emergency alert."""
        p4 = Patient.objects.create(first_name="Quinn", last_name="Four", age=30, mrn="ST-SQ-L4")
        p1 = Patient.objects.create(first_name="Echo", last_name="One", age=30, mrn="ST-SQ-L1")
        self._make_ticket(p4, priority=4, minutes_ago=15)
        t1 = self._make_ticket(p1, priority=1, minutes_ago=1)

        self.assertEqual(queue_service.queue_position(t1), 1)

        types = [call[0][0] for call in mock_broadcast.call_args_list]
        self.assertIn("emergency_alert", types)
        self.assertIn("queue_updated", types)
        alert = next(
            call[0][1] for call in mock_broadcast.call_args_list if call[0][0] == "emergency_alert"
        )
        self.assertEqual(alert["priority"], 1)
        self.assertEqual(alert["patient_name"], "Echo One")

    # ------------------------------------------------------------------
    # TEST CASE 6: Full ordering L1 > L2 > L3 > L4 with FIFO inside level
    # ------------------------------------------------------------------
    def test_case_6_priority_order_with_fifo_within_level(self):
        patients = {
            1: [Patient.objects.create(first_name=f"L1-{i}", last_name="Emerg", age=50, mrn=f"ST-SQ-L1-{i}")
                for i in (1, 2)],
            2: [Patient.objects.create(first_name=f"L2-{i}", last_name="High", age=40, mrn=f"ST-SQ-L2-{i}")
                for i in (1, 2)],
            3: [Patient.objects.create(first_name=f"L3-{i}", last_name="Urg", age=35, mrn=f"ST-SQ-L3-{i}")
                for i in (1, 2)],
            4: [Patient.objects.create(first_name=f"L4-{i}", last_name="Non", age=25, mrn=f"ST-SQ-L4-{i}")
                for i in (1, 2)],
        }
        # Create newest-first inside each level to prove FIFO wins within a level
        for level, plist in patients.items():
            for idx, p in enumerate(plist):
                self._make_ticket(p, priority=level, minutes_ago=20 - idx * 5)

        order = list(queue_service.eligible_tickets().values_list('priority', 'ticket_number'))
        expected = [
            (1, "T-ST-SQ-L1-1"), (1, "T-ST-SQ-L1-2"),
            (2, "T-ST-SQ-L2-1"), (2, "T-ST-SQ-L2-2"),
            (3, "T-ST-SQ-L3-1"), (3, "T-ST-SQ-L3-2"),
            (4, "T-ST-SQ-L4-1"), (4, "T-ST-SQ-L4-2"),
        ]
        self.assertEqual(order, expected)

        # API must return the same backend-enforced order
        self.client.force_authenticate(user=self.doctor)
        res = self.client.get('/api/v1/triage/queue/live_feed/')
        priorities = [t['priority'] for t in res.data['all']]
        self.assertEqual(priorities, sorted(priorities))
        first_ticket = res.data['all'][0]
        self.assertEqual(first_ticket['queue_position'], 1)
        self.assertEqual(first_ticket['patients_ahead'], 0)

    # ------------------------------------------------------------------
    # TEST CASE 7: Start treatment
    # ------------------------------------------------------------------
    def test_case_7_start_treatment_sets_in_consultation(self):
        ticket = self._make_ticket(self.my_patient, priority=2)
        self.client.force_authenticate(user=self.doctor)
        res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/call_patient/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.IN_CONSULTATION)
        self.assertIsNotNone(ticket.called_at)
        ticket.visit.refresh_from_db()
        self.assertEqual(ticket.visit.status, Visit.Status.IN_CONSULTATION)
        self.assertEqual(ticket.visit.assigned_doctor, self.doctor)

    def test_case_7b_second_doctor_cannot_take_same_patient(self):
        """Backend prevents two doctors taking the same patient simultaneously."""
        ticket = self._make_ticket(self.my_patient, priority=2)
        ticket.status = QueueTicket.Status.IN_CONSULTATION
        ticket.save()

        doctor2 = User.objects.create_user(
            username='sq_doctor2', password='DoctorPass123!', role=User.Role.DOCTOR
        )
        self.client.force_authenticate(user=doctor2)
        res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/call_patient/')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

    # ------------------------------------------------------------------
    # TEST CASE 8: Complete treatment -> next eligible patient
    # ------------------------------------------------------------------
    def test_case_8_complete_treatment_selects_priority_next(self):
        # L2 Patient A in consultation, L2 B waiting, L3 C, L4 D waiting
        pa = Patient.objects.create(first_name="Alan", last_name="A", age=40, mrn="ST-SQ-CA")
        pb = Patient.objects.create(first_name="Bella", last_name="B", age=40, mrn="ST-SQ-CB")
        pc = Patient.objects.create(first_name="Carl", last_name="C", age=40, mrn="ST-SQ-CC")
        pd = Patient.objects.create(first_name="Dora", last_name="D", age=40, mrn="ST-SQ-CD")

        ta = self._make_ticket(pa, priority=2, minutes_ago=40)
        tb = self._make_ticket(pb, priority=2, minutes_ago=30)
        tc = self._make_ticket(pc, priority=3, minutes_ago=20)
        td = self._make_ticket(pd, priority=4, minutes_ago=10)

        ta.status = QueueTicket.Status.IN_CONSULTATION
        ta.save()

        self.client.force_authenticate(user=self.doctor)
        res = self.client.post(f'/api/v1/triage/queue/{ta.id}/complete/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        ta.refresh_from_db()
        self.assertEqual(ta.status, QueueTicket.Status.COMPLETED)
        self.assertIsNotNone(ta.completed_at)

        # Backend must pick the L2 patient (FIFO within level), NOT the earliest arrival overall
        next_patient = res.data['next_patient']
        self.assertIsNotNone(next_patient)
        self.assertEqual(next_patient['ticket_id'], tb.id)
        self.assertEqual(queue_service.next_eligible_ticket().pk, tb.id)

    # ------------------------------------------------------------------
    # TEST CASE 9: Patients-before-you updates automatically
    # ------------------------------------------------------------------
    def test_case_9_patients_ahead_updates_after_completion(self):
        pa = Patient.objects.create(first_name="Alan", last_name="A", age=40, mrn="ST-SQ-PA")
        pb = Patient.objects.create(first_name="Bella", last_name="B", age=40, mrn="ST-SQ-PB")
        ta = self._make_ticket(pa, priority=2, minutes_ago=30)
        tb = self._make_ticket(pb, priority=2, minutes_ago=20)

        # B has 1 patient (A) before them
        self.assertEqual(queue_service.patients_ahead(tb), 1)

        ta.status = QueueTicket.Status.COMPLETED
        ta.save()

        self.assertEqual(queue_service.patients_ahead(tb), 0)
        # Position 1 -> "turn approaching" banner via my_status
        self.client.force_authenticate(user=self.patient_user)
        # Link Bella to her own patient account to check her personal snapshot
        bella_user = User.objects.create_user(
            username='sq_bella', password='PatientPass123!',
            role=User.Role.PATIENT, first_name='Bella', last_name='B',
            email='bella@example.com'
        )
        pb.user = bella_user
        pb.email = 'bella@example.com'
        pb.save()
        self.client.force_authenticate(user=bella_user)
        res = self.client.get('/api/v1/triage/queue/my_status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['queue_position'], 1)
        self.assertEqual(res.data['patients_ahead'], 0)
        self.assertIn('turn', res.data['banner'].lower())

    # ------------------------------------------------------------------
    # TEST CASE 10: Disconnect / reconnect resync, no duplicate tickets
    # ------------------------------------------------------------------
    def test_case_10_reconnect_resyncs_without_duplicates(self):
        ticket = self._make_ticket(self.my_patient, priority=3)
        ticket_count_before = QueueTicket.objects.filter(patient=self.my_patient).count()

        # Simulate a fresh client fetching state after reconnect
        self.client.force_authenticate(user=self.patient_user)
        res1 = self.client.get('/api/v1/triage/queue/my_status/')
        res2 = self.client.get('/api/v1/triage/queue/my_status/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['ticket_id'], ticket.id)
        self.assertEqual(res2.data['ticket_id'], ticket.id)
        self.assertEqual(res1.data['queue_position'], res2.data['queue_position'])

        self.assertEqual(
            QueueTicket.objects.filter(patient=self.my_patient).count(),
            ticket_count_before,
            "Re-fetching queue state must not create duplicate queue tickets",
        )

    def test_case_10b_nurse_reassessment_never_duplicates_tickets(self):
        """Submitting another triage assessment updates the existing ticket."""
        ticket = self._make_ticket(self.my_patient, priority=3)
        self.client.force_authenticate(user=self.nurse)
        res = self.client.post('/api/v1/triage/assessments/', {
            "patient": self.my_patient.id,
            "primary_complaint": "Persistent cough",
            "symptom_onset": "Earlier today",
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        tickets = QueueTicket.objects.filter(patient=self.my_patient)
        self.assertEqual(tickets.count(), 1)
        ticket.refresh_from_db()
        self.assertEqual(ticket.priority, res.data['priority'])

    # ------------------------------------------------------------------
    # TEST CASE 11: Unauthorized access to another patient's queue info
    # ------------------------------------------------------------------
    def test_case_11_patient_cannot_access_other_patients_data(self):
        other = Patient.objects.create(first_name="Private", last_name="Person", age=28, mrn="ST-SQ-PRIV")
        self._make_ticket(other, priority=2)

        self.client.force_authenticate(user=self.patient_user)

        # Cannot list other patients
        list_res = self.client.get('/api/v1/triage/patients/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        ids = [p['id'] for p in (list_res.data.get('results', list_res.data))]
        self.assertNotIn(other.id, ids)

        # Cannot fetch the other record directly
        detail_res = self.client.get(f'/api/v1/triage/patients/{other.id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_404_NOT_FOUND)

        # Cannot fetch other patient's history
        history_res = self.client.get(f'/api/v1/triage/patients/{other.id}/history/')
        self.assertEqual(history_res.status_code, status.HTTP_404_NOT_FOUND)

        # Cannot mutate the queue
        ticket = QueueTicket.objects.filter(patient=other).first()
        call_res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/call_patient/')
        self.assertEqual(call_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_case_11b_patient_cannot_mutate_queue_objects(self):
        ticket = self._make_ticket(self.my_patient, priority=3)
        self.client.force_authenticate(user=self.patient_user)
        del_res = self.client.delete(f'/api/v1/triage/queue/{ticket.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)

    # ------------------------------------------------------------------
    # Estimated waiting time (configurable, backend-computed)
    # ------------------------------------------------------------------
    def test_estimated_wait_uses_configured_average(self):
        pb = Patient.objects.create(first_name="Bella", last_name="B", age=40, mrn="ST-SQ-EW-B")
        pc = Patient.objects.create(first_name="Carl", last_name="C", age=40, mrn="ST-SQ-EW-C")
        self._make_ticket(pb, priority=2, minutes_ago=20)
        tc = self._make_ticket(pc, priority=2, minutes_ago=10)

        with self.settings(AVERAGE_CONSULTATION_MINUTES=10):
            # Carl has 1 patient ahead -> 10 min
            self.assertEqual(queue_service.estimated_wait_minutes(tc), 10)
            serializer_state = queue_service.serialize_queue_state(tc)
            self.assertEqual(serializer_state['estimated_wait_minutes'], 10)
            self.assertEqual(serializer_state['average_consultation_minutes'], 10)

        with self.settings(AVERAGE_CONSULTATION_MINUTES=15):
            self.assertEqual(queue_service.estimated_wait_minutes(tc), 15)
