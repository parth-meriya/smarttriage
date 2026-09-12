import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import QueueTicket, TriageAssessment, VitalSign, Visit

logger = logging.getLogger(__name__)


def broadcast_message(message_type: str, data: dict, group: str = "triage_queue_updates"):
    """Safely broadcasts a message to the given Channels group."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                group,
                {
                    "type": message_type,
                    "data": data,
                }
            )
    except Exception as e:
        logger.warning(f"Failed to broadcast WebSocket event {message_type}: {e}")


def _push_patient_queue_update(ticket):
    """Send a personalized queue snapshot to the ticket's patient socket group."""
    try:
        from .queue_service import serialize_queue_state
        broadcast_message(
            "patient_queue_update",
            serialize_queue_state(ticket),
            group=f"patient_queue_{ticket.patient_id}",
        )
    except Exception as e:
        logger.warning(f"Failed to push patient queue update: {e}")


@receiver(post_save, sender=QueueTicket)
def on_queue_ticket_saved(sender, instance, created, **kwargs):
    event = "ticket_created" if created else "ticket_updated"
    if instance.status == QueueTicket.Status.COMPLETED:
        event = "treatment_completed"
    elif instance.status == QueueTicket.Status.IN_CONSULTATION:
        event = "patient_in_consultation"

    data = {
        "event": event,
        "ticket_id": instance.id,
        "ticket_number": instance.ticket_number,
        "patient_id": instance.patient_id,
        "patient_name": instance.patient.name,
        "priority": instance.priority,
        "status": instance.status,
    }
    broadcast_message("queue_updated", data)

    # Push a personal queue snapshot to the affected patient's socket
    _push_patient_queue_update(instance)

    if instance.priority == 1 and instance.status != QueueTicket.Status.COMPLETED:
        complaint = instance.triage_assessment.primary_complaint if instance.triage_assessment else "Immediate clinical assessment required"
        broadcast_message("emergency_alert", {
            "ticket_id": instance.id,
            "patient_id": instance.patient_id,
            "patient_name": instance.patient.name,
            "complaint": complaint,
            "priority": 1,
            "priority_label": "Emergency",
            "status": instance.status,
        })
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(
                title=f"Emergency Alert: {instance.patient.name} (Level 1)",
                message=f"{instance.patient.name} requires immediate emergency evaluation: {complaint}",
                level=Notification.Level.CRITICAL,
                action_url=f"/patients/{instance.patient.id}"
            )
        except Exception as e:
            logger.warning(f"Failed to create emergency notification record: {e}")


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


@receiver(post_save, sender=Visit)
def on_visit_saved(sender, instance, created, **kwargs):
    broadcast_message("queue_updated", {
        "event": "visit_created" if created else "visit_updated",
        "visit_id": instance.id,
        "patient_id": instance.patient.id,
        "status": instance.status,
        "priority": instance.priority,
    })
