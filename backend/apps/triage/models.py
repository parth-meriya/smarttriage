from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.facilities.models import Facility

class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = 'Male', 'Male'
        FEMALE = 'Female', 'Female'
        OTHER = 'Other', 'Other'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    initials = models.CharField(max_length=8, blank=True)
    mrn = models.CharField(max_length=50, unique=True, help_text="Medical Record Number (e.g. ST-2048)")
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.MALE)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    registered_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-registered_at']

    def save(self, *args, **kwargs):
        if not self.initials:
            self.initials = f"{self.first_name[:1]}{self.last_name[:1]}".upper()
        super().save(*args, **kwargs)

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.name} ({self.mrn})"


class VitalSign(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='vital_signs')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_vitals'
    )
    spo2 = models.PositiveIntegerField(help_text="Oxygen saturation %", null=True, blank=True)
    heart_rate = models.PositiveIntegerField(help_text="Heart rate bpm", null=True, blank=True)
    respiratory_rate = models.PositiveIntegerField(help_text="Breaths per minute", null=True, blank=True)
    systolic_bp = models.PositiveIntegerField(help_text="Systolic blood pressure mmHg", null=True, blank=True)
    diastolic_bp = models.PositiveIntegerField(help_text="Diastolic blood pressure mmHg", null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, help_text="Body temperature Celsius", null=True, blank=True)
    is_critical = models.BooleanField(default=False)
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        # Automatic critical vitals calculation
        critical = False
        if self.spo2 and self.spo2 < 90:
            critical = True
        if self.heart_rate and (self.heart_rate > 120 or self.heart_rate < 50):
            critical = True
        if self.respiratory_rate and (self.respiratory_rate > 24 or self.respiratory_rate < 10):
            critical = True
        if self.systolic_bp and (self.systolic_bp > 180 or self.systolic_bp < 90):
            critical = True
        self.is_critical = critical
        super().save(*args, **kwargs)

    @property
    def bp_display(self):
        if self.systolic_bp and self.diastolic_bp:
            return f"BP {self.systolic_bp}/{self.diastolic_bp}"
        return None

    @property
    def display_vital(self):
        """Returns the primary salient vital formatted for UI badges."""
        if self.spo2 and self.spo2 < 92:
            return f"SpO₂ {self.spo2}%"
        if self.systolic_bp and self.systolic_bp >= 160:
            return f"BP {self.systolic_bp}/{self.diastolic_bp}"
        if self.heart_rate and self.heart_rate > 100:
            return f"HR {self.heart_rate} bpm"
        if self.temperature and self.temperature >= 38.0:
            return f"Temp {self.temperature}°C"
        return "Normal"

    def __str__(self):
        return f"Vitals for {self.patient.name} at {self.recorded_at.strftime('%H:%M')}"


class TriageAssessment(models.Model):
    class Priority(models.IntegerChoices):
        LEVEL_1 = 1, 'Emergency (Immediate)'
        LEVEL_2 = 2, 'High Priority (Needs Review)'
        LEVEL_3 = 3, 'Urgent'
        LEVEL_4 = 4, 'Non-urgent'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='triage_assessments')
    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triage_assessments'
    )
    priority = models.IntegerField(choices=Priority.choices, default=Priority.LEVEL_3)
    primary_complaint = models.CharField(max_length=255)
    symptom_onset = models.CharField(max_length=150, default="About 30 minutes ago")
    severe_breathing_difficulty = models.BooleanField(default=False)
    chest_pain_or_pressure = models.BooleanField(default=False)
    slurred_speech_or_weakness = models.BooleanField(default=False)
    clinical_notes = models.TextField(blank=True)

    # Explainable AI triage decision support
    ai_suggested_priority = models.IntegerField(choices=Priority.choices, null=True, blank=True)
    ai_rationale = models.TextField(blank=True)
    ai_summary = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Triage L{self.priority} for {self.patient.name}: {self.primary_complaint}"


class QueueTicket(models.Model):
    class Status(models.TextChoices):
        WAITING = 'Waiting', 'Waiting'
        TRIAGE_IN_PROGRESS = 'Triage in progress', 'Triage in progress'
        TRIAGE_COMPLETE = 'Triage complete', 'Triage complete'
        IN_CONSULTATION = 'In consultation', 'In consultation'
        COMPLETED = 'Completed', 'Completed'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='queue_tickets')
    triage_assessment = models.OneToOneField(
        TriageAssessment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket'
    )
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='queue_tickets')
    ticket_number = models.CharField(max_length=30)
    priority = models.IntegerField(choices=TriageAssessment.Priority.choices, default=TriageAssessment.Priority.LEVEL_3)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.WAITING)
    assigned_room = models.CharField(max_length=50, default="A-01")
    arrived_at = models.DateTimeField(default=timezone.now)
    estimated_wait_minutes = models.PositiveIntegerField(default=15)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['priority', 'arrived_at']

    @property
    def wait_time_display(self):
        delta = timezone.now() - self.arrived_at
        minutes = int(delta.total_seconds() // 60)
        return f"{minutes} min"

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.patient.name} (L{self.priority} {self.status})"
