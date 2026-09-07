from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from datetime import timedelta
from django.utils import timezone
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from apps.triage.models import QueueTicket, Patient
from apps.accounts.models import User
from apps.accounts.permissions import IsClinicalStaff

class OperationsMetricsView(APIView):
    permission_classes = [IsClinicalStaff]

    def get(self, request):
        today = timezone.now().date()

        # Operational metrics
        total_arrivals = Patient.objects.filter(registered_at__date=today).count()

        active_tickets = QueueTicket.objects.exclude(status=QueueTicket.Status.COMPLETED)
        waiting_count = active_tickets.filter(status=QueueTicket.Status.WAITING).count()
        in_triage_count = active_tickets.filter(status=QueueTicket.Status.TRIAGE_IN_PROGRESS).count()
        with_doctor_count = active_tickets.filter(status=QueueTicket.Status.IN_CONSULTATION).count()
        completed_count = QueueTicket.objects.filter(status=QueueTicket.Status.COMPLETED).count()

        active_nurses = User.objects.filter(role=User.Role.NURSE, is_available=True).count()

        # Dynamic subtexts
        yesterday_count = Patient.objects.filter(registered_at__date=today - timedelta(days=1)).count()
        arrivals_delta_value = total_arrivals - yesterday_count
        arrivals_delta = f'{arrivals_delta_value:+d} from yesterday'

        under_30 = active_tickets.filter(arrived_at__gte=timezone.now() - timedelta(minutes=30)).count()
        rooms = active_tickets.filter(status=QueueTicket.Status.IN_CONSULTATION).values('assigned_room').distinct().count()

        # Priority breakdown
        emergency = active_tickets.filter(priority=1).count()
        high_priority = active_tickets.filter(priority=2).count()
        urgent = active_tickets.filter(priority=3).count()
        non_urgent = active_tickets.filter(priority=4).count()

        # Recent activities
        recent_logs = ActivityLog.objects.all()[:10]
        activity_data = ActivityLogSerializer(recent_logs, many=True).data

        return Response({
            'operations': {
                'arrivals': total_arrivals,
                'arrivals_delta': arrivals_delta,
                'waiting': waiting_count,
                'waiting_subtext': f'{under_30} under 30 min',
                'in_triage': in_triage_count,
                'in_triage_subtext': f'{active_nurses} nurses active',
                'with_doctor': with_doctor_count,
                'with_doctor_subtext': f'{rooms} rooms occupied',
                'completed': completed_count,
                'completed_subtext': 'Today'
            },
            'queue_overview': [
                {'label': 'Emergency', 'count': emergency, 'color': 'red'},
                {'label': 'High priority', 'count': high_priority, 'color': 'amber'},
                {'label': 'Urgent', 'count': urgent, 'color': 'gold'},
                {'label': 'Non-urgent', 'count': non_urgent, 'color': 'teal'},
            ],
            'recent_activity': activity_data
        })
