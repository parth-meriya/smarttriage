from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.triage.models import Patient, Visit, QueueTicket, VitalSign, TriageAssessment
from apps.triage.engine import evaluate_triage
from apps.facilities.models import Facility

User = get_user_model()

class TriageEngineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="Northside Medical Center", code="NMC-01")
        self.nurse = User.objects.create_user(
            username='nurse_engine_test',
            password='NursePass123!',
            role=User.Role.NURSE
        )
        self.client.force_authenticate(user=self.nurse)
        self.patient = Patient.objects.create(
            first_name="Gordon",
            last_name="Freeman",
            age=35,
            mrn="ST-ENG-01"
        )

    def test_engine_rule_level_1_hypoxia(self):
        """SpO2 < 90% must evaluate strictly to Level 1 Emergency."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Shortness of breath",
            spo2=86,
            heart_rate=110
        )
        self.assertEqual(priority, 1)
        self.assertIn("Critical hypoxia (SpO₂ 86%)", risks)

    def test_engine_rule_level_1_respiratory_distress(self):
        """Severe breathing difficulty must evaluate strictly to Level 1 Emergency."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Difficulty breathing",
            severe_breathing_difficulty=True,
            spo2=96
        )
        self.assertEqual(priority, 1)
        self.assertIn("Acute respiratory distress reported", risks)

    def test_engine_rule_level_2_chest_pain(self):
        """Acute chest pain must evaluate strictly to Level 2 High Priority."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Chest pressure radiating to jaw",
            chest_pain_or_pressure=True,
            spo2=98
        )
        self.assertEqual(priority, 2)
        self.assertIn("Acute cardiac chest pain symptoms", risks)

    def test_engine_rule_level_2_hypertensive_crisis(self):
        """Systolic BP >= 180 mmHg must evaluate strictly to Level 2 High Priority."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Headache",
            systolic_bp=195,
            diastolic_bp=115
        )
        self.assertEqual(priority, 2)
        self.assertTrue(any("Hypertensive crisis" in r for r in risks))

    def test_engine_rule_level_3_febrile(self):
        """Temperature >= 38.0°C must evaluate to Level 3 Urgent."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Fever and chills",
            temperature=38.9
        )
        self.assertEqual(priority, 3)
        self.assertTrue(any("Febrile state" in r for r in risks))

    def test_engine_rule_level_4_stable(self):
        """Mild symptoms with normal vitals must evaluate to Level 4 Non-urgent."""
        priority, rationale, risks = evaluate_triage(
            primary_complaint="Minor finger scrape",
            spo2=99,
            heart_rate=72,
            temperature=36.6
        )
        self.assertEqual(priority, 4)
        self.assertEqual(len(risks), 0)

    def test_questionnaire_api_endpoint(self):
        """Verifies GET /api/v1/triage/assessments/questions/ returns questions structure."""
        response = self.client.get('/api/v1/triage/assessments/questions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 5)
        question_ids = [q['id'] for q in response.data]
        self.assertIn('primary_complaint', question_ids)
        self.assertIn('severe_breathing_difficulty', question_ids)
        self.assertIn('chest_pain_or_pressure', question_ids)

    def test_triage_and_vitals_integration_workflow(self):
        """
        Verifies end-to-end flow:
        Record vitals -> Submit triage -> Urgency engine assigns priority -> Updates Visit & QueueTicket.
        """
        # 1. Record abnormal vitals
        vitals_payload = {
            "patient": self.patient.id,
            "spo2": 88,
            "heart_rate": 115,
            "respiratory_rate": 28
        }
        v_res = self.client.post('/api/v1/triage/vitals/', vitals_payload, format='json')
        self.assertEqual(v_res.status_code, status.HTTP_201_CREATED)

        # 2. Submit triage assessment
        assessment_payload = {
            "patient": self.patient.id,
            "primary_complaint": "Acute wheezing and chest tightness",
            "symptom_onset": "Within the last 30 minutes",
            "severe_breathing_difficulty": True,
            "chest_pain_or_pressure": False,
            "slurred_speech_or_weakness": False
        }
        t_res = self.client.post('/api/v1/triage/assessments/', assessment_payload, format='json')
        self.assertEqual(t_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(t_res.data['priority'], 1)

        # 3. Verify Visit encounter was updated to Priority 1
        visit = Visit.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(visit)
        self.assertEqual(visit.priority, 1)
        self.assertEqual(visit.status, Visit.Status.TRIAGE_COMPLETE)

        # 4. Verify QueueTicket was updated to Priority 1
        ticket = QueueTicket.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(ticket)
        self.assertEqual(ticket.priority, 1)
        self.assertEqual(ticket.status, QueueTicket.Status.TRIAGE_COMPLETE)
