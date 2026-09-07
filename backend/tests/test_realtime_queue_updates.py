from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from django.utils import timezone
from apps.facilities.models import Facility
from apps.triage.models import Patient, Visit, QueueTicket, TriageAssessment, VitalSign
from apps.consultations.models import Consultation

User = get_user_model()

class RealtimeQueueBroadcastTests(TestCase):
    def setUp(self):
        self.facility = Facility.objects.create(name="Central Trauma", code="CT-01")
        self.doctor = User.objects.create_user(
            username='dr_broadcaster',
            password='DocPassword123!',
            role=User.Role.DOCTOR,
            first_name='Stephen',
            last_name='Strange'
        )
        self.patient = Patient.objects.create(
            first_name="Wanda",
            last_name="Maximoff",
            age=32,
            mrn="ST-RT-01"
        )

    @patch('apps.triage.signals.broadcast_message')
    def test_emergency_ticket_triggers_emergency_alert(self, mock_broadcast):
        """Priority 1 ticket must trigger both queue_updated and emergency_alert."""
        ticket = QueueTicket.objects.create(
            patient=self.patient,
            facility=self.facility,
            ticket_number="EMERG-01",
            priority=1,
            status=QueueTicket.Status.WAITING
        )
        # Verify broadcast_message was called
        calls = [call[0][0] for call in mock_broadcast.call_args_list]
        self.assertIn("queue_updated", calls)
        self.assertIn("emergency_alert", calls)

    @patch('apps.triage.signals.broadcast_message')
    def test_vital_sign_recording_triggers_queue_update(self, mock_broadcast):
        """Recording vital signs triggers a queue_updated broadcast."""
        VitalSign.objects.create(
            patient=self.patient,
            spo2=98,
            heart_rate=72
        )
        mock_broadcast.assert_called_with("queue_updated", {
            "event": "vitals_recorded",
            "patient_id": self.patient.id,
            "is_critical": False,
        })

    @patch('apps.triage.signals.broadcast_message')
    def test_visit_update_triggers_queue_update(self, mock_broadcast):
        """Visit creation/update triggers real-time queue_updated event."""
        visit = Visit.objects.create(
            patient=self.patient,
            chief_complaint="Dizziness",
            priority=3,
            status=Visit.Status.WAITING
        )
        calls = [call[0][1]['event'] for call in mock_broadcast.call_args_list if call[0][0] == 'queue_updated']
        self.assertIn("visit_created", calls)

    @patch('apps.consultations.signals.get_channel_layer')
    def test_consultation_triggers_realtime_broadcast(self, mock_get_channel_layer):
        """Consultation lifecycle broadcasts to triage_queue_updates group."""
        from unittest.mock import AsyncMock, MagicMock
        mock_layer = MagicMock()
        mock_layer.group_send = AsyncMock()
        mock_get_channel_layer.return_value = mock_layer

        consultation = Consultation.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            chief_complaint="Dizziness and lightheadedness"
        )
        # Should have sent consultation_started
        self.assertTrue(mock_layer.group_send.called)
        first_call_args = mock_layer.group_send.call_args_list[0]
        self.assertEqual(first_call_args[0][0], "triage_queue_updates")
        self.assertEqual(first_call_args[0][1]['data']['event'], "consultation_started")
