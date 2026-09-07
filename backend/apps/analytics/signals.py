import logging
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import ActivityLog
from apps.triage.models import Patient, VitalSign, TriageAssessment
from apps.consultations.models import Consultation

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Patient)
def audit_patient_registration(sender, instance, created, **kwargs):
    if created:
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.REGISTERED,
                patient_name=instance.name,
                description=f"MRN {instance.mrn} registered for care"
            )
        except Exception as e:
            logger.warning(f"Failed to create registration audit log: {e}")

@receiver(post_save, sender=VitalSign)
def audit_vitals_recorded(sender, instance, created, **kwargs):
    if created:
        try:
            details = []
            if instance.spo2:
                details.append(f"SpO₂ {instance.spo2}%")
            if instance.heart_rate:
                details.append(f"HR {instance.heart_rate} bpm")
            if instance.systolic_bp and instance.diastolic_bp:
                details.append(f"BP {instance.systolic_bp}/{instance.diastolic_bp}")
            summary = ", ".join(details) if details else "Baseline vitals"
            
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.VITALS_RECORDED,
                patient_name=instance.patient.name,
                actor=instance.recorded_by,
                description=summary
            )
        except Exception as e:
            logger.warning(f"Failed to create vitals audit log: {e}")

@receiver(post_save, sender=TriageAssessment)
def audit_triage_completed(sender, instance, created, **kwargs):
    if created:
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.TRIAGE_COMPLETED,
                patient_name=instance.patient.name,
                actor=instance.assessed_by,
                description=f"Prioritized as Level {instance.priority}: {instance.primary_complaint}"
            )
        except Exception as e:
            logger.warning(f"Failed to create triage audit log: {e}")

@receiver(post_save, sender=Consultation)
def audit_consultation_lifecycle(sender, instance, created, **kwargs):
    try:
        if created:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.CONSULTATION_STARTED,
                patient_name=instance.patient.name,
                actor=instance.doctor,
                description=f"Examination begun for {instance.chief_complaint}"
            )
        elif instance.completed_at:
            # Check if completion was already logged to prevent duplicates
            already_logged = ActivityLog.objects.filter(
                event_type=ActivityLog.EventType.CONSULTATION_COMPLETED,
                patient_name=instance.patient.name,
                timestamp__gte=instance.completed_at - timezone.timedelta(seconds=5) if hasattr(timezone, 'timedelta') else instance.completed_at
            ).exists()
            if not already_logged:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.CONSULTATION_COMPLETED,
                    patient_name=instance.patient.name,
                    actor=instance.doctor,
                    description=f"Diagnosis: {instance.diagnosis or 'Evaluated'} · Disposition: {instance.disposition}"
                )
    except Exception as e:
        logger.warning(f"Failed to create consultation audit log: {e}")
