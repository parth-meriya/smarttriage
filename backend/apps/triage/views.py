from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Patient, VitalSign, TriageAssessment, QueueTicket
from .serializers import (
    PatientSerializer,
    VitalSignSerializer,
    TriageAssessmentSerializer,
    QueueTicketSerializer
)
from apps.accounts.permissions import IsClinicalStaff

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().prefetch_related('vital_signs', 'triage_assessments')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['first_name', 'last_name', 'mrn', 'phone']
    ordering_fields = ['registered_at', 'age']

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        patient = self.get_object()
        vitals = VitalSignSerializer(patient.vital_signs.all(), many=True).data
        assessments = TriageAssessmentSerializer(patient.triage_assessments.all(), many=True).data
        tickets = QueueTicketSerializer(patient.queue_tickets.all(), many=True).data
        return Response({
            'patient': PatientSerializer(patient).data,
            'vitals': vitals,
            'triage_history': assessments,
            'visits': tickets
        })


class VitalSignViewSet(viewsets.ModelViewSet):
    queryset = VitalSign.objects.all()
    serializer_class = VitalSignSerializer
    permission_classes = [IsClinicalStaff]
    filterset_fields = ['patient', 'is_critical']

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class TriageAssessmentViewSet(viewsets.ModelViewSet):
    queryset = TriageAssessment.objects.all()
    serializer_class = TriageAssessmentSerializer
    permission_classes = [IsClinicalStaff]
    filterset_fields = ['patient', 'priority']

    def perform_create(self, serializer):
        assessment = serializer.save(assessed_by=self.request.user)
        # Update or create queue ticket
        ticket, created = QueueTicket.objects.get_or_create(
            patient=assessment.patient,
            status__in=[QueueTicket.Status.WAITING, QueueTicket.Status.TRIAGE_IN_PROGRESS],
            defaults={
                'facility_id': 1,
                'ticket_number': assessment.patient.mrn,
                'priority': assessment.priority,
                'status': QueueTicket.Status.WAITING,
                'triage_assessment': assessment
            }
        )
        if not created:
            ticket.priority = assessment.priority
            ticket.triage_assessment = assessment
            ticket.status = QueueTicket.Status.WAITING
            ticket.save()


class QueueViewSet(viewsets.ModelViewSet):
    queryset = QueueTicket.objects.exclude(status=QueueTicket.Status.COMPLETED)
    serializer_class = QueueTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['priority', 'status', 'assigned_room']
    ordering_fields = ['priority', 'arrived_at', 'order']

    @action(detail=False, methods=['get'])
    def live_feed(self, request):
        """Returns categorized queue for Doctor and Nurse views."""
        active_tickets = self.get_queryset()
        attention = active_tickets.filter(priority__in=[1, 2])[:2]
        attention_ids = list(attention.values_list('id', flat=True))
        waiting = active_tickets.exclude(id__in=attention_ids)
        serializer = self.get_serializer

        # Count metrics for operations
        emergency_count = active_tickets.filter(priority=1).count()
        high_priority_count = active_tickets.filter(priority=2).count()
        urgent_count = active_tickets.filter(priority=3).count()
        non_urgent_count = active_tickets.filter(priority=4).count()

        return Response({
            'all': serializer(active_tickets, many=True).data,
            'attention': serializer(attention, many=True).data,
            'waiting': serializer(waiting, many=True).data,
            'counts': {
                'emergency': emergency_count,
                'high_priority': high_priority_count,
                'urgent': urgent_count,
                'non_urgent': non_urgent_count,
                'total_waiting': active_tickets.count(),
            }
        })

    @action(detail=True, methods=['post'])
    def call_patient(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = QueueTicket.Status.IN_CONSULTATION
        ticket.called_at = timezone.now()
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = QueueTicket.Status.COMPLETED
        ticket.completed_at = timezone.now()
        ticket.save()
        return Response({'status': 'Ticket completed', 'id': ticket.id})
