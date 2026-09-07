from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from apps.facilities.models import Facility
from apps.triage.models import Patient, Visit, QueueTicket, TriageAssessment, VitalSign
from apps.consultations.models import Consultation

User = get_user_model()

class QueueAndConsultationWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="City General Hospital", code="CGH-01")
        
        self.doctor = User.objects.create_user(
            username='doctor_test',
            password='DocPassword123!',
            role=User.Role.DOCTOR,
            first_name='Marcus',
            last_name='Welby'
        )
        self.nurse = User.objects.create_user(
            username='nurse_test',
            password='NursePassword123!',
            role=User.Role.NURSE,
            first_name='Clara',
            last_name='Barton'
        )
        
        # Create patients
        self.patient_p1 = Patient.objects.create(
            first_name="Emergency", last_name="Patient", age=65, mrn="ST-P1"
        )
        self.patient_p2 = Patient.objects.create(
            first_name="Urgent", last_name="Patient", age=45, mrn="ST-P2"
        )
        self.patient_p4 = Patient.objects.create(
            first_name="Stable", last_name="Patient", age=22, mrn="ST-P4"
        )

    def test_queue_ordering_by_urgency_then_arrival(self):
        """Urgency (Priority 1 -> 4) takes strict precedence; arrival time breaks ties."""
        now = timezone.now()
        
        # P4 arrived earliest (20 min ago)
        ticket_p4 = QueueTicket.objects.create(
            patient=self.patient_p4, facility=self.facility, ticket_number="T-P4",
            priority=4, status=QueueTicket.Status.WAITING,
            arrived_at=now - timedelta(minutes=20)
        )
        # P2 arrived 10 min ago
        ticket_p2 = QueueTicket.objects.create(
            patient=self.patient_p2, facility=self.facility, ticket_number="T-P2",
            priority=2, status=QueueTicket.Status.WAITING,
            arrived_at=now - timedelta(minutes=10)
        )
        # P1 arrived just now (0 min ago) but is Level 1 Emergency
        ticket_p1 = QueueTicket.objects.create(
            patient=self.patient_p1, facility=self.facility, ticket_number="T-P1",
            priority=1, status=QueueTicket.Status.WAITING,
            arrived_at=now
        )

        self.client.force_authenticate(user=self.doctor)
        res = self.client.get('/api/v1/triage/queue/live_feed/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        all_tickets = res.data['all']
        self.assertEqual(len(all_tickets), 3)
        # Ordering must be P1 (priority 1), then P2 (priority 2), then P4 (priority 4)
        self.assertEqual(all_tickets[0]['ticket_number'], "T-P1")
        self.assertEqual(all_tickets[1]['ticket_number'], "T-P2")
        self.assertEqual(all_tickets[2]['ticket_number'], "T-P4")

    def test_live_feed_metrics_and_categories(self):
        """live_feed properly segments attention (L1/L2) vs waiting (L3/L4) and counts."""
        QueueTicket.objects.create(
            patient=self.patient_p1, facility=self.facility, ticket_number="T-L1",
            priority=1, status=QueueTicket.Status.WAITING
        )
        QueueTicket.objects.create(
            patient=self.patient_p2, facility=self.facility, ticket_number="T-L2",
            priority=2, status=QueueTicket.Status.WAITING
        )
        QueueTicket.objects.create(
            patient=self.patient_p4, facility=self.facility, ticket_number="T-L4",
            priority=4, status=QueueTicket.Status.WAITING
        )

        self.client.force_authenticate(user=self.nurse)
        res = self.client.get('/api/v1/triage/queue/live_feed/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.assertEqual(res.data['counts']['emergency'], 1)
        self.assertEqual(res.data['counts']['high_priority'], 1)
        self.assertEqual(res.data['counts']['non_urgent'], 1)
        self.assertEqual(res.data['counts']['total_waiting'], 3)
        self.assertEqual(len(res.data['attention']), 2)

    def test_call_patient_and_complete_workflow(self):
        """Doctor calls patient -> IN_CONSULTATION; completes ticket -> COMPLETED."""
        visit = Visit.objects.create(
            patient=self.patient_p1,
            chief_complaint="Chest tightness",
            priority=2,
            status=Visit.Status.TRIAGE_COMPLETE
        )
        ticket = QueueTicket.objects.create(
            patient=self.patient_p1,
            visit=visit,
            facility=self.facility,
            ticket_number="T-CALL-01",
            priority=2,
            status=QueueTicket.Status.TRIAGE_COMPLETE
        )

        self.client.force_authenticate(user=self.doctor)

        # 1. Call patient
        call_res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/call_patient/')
        self.assertEqual(call_res.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.IN_CONSULTATION)
        self.assertIsNotNone(ticket.called_at)
        self.assertEqual(visit.status, Visit.Status.IN_CONSULTATION)
        self.assertEqual(visit.assigned_doctor, self.doctor)

        # 2. Complete ticket
        comp_res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/complete/')
        self.assertEqual(comp_res.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.COMPLETED)
        self.assertIsNotNone(ticket.completed_at)
        self.assertEqual(visit.status, Visit.Status.COMPLETED)
        self.assertTrue(visit.is_completed)

    def test_consultation_lifecycle_integration(self):
        """Creating and completing a Consultation updates the queue ticket and visit encounter."""
        visit = Visit.objects.create(
            patient=self.patient_p2,
            chief_complaint="Severe migraine",
            priority=3,
            status=Visit.Status.TRIAGE_COMPLETE
        )
        ticket = QueueTicket.objects.create(
            patient=self.patient_p2,
            visit=visit,
            facility=self.facility,
            ticket_number="T-CONS-01",
            priority=3,
            status=QueueTicket.Status.TRIAGE_COMPLETE
        )

        self.client.force_authenticate(user=self.doctor)

        # 1. Create Consultation
        consult_payload = {
            "patient": self.patient_p2.id,
            "chief_complaint": "Severe migraine with visual aura"
        }
        create_res = self.client.post('/api/v1/consultations/', consult_payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        consult_id = create_res.data['id']

        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.IN_CONSULTATION)
        self.assertEqual(visit.status, Visit.Status.IN_CONSULTATION)
        self.assertEqual(visit.assigned_doctor, self.doctor)

        # 2. Complete Consultation
        complete_payload = {
            "clinical_findings": "Pupils equal and reactive. Normal cranial nerve examination.",
            "diagnosis": "Acute migraine without aura",
            "treatment_plan": "Sumatriptan 50mg, oral hydration, rest in dark room.",
            "disposition": "Discharged"
        }
        complete_res = self.client.post(f'/api/v1/consultations/{consult_id}/complete/', complete_payload, format='json')
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_res.data['diagnosis'], "Acute migraine without aura")
        self.assertEqual(complete_res.data['disposition'], "Discharged")

        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.COMPLETED)
        self.assertEqual(visit.status, Visit.Status.COMPLETED)
        self.assertTrue(visit.is_completed)
        self.assertIsNotNone(visit.completed_at)

    def test_operations_metrics_dynamic_values(self):
        """Operations analytics returns non-mock computed counts."""
        QueueTicket.objects.create(
            patient=self.patient_p1, facility=self.facility, ticket_number="T-M1",
            priority=1, status=QueueTicket.Status.WAITING
        )
        QueueTicket.objects.create(
            patient=self.patient_p2, facility=self.facility, ticket_number="T-M2",
            priority=2, status=QueueTicket.Status.IN_CONSULTATION
        )

        self.client.force_authenticate(user=self.doctor)
        res = self.client.get('/api/v1/analytics/operations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        ops = res.data['operations']
        self.assertEqual(ops['waiting'], 1)
        self.assertEqual(ops['with_doctor'], 1)
        self.assertEqual(ops['completed'], 0)
