import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import QueueTicket, TriageAssessment, VitalSign

logger = logging.getLogger(__name__)

def broadcast_message(message_type: str, data: dict):
    """Safely broadcasts a message to the triage_queue_updates group."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "triage_queue_updates",
                {
                    "type": message_type,
                    "data": data,
                }
            )
    except Exception as e:
        logger.warning(f"Failed to broadcast WebSocket event {message_type}: {e}")

@receiver(post_save, sender=QueueTicket)
def on_queue_ticket_saved(sender, instance, created, **kwargs):
    event = "ticket_created" if created else "ticket_updated"
    data = {
        "event": event,
        "ticket_id": instance.id,
        "ticket_number": instance.ticket_number,
        "patient_name": instance.patient.name,
        "priority": instance.priority,
        "status": instance.status,
    }
    broadcast_message("queue_updated", data)

    if instance.priority == 1 and instance.status != QueueTicket.Status.COMPLETED:
        broadcast_message("emergency_alert", {
            "ticket_id": instance.id,
            "patient_name": instance.patient.name,
            "complaint": instance.triage_assessment.primary_complaint if instance.triage_assessment else "Emergency assessment",
            "priority": 1,
            "priority_label": "Emergency",
        })

@receiver(post_delete, sender=QueueTicket)
def on_queue_ticket_deleted(sender, instance, **kwargs):
    broadcast_message("queue_updated", {
        "event": "ticket_deleted",
        "ticket_id": instance.id,
    })

@receiver(post_save, sender=TriageAssessment)
def on_triage_assessment_saved(sender, instance, created, **kwargs):
    broadcast_message("queue_updated", {
        "event": "triage_assessed",
        "patient_id": instance.patient.id,
        "priority": instance.priority,
    })

@receiver(post_save, sender=VitalSign)
def on_vital_sign_saved(sender, instance, created, **kwargs):
    broadcast_message("queue_updated", {
        "event": "vitals_recorded",
        "patient_id": instance.patient.id,
        "is_critical": instance.is_critical,
    })
