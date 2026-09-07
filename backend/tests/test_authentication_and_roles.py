from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.triage.models import Patient
from apps.facilities.models import Facility

User = get_user_model()

class AuthenticationAndRolesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="Northside Medical Center", code="NMC-ED")
        
        # Test users for each role
        self.doctor = User.objects.create_user(
            username='doctor_test',
            password='DoctorPass123!',
            first_name='Elena',
            last_name='Rostova',
            role=User.Role.DOCTOR
        )
        self.nurse = User.objects.create_user(
            username='nurse_test',
            password='NursePass123!',
            first_name='Alex',
            last_name='Chen',
            role=User.Role.NURSE
        )
        self.patient_user = User.objects.create_user(
            username='patient_test',
            password='PatientPass123!',
            first_name='John',
            last_name='Smith',
            role=User.Role.PATIENT
        )
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='AdminPass123!',
            first_name='Sarah',
            last_name='Connor',
            role=User.Role.ADMIN
        )
        self.patient_record = Patient.objects.create(
            first_name="John",
            last_name="Smith",
            mrn="ST-TEST-01",
            age=45
        )

    def test_user_registration(self):
        """Verifies public registration endpoint creates user and returns JWT."""
        payload = {
            "username": "new_patient",
            "password": "SecurePassword123!",
            "first_name": "Alice",
            "last_name": "Wonder",
            "email": "alice@example.com",
            "role": "Patient"
        }
        response = self.client.post('/api/v1/accounts/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'new_patient')
        self.assertEqual(response.data['user']['initials'], 'AW')

    def test_user_login(self):
        """Verifies login endpoint accepts valid credentials and returns profile."""
        payload = {
            "username": "doctor_test",
            "password": "DoctorPass123!"
        }
        response = self.client.post('/api/v1/accounts/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['role'], 'Doctor')

    def test_unauthenticated_requests_rejected(self):
        """Verifies protected endpoints reject unauthenticated access."""
        response = self.client.get('/api/v1/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patient_cannot_access_clinical_operations(self):
        """Verifies patients cannot access staff operations analytics."""
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get('/api/v1/analytics/operations/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_record_vitals(self):
        """Verifies patients cannot create vital sign clinical records."""
        self.client.force_authenticate(user=self.patient_user)
        payload = {
            "patient": self.patient_record.id,
            "spo2": 98,
            "heart_rate": 72
        }
        response = self.client.post('/api/v1/triage/vitals/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nurse_can_record_vitals_and_view_operations(self):
        """Verifies nurse can record vitals and view operations."""
        self.client.force_authenticate(user=self.nurse)
        ops_response = self.client.get('/api/v1/analytics/operations/')
        self.assertEqual(ops_response.status_code, status.HTTP_200_OK)

        vitals_payload = {
            "patient": self.patient_record.id,
            "spo2": 95,
            "heart_rate": 80,
            "systolic_bp": 120,
            "diastolic_bp": 80
        }
        vitals_response = self.client.post('/api/v1/triage/vitals/', vitals_payload, format='json')
        self.assertEqual(vitals_response.status_code, status.HTTP_201_CREATED)

    def test_doctor_can_manage_consultations(self):
        """Verifies doctor has full access to consultation workflows."""
        self.client.force_authenticate(user=self.doctor)
        payload = {
            "patient": self.patient_record.id,
            "chief_complaint": "Acute headache",
            "clinical_findings": "Normal neurological exam",
            "diagnosis": "Tension headache",
            "treatment_plan": "Analgesics, follow-up if persistent"
        }
        response = self.client.post('/api/v1/consultations/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
