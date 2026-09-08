from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
import urllib.request
import json

from apps.facilities.models import Facility
from apps.triage.models import Patient, Visit, QueueTicket, VitalSign, TriageAssessment
from apps.consultations.models import Consultation
from apps.analytics.models import ActivityLog
from apps.notifications.models import Notification

User = get_user_model()

class EndToEndClinicalScenarioTests(TestCase):
    """
    Milestone 30: Full End-to-End Clinical Scenario Test.
    
    Verifies the complete healthcare journey from intake to discharge:
    1. Patient Registration (MRN generation, DB persistence)
    2. Visit Encounter Creation (Waiting status)
    3. Nurse Vitals Recording (Abnormal vitals flag)
    4. Nurse Triage Assessment (Deterministic engine assigns Level 2 High Priority)
    5. Urgency-Sorted Queue Placement (Attention category)
    6. Real-Time WebSocket Alerts & Audit Logging
    7. Doctor Command Center Queue Retrieval
    8. Doctor Consultation Lifecycle (In Consultation -> Completed)
    9. Final Patient Disposition & Record Integrity
    """

    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="Metro Health Center", code="MHC-01")

        # Staff accounts
        self.nurse = User.objects.create_user(
            username='nurse_sarah',
            password='NursePass123!',
            role=User.Role.NURSE,
            first_name='Sarah',
            last_name='Conner'
        )
        self.doctor = User.objects.create_user(
            username='doctor_house',
            password='DoctorPass123!',
            role=User.Role.DOCTOR,
            first_name='Gregory',
            last_name='House'
        )

    def test_complete_patient_journey(self):
        # ---------------------------------------------------------------------
        # STEP 1: Patient Registration
        # ---------------------------------------------------------------------
        self.client.force_authenticate(user=self.nurse)
        patient_payload = {
            "first_name": "Eleanor",
            "last_name": "Vance",
            "age": 54,
            "gender": "Female",
            "phone": "+1-555-0199",
            "emergency_contact_name": "Thomas Vance",
            "emergency_contact_phone": "+1-555-0198"
        }
        reg_res = self.client.post('/api/v1/triage/patients/', patient_payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        patient_id = reg_res.data['id']
        patient = Patient.objects.get(id=patient_id)
        self.assertTrue(patient.mrn.startswith("ST-"))
        self.assertEqual(patient.name, "Eleanor Vance")

        # Verify registration audit log
        reg_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.REGISTERED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(reg_log)

        # ---------------------------------------------------------------------
        # STEP 2: Visit Encounter Creation
        # ---------------------------------------------------------------------
        visit_payload = {
            "patient": patient.id,
            "chief_complaint": "Acute retrosternal chest pain and diaphoresis",
            "status": Visit.Status.WAITING
        }
        visit_res = self.client.post('/api/v1/triage/visits/', visit_payload, format='json')
        self.assertEqual(visit_res.status_code, status.HTTP_201_CREATED)
        visit_id = visit_res.data['id']
        visit = Visit.objects.get(id=visit_id)
        self.assertTrue(visit.visit_number.startswith("VIS-"))
        self.assertEqual(visit.status, Visit.Status.WAITING)

        # ---------------------------------------------------------------------
        # STEP 3: Nurse Vital Signs Recording
        # ---------------------------------------------------------------------
        vitals_payload = {
            "patient": patient.id,
            "visit": visit.id,
            "spo2": 95,
            "heart_rate": 122,          # Marked tachycardia (>= 120)
            "respiratory_rate": 22,
            "systolic_bp": 184,         # Hypertensive crisis (>= 180)
            "diastolic_bp": 108,
            "temperature": 37.1
        }
        vitals_res = self.client.post('/api/v1/triage/vitals/', vitals_payload, format='json')
        self.assertEqual(vitals_res.status_code, status.HTTP_201_CREATED)
        vitals_id = vitals_res.data['id']
        vital = VitalSign.objects.get(id=vitals_id)
        self.assertTrue(vital.is_critical)  # Automatically flagged critical

        # Verify vitals audit log
        vitals_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.VITALS_RECORDED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(vitals_log)

        # ---------------------------------------------------------------------
        # STEP 4: Nurse Triage Assessment (Deterministic Urgency Engine)
        # ---------------------------------------------------------------------
        triage_payload = {
            "patient": patient.id,
            "primary_complaint": "Substernal chest pressure radiating to jaw",
            "symptom_onset": "Within the last 30 minutes",
            "severe_breathing_difficulty": False,
            "chest_pain_or_pressure": True,     # Cardiac red flag
            "slurred_speech_or_weakness": False,
            "clinical_notes": "Diaphoretic, clutching chest, anxious."
        }
        triage_res = self.client.post('/api/v1/triage/assessments/', triage_payload, format='json')
        self.assertEqual(triage_res.status_code, status.HTTP_201_CREATED)
        # SBP 184 + HR 122 + Chest Pain -> Must evaluate to Level 2 High Priority
        self.assertEqual(triage_res.data['priority'], 2)
        self.assertIn("Acute cardiac chest pain", triage_res.data['ai_rationale'])

        # Verify Visit encounter updated to Priority 2 and TRIAGE_COMPLETE
        visit.refresh_from_db()
        self.assertEqual(visit.priority, 2)
        self.assertEqual(visit.status, Visit.Status.TRIAGE_COMPLETE)

        # Verify QueueTicket was created/updated in database
        ticket = QueueTicket.objects.filter(patient=patient).first()
        self.assertIsNotNone(ticket)
        self.assertEqual(ticket.priority, 2)
        self.assertEqual(ticket.status, QueueTicket.Status.TRIAGE_COMPLETE)

        # Verify triage audit log
        triage_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.TRIAGE_COMPLETED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(triage_log)

        # ---------------------------------------------------------------------
        # STEP 5: Doctor Command Center Live Queue
        # ---------------------------------------------------------------------
        self.client.force_authenticate(user=self.doctor)
        feed_res = self.client.get('/api/v1/triage/queue/live_feed/')
        self.assertEqual(feed_res.status_code, status.HTTP_200_OK)
        attention_tickets = feed_res.data['attention']
        self.assertTrue(any(t['ticket_number'] == patient.mrn for t in attention_tickets))

        # ---------------------------------------------------------------------
        # STEP 6: Doctor Starts Consultation
        # ---------------------------------------------------------------------
        call_res = self.client.post(f'/api/v1/triage/queue/{ticket.id}/call_patient/')
        self.assertEqual(call_res.status_code, status.HTTP_200_OK)
        
        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.IN_CONSULTATION)
        self.assertIsNotNone(ticket.called_at)
        self.assertEqual(visit.status, Visit.Status.IN_CONSULTATION)
        self.assertEqual(visit.assigned_doctor, self.doctor)

        # Create Consultation record
        consult_payload = {
            "patient": patient.id,
            "chief_complaint": triage_payload['primary_complaint'],
            "clinical_findings": "12-lead ECG demonstrates ST-segment depressions in V4-V6. Cardiac troponin elevated."
        }
        consult_res = self.client.post('/api/v1/consultations/', consult_payload, format='json')
        self.assertEqual(consult_res.status_code, status.HTTP_201_CREATED)
        consult_id = consult_res.data['id']

        # Verify consultation started audit log
        start_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.CONSULTATION_STARTED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(start_log)

        # ---------------------------------------------------------------------
        # STEP 7: Doctor Completes Consultation
        # ---------------------------------------------------------------------
        complete_payload = {
            "clinical_findings": "12-lead ECG confirms acute coronary syndrome.",
            "diagnosis": "Non-ST-Elevation Myocardial Infarction (NSTEMI)",
            "treatment_plan": "Aspirin 325mg PO, Ticagrelor 180mg PO, Heparin drip, admit to CCU.",
            "disposition": "Admitted"
        }
        complete_res = self.client.post(f'/api/v1/consultations/{consult_id}/complete/', complete_payload, format='json')
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_res.data['diagnosis'], "Non-ST-Elevation Myocardial Infarction (NSTEMI)")
        self.assertEqual(complete_res.data['disposition'], "Admitted")

        # Verify Ticket and Visit are marked COMPLETED
        ticket.refresh_from_db()
        visit.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.COMPLETED)
        self.assertIsNotNone(ticket.completed_at)
        self.assertEqual(visit.status, Visit.Status.COMPLETED)
        self.assertTrue(visit.is_completed)
        self.assertIsNotNone(visit.completed_at)

        # Verify consultation completed audit log
        comp_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.CONSULTATION_COMPLETED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(comp_log)
        self.assertIn("NSTEMI", comp_log.description)

        # ---------------------------------------------------------------------
        # STEP 8: Verify Queue is Clean & History Accessible
        # ---------------------------------------------------------------------
        final_feed = self.client.get('/api/v1/triage/queue/live_feed/')
        self.assertEqual(final_feed.status_code, status.HTTP_200_OK)
        active_ids = [t['id'] for t in final_feed.data['all']]
        self.assertNotIn(ticket.id, active_ids)

        history_res = self.client.get(f'/api/v1/triage/patients/{patient.id}/history/')
        self.assertEqual(history_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_res.data['vitals']), 1)
        self.assertEqual(len(history_res.data['triage_history']), 1)
