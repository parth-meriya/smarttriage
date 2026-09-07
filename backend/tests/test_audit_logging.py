from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.facilities.models import Facility
from apps.triage.models import Patient, VitalSign, TriageAssessment
from apps.consultations.models import Consultation
from apps.analytics.models import ActivityLog

User = get_user_model()

class ClinicalAuditLoggingTests(TestCase):
    def setUp(self):
        self.facility = Facility.objects.create(name="St. Jude Hospital", code="SJH-01")
        self.doctor = User.objects.create_user(
            username='audit_doc',
            password='DocPassword123!',
            role=User.Role.DOCTOR,
            first_name='Leonard',
            last_name='McCoy'
        )
        self.nurse = User.objects.create_user(
            username='audit_nurse',
            password='NursePassword123!',
            role=User.Role.NURSE,
            first_name='Christine',
            last_name='Chapel'
        )

    def test_full_clinical_audit_lifecycle(self):
        """Every stage of patient clinical lifecycle records an immutable audit log."""
        # 1. Patient Registration
        patient = Patient.objects.create(
            first_name="James", last_name="Kirk", age=40, mrn="ST-AUDIT-01"
        )
        reg_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.REGISTERED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(reg_log)
        self.assertIn("ST-AUDIT-01", reg_log.description)

        # 2. Vitals Recorded
        vitals = VitalSign.objects.create(
            patient=patient,
            recorded_by=self.nurse,
            spo2=96,
            heart_rate=88,
            systolic_bp=128,
            diastolic_bp=82
        )
        vitals_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.VITALS_RECORDED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(vitals_log)
        self.assertEqual(vitals_log.actor, self.nurse)
        self.assertIn("SpO₂ 96%", vitals_log.description)

        # 3. Triage Assessment
        assessment = TriageAssessment.objects.create(
            patient=patient,
            assessed_by=self.nurse,
            priority=2,
            primary_complaint="Severe right shoulder dislocation"
        )
        triage_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.TRIAGE_COMPLETED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(triage_log)
        self.assertEqual(triage_log.actor, self.nurse)
        self.assertIn("Level 2", triage_log.description)

        # 4. Consultation Started
        consultation = Consultation.objects.create(
            patient=patient,
            doctor=self.doctor,
            chief_complaint=assessment.primary_complaint
        )
        start_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.CONSULTATION_STARTED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(start_log)
        self.assertEqual(start_log.actor, self.doctor)

        # 5. Consultation Completed
        consultation.completed_at = timezone.now()
        consultation.diagnosis = "Anterior glenohumeral dislocation"
        consultation.disposition = Consultation.Disposition.OBSERVATION
        consultation.save()

        comp_log = ActivityLog.objects.filter(
            event_type=ActivityLog.EventType.CONSULTATION_COMPLETED,
            patient_name=patient.name
        ).first()
        self.assertIsNotNone(comp_log)
        self.assertEqual(comp_log.actor, self.doctor)
        self.assertIn("Anterior glenohumeral dislocation", comp_log.description)
