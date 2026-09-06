from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    time_display = serializers.CharField(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'time_display', 'event_type', 'patient_name', 'description', 'timestamp']
