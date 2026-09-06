from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.triage.models import Patient

class Consultation(models.Model):
    class Disposition(models.TextChoices):
        DISCHARGED = 'Discharged', 'Discharged home'
        ADMITTED = 'Admitted', 'Admitted to inpatient ward'
        OBSERVATION = 'Observation', 'Extended clinical observation'
        TRANSFERRED = 'Transferred', 'Transferred to tertiary facility'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='consultations'
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    chief_complaint = models.CharField(max_length=255)
    clinical_findings = models.TextField(blank=True)
    diagnosis = models.CharField(max_length=255, blank=True)
    treatment_plan = models.TextField(blank=True)
    disposition = models.CharField(
        max_length=50,
        choices=Disposition.choices,
        default=Disposition.DISCHARGED
    )

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Consultation for {self.patient.name} by {self.doctor.display_name if self.doctor else 'Unassigned'}"
