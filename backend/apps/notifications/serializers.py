from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    time_display = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'level',
            'is_read', 'action_url', 'created_at', 'time_display'
        ]
        read_only_fields = ['id', 'created_at', 'time_display']

    def get_time_display(self, obj):
        from django.utils.timesince import timesince
        return f"{timesince(obj.created_at)} ago"
