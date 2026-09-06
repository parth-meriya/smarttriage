from django.db import models
from django.conf import settings
from django.utils import timezone

class ActivityLog(models.Model):
    class EventType(models.TextChoices):
        REGISTERED = 'Patient registered', 'Patient registered'
        VITALS_RECORDED = 'Vitals recorded', 'Vitals recorded'
        TRIAGE_COMPLETED = 'Triage completed', 'Triage completed'
        CONSULTATION_STARTED = 'Consultation started', 'Consultation started'
        CONSULTATION_COMPLETED = 'Consultation completed', 'Consultation completed'

    event_type = models.CharField(max_length=100, choices=EventType.choices)
    patient_name = models.CharField(max_length=150)
    description = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    @property
    def time_display(self):
        return self.timestamp.strftime('%I:%M %p')

    def __str__(self):
        return f"{self.time_display} - {self.event_type} - {self.patient_name}"
