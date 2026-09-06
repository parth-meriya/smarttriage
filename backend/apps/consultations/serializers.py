from rest_framework import serializers
from .models import Consultation

class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.display_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = Consultation
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'started_at', 'completed_at', 'chief_complaint',
            'clinical_findings', 'diagnosis', 'treatment_plan', 'disposition'
        ]
        read_only_fields = ['id', 'started_at', 'doctor_name', 'patient_name']
