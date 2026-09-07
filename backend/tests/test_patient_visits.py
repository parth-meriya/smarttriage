from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.triage.models import Patient, Visit

User = get_user_model()

class PatientVisitsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.nurse = User.objects.create_user(
            username='nurse_visit_test',
            password='NursePass123!',
            role=User.Role.NURSE
        )
        self.doctor = User.objects.create_user(
            username='doc_visit_test',
            password='DoctorPass123!',
            role=User.Role.DOCTOR,
            first_name='Stephen',
            last_name='Strange'
        )
        self.client.force_authenticate(user=self.nurse)
        self.patient = Patient.objects.create(
            first_name="Arthur",
            last_name="Dent",
            age=42,
            mrn="ST-VIS-PAT-01"
        )

    def test_create_visit_encounter(self):
        """Verifies creating a visit for a patient with auto-generated visit number."""
        payload = {
            "patient": self.patient.id,
            "chief_complaint": "Persistent abdominal discomfort",
            "priority": 3,
            "status": "Waiting"
        }
        response = self.client.post('/api/v1/triage/visits/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['patient'], self.patient.id)
        self.assertEqual(response.data['patient_name'], 'Arthur Dent')
        self.assertTrue(response.data['visit_number'].startswith('VIS-'))
        self.assertFalse(response.data['is_completed'])

    def test_patient_multiple_visits(self):
        """Verifies a single patient can have multiple historical visits."""
        visit1 = Visit.objects.create(
            patient=self.patient,
            chief_complaint="Sprained ankle (resolved)",
            status=Visit.Status.COMPLETED,
            is_completed=True
        )
        visit2 = Visit.objects.create(
            patient=self.patient,
            chief_complaint="Acute bronchitis",
            status=Visit.Status.WAITING
        )
        response = self.client.get(f'/api/v1/triage/visits/?patient={self.patient.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_complete_visit_action(self):
        """Verifies complete_visit action marks visit completed and sets completion timestamp."""
        visit = Visit.objects.create(
            patient=self.patient,
            chief_complaint="Severe migraine",
            status=Visit.Status.IN_CONSULTATION,
            assigned_doctor=self.doctor
        )
        response = self.client.post(f'/api/v1/triage/visits/{visit.id}/complete_visit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Completed')
        self.assertTrue(response.data['is_completed'])
        self.assertIsNotNone(response.data['completed_at'])
