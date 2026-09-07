from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.triage.models import Patient
import datetime

User = get_user_model()

class PatientManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.nurse = User.objects.create_user(
            username='nurse_pat_test',
            password='NursePass123!',
            role=User.Role.NURSE
        )
        self.client.force_authenticate(user=self.nurse)

    def test_create_patient(self):
        """Verifies creating a patient with all required fields and auto-MRN generation."""
        payload = {
            "first_name": "Marcus",
            "last_name": "Vance",
            "age": 38,
            "gender": "Male",
            "date_of_birth": "1988-04-12",
            "phone": "(555) 234-5678",
            "email": "marcus.vance@example.com",
            "address": "742 Evergreen Terrace",
            "emergency_contact_name": "Clara Vance",
            "emergency_contact_phone": "(555) 987-6543"
        }
        response = self.client.post('/api/v1/triage/patients/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Marcus Vance')
        self.assertEqual(response.data['initials'], 'MV')
        self.assertTrue(response.data['mrn'].startswith('ST-'))
        self.assertEqual(response.data['emergency_contact_name'], 'Clara Vance')

    def test_get_patient(self):
        """Verifies retrieving a patient record by ID."""
        patient = Patient.objects.create(
            first_name="Beatrice",
            last_name="Hall",
            age=52,
            gender="Female",
            mrn="ST-TEST-BH"
        )
        response = self.client.get(f'/api/v1/triage/patients/{patient.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Beatrice Hall')
        self.assertEqual(response.data['mrn'], 'ST-TEST-BH')

    def test_update_patient(self):
        """Verifies updating patient contact and demographic info."""
        patient = Patient.objects.create(
            first_name="Leon",
            last_name="Kennedy",
            age=27,
            mrn="ST-TEST-LK"
        )
        patch_payload = {
            "phone": "(555) 777-8888",
            "emergency_contact_name": "Claire Redfield"
        }
        response = self.client.patch(f'/api/v1/triage/patients/{patient.id}/', patch_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '(555) 777-8888')
        self.assertEqual(response.data['emergency_contact_name'], 'Claire Redfield')

    def test_search_and_list_patients(self):
        """Verifies patient list with search query filtering."""
        Patient.objects.create(first_name="UniqueNameAlice", last_name="Smith", age=30, mrn="ST-SRCH-1")
        Patient.objects.create(first_name="Bob", last_name="Johnson", age=40, mrn="ST-SRCH-2")

        # Search by unique first name
        response = self.client.get('/api/v1/triage/patients/?search=UniqueNameAlice')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['first_name'], 'UniqueNameAlice')

        # Search by MRN
        response_mrn = self.client.get('/api/v1/triage/patients/?search=ST-SRCH-2')
        self.assertEqual(response_mrn.status_code, status.HTTP_200_OK)
        results_mrn = response_mrn.data.get('results', response_mrn.data)
        self.assertEqual(len(results_mrn), 1)
        self.assertEqual(results_mrn[0]['mrn'], 'ST-SRCH-2')

    def test_patient_history_endpoint(self):
        """Verifies the patient history sub-resource endpoint."""
        patient = Patient.objects.create(first_name="Diana", last_name="Prince", age=32, mrn="ST-HIST-1")
        response = self.client.get(f'/api/v1/triage/patients/{patient.id}/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('patient', response.data)
        self.assertIn('vitals', response.data)
        self.assertIn('triage_history', response.data)
        self.assertIn('visits', response.data)
