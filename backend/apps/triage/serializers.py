from rest_framework import serializers
from .models import Patient, VitalSign, TriageAssessment, QueueTicket, Visit, HealthReport

class VitalSignSerializer(serializers.ModelSerializer):
    display_vital = serializers.CharField(read_only=True)
    bp_display = serializers.CharField(read_only=True)

    class Meta:
        model = VitalSign
        fields = [
            'id', 'patient', 'recorded_by', 'spo2', 'heart_rate',
            'respiratory_rate', 'systolic_bp', 'diastolic_bp',
            'temperature', 'is_critical', 'recorded_at',
            'display_vital', 'bp_display'
        ]
        read_only_fields = ['id', 'is_critical', 'recorded_at', 'display_vital', 'bp_display']


class TriageAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriageAssessment
        fields = [
            'id', 'patient', 'assessed_by', 'priority', 'primary_complaint',
            'symptom_onset', 'severe_breathing_difficulty', 'chest_pain_or_pressure',
            'slurred_speech_or_weakness', 'clinical_notes', 'ai_suggested_priority',
            'ai_rationale', 'ai_summary', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class HealthReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = HealthReport
        fields = [
            'id', 'patient', 'patient_name', 'visit', 'uploaded_by', 'uploaded_by_name',
            'report_type', 'title', 'description', 'file', 'file_url', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_by_name', 'patient_name', 'file_url', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


from drf_spectacular.utils import extend_schema_field

class PatientSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    latest_vitals = serializers.SerializerMethodField()
    active_assessment = serializers.SerializerMethodField()
    health_reports = HealthReportSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'first_name', 'last_name', 'name', 'initials', 'mrn',
            'age', 'gender', 'date_of_birth', 'phone', 'email', 'address',
            'emergency_contact_name', 'emergency_contact_phone',
            'registered_at', 'created_at', 'latest_vitals', 'active_assessment', 'health_reports'
        ]
        read_only_fields = ['id', 'name', 'initials', 'registered_at', 'created_at', 'health_reports']
        extra_kwargs = {
            'mrn': {'required': False},
            'user': {'required': False, 'allow_null': True}
        }

    @extend_schema_field(VitalSignSerializer)
    def get_latest_vitals(self, obj):
        v = obj.vital_signs.first()
        return VitalSignSerializer(v).data if v else None

    @extend_schema_field(TriageAssessmentSerializer)
    def get_active_assessment(self, obj):
        a = obj.triage_assessments.first()
        return TriageAssessmentSerializer(a).data if a else None


class QueueTicketSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    name = serializers.CharField(source='patient.name', read_only=True)
    initials = serializers.CharField(source='patient.initials', read_only=True)
    age = serializers.IntegerField(source='patient.age', read_only=True)
    gender = serializers.CharField(source='patient.gender', read_only=True)
    complaint = serializers.SerializerMethodField()
    vital = serializers.SerializerMethodField()
    wait = serializers.CharField(source='wait_time_display', read_only=True)
    room = serializers.CharField(source='assigned_room', read_only=True)

    class Meta:
        model = QueueTicket
        fields = [
            'id', 'ticket_number', 'patient_id', 'name', 'initials', 'age', 'gender',
            'complaint', 'priority', 'vital', 'wait', 'status', 'room',
            'arrived_at', 'estimated_wait_minutes', 'called_at'
        ]

    @extend_schema_field(serializers.CharField)
    def get_complaint(self, obj):
        if obj.triage_assessment:
            return obj.triage_assessment.primary_complaint
        first_triage = obj.patient.triage_assessments.first()
        return first_triage.primary_complaint if first_triage else "Pending triage"

    @extend_schema_field(serializers.CharField)
    def get_vital(self, obj):
        v = obj.patient.vital_signs.first()
        return v.display_vital if v else "Normal"


class VisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_mrn = serializers.CharField(source='patient.mrn', read_only=True)
    assigned_doctor_name = serializers.CharField(source='assigned_doctor.display_name', read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id', 'visit_number', 'patient', 'patient_name', 'patient_mrn',
            'chief_complaint', 'status', 'priority', 'assigned_doctor',
            'assigned_doctor_name', 'facility', 'is_completed',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'visit_number', 'created_at', 'completed_at']
        extra_kwargs = {
            'visit_number': {'required': False}
        }
