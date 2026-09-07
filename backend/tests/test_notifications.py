from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.facilities.models import Facility
from apps.triage.models import Patient, QueueTicket
from apps.notifications.models import Notification

User = get_user_model()

class NotificationSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.facility = Facility.objects.create(name="City Central", code="CC-01")
        self.doctor = User.objects.create_user(
            username='notif_doctor',
            password='DocPassword123!',
            role=User.Role.DOCTOR
        )
        self.nurse = User.objects.create_user(
            username='notif_nurse',
            password='NursePassword123!',
            role=User.Role.NURSE
        )
        self.patient = Patient.objects.create(
            first_name="Diana", last_name="Prince", age=30, mrn="ST-NOTIF-01"
        )

    def test_notification_creation_and_filtering(self):
        """User receives notifications targeted to them and broadcast notifications."""
        # 1. Target doctor
        Notification.objects.create(
            user=self.doctor,
            title="Assigned to Patient",
            message="You have been assigned to patient Diana Prince.",
            level=Notification.Level.INFO
        )
        # 2. Target nurse
        Notification.objects.create(
            user=self.nurse,
            title="Triage Request",
            message="Please complete triage for Diana Prince.",
            level=Notification.Level.WARNING
        )
        # 3. Broadcast to all
        Notification.objects.create(
            user=None,
            title="System Alert",
            message="Code blue announced in Ward B.",
            level=Notification.Level.CRITICAL
        )

        self.client.force_authenticate(user=self.doctor)
        res = self.client.get('/api/v1/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Doctor sees their own + broadcast (total 2)
        self.assertEqual(len(res.data), 2)
        titles = [n['title'] for n in res.data]
        self.assertIn("Assigned to Patient", titles)
        self.assertIn("System Alert", titles)
        self.assertNotIn("Triage Request", titles)

    def test_mark_notification_as_read(self):
        """POST /api/v1/notifications/{id}/mark_read/ marks notification as read."""
        notif = Notification.objects.create(
            user=self.doctor,
            title="Test Read",
            message="Test message",
            is_read=False
        )
        self.client.force_authenticate(user=self.doctor)
        res = self.client.post(f'/api/v1/notifications/{notif.id}/mark_read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read_and_unread_count(self):
        """mark_all_read marks all unread notifications, and unread_count reports accurately."""
        Notification.objects.create(user=self.doctor, title="N1", message="M1", is_read=False)
        Notification.objects.create(user=self.doctor, title="N2", message="M2", is_read=False)
        Notification.objects.create(user=self.doctor, title="N3", message="M3", is_read=True)

        self.client.force_authenticate(user=self.doctor)
        
        # Check count
        count_res = self.client.get('/api/v1/notifications/unread_count/')
        self.assertEqual(count_res.status_code, status.HTTP_200_OK)
        self.assertEqual(count_res.data['unread_count'], 2)

        # Mark all read
        mark_res = self.client.post('/api/v1/notifications/mark_all_read/')
        self.assertEqual(mark_res.status_code, status.HTTP_200_OK)

        # Re-check count
        count_res2 = self.client.get('/api/v1/notifications/unread_count/')
        self.assertEqual(count_res2.data['unread_count'], 0)

    def test_emergency_ticket_automatically_creates_notification(self):
        """A Priority 1 QueueTicket automatically persists a critical broadcast notification."""
        QueueTicket.objects.create(
            patient=self.patient,
            facility=self.facility,
            ticket_number="EMERG-AUTO-01",
            priority=1,
            status=QueueTicket.Status.WAITING
        )
        notif = Notification.objects.filter(
            level=Notification.Level.CRITICAL,
            title__contains="Emergency Alert"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("Diana Prince", notif.title)
        self.assertIn("emergency", notif.message.lower())
