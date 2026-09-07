import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Consultation

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Consultation)
def on_consultation_saved(sender, instance, created, **kwargs):
    """Safely broadcasts consultation lifecycle events to real-time subscribers."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            event = "consultation_started" if created else "consultation_updated"
            if instance.completed_at:
                event = "consultation_completed"
            async_to_sync(channel_layer.group_send)(
                "triage_queue_updates",
                {
                    "type": "queue_updated",
                    "data": {
                        "event": event,
                        "consultation_id": instance.id,
                        "patient_id": instance.patient.id,
                        "patient_name": instance.patient.name,
                        "doctor_name": instance.doctor.display_name if instance.doctor else "Doctor",
                        "completed": bool(instance.completed_at),
                    }
                }
            )
    except Exception as e:
        logger.warning(f"Failed to broadcast consultation event: {e}")
