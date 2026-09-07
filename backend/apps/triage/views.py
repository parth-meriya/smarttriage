from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Patient, VitalSign, TriageAssessment, QueueTicket, Visit
from .serializers import (
    PatientSerializer,
    VitalSignSerializer,
    TriageAssessmentSerializer,
    QueueTicketSerializer,
    VisitSerializer
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


from .engine import evaluate_triage
from .questions import TRIAGE_QUESTIONS

class TriageAssessmentViewSet(viewsets.ModelViewSet):
    queryset = TriageAssessment.objects.all()
    serializer_class = TriageAssessmentSerializer
    permission_classes = [IsClinicalStaff]
    filterset_fields = ['patient', 'priority']

    @action(detail=False, methods=['get'])
    def questions(self, request):
        """Returns the standardized triage questionnaire."""
        return Response(TRIAGE_QUESTIONS)

    def perform_create(self, serializer):
        patient = serializer.validated_data.get('patient')
        complaint = serializer.validated_data.get('primary_complaint', '')
        breathing = serializer.validated_data.get('severe_breathing_difficulty', False)
        chest_pain = serializer.validated_data.get('chest_pain_or_pressure', False)
        speech = serializer.validated_data.get('slurred_speech_or_weakness', False)

        # Get latest vitals for this patient
        latest_vitals = patient.vital_signs.first()
        spo2 = latest_vitals.spo2 if latest_vitals else None
        hr = latest_vitals.heart_rate if latest_vitals else None
        rr = latest_vitals.respiratory_rate if latest_vitals else None
        sbp = latest_vitals.systolic_bp if latest_vitals else None
        dbp = latest_vitals.diastolic_bp if latest_vitals else None
        temp = float(latest_vitals.temperature) if (latest_vitals and latest_vitals.temperature) else None

        # Evaluate deterministic clinical triage priority
        priority, rationale, risks = evaluate_triage(
            primary_complaint=complaint,
            severe_breathing_difficulty=breathing,
            chest_pain_or_pressure=chest_pain,
            slurred_speech_or_weakness=speech,
            spo2=spo2,
            heart_rate=hr,
            respiratory_rate=rr,
            systolic_bp=sbp,
            diastolic_bp=dbp,
            temperature=temp,
        )

        # Link or create active visit
        active_visit = patient.visits.exclude(status=Visit.Status.COMPLETED).first()
        if not active_visit:
            active_visit = Visit.objects.create(
                patient=patient,
                chief_complaint=complaint,
                priority=priority,
                status=Visit.Status.TRIAGE_COMPLETE
            )
        else:
            active_visit.priority = priority
            active_visit.chief_complaint = complaint
            active_visit.status = Visit.Status.TRIAGE_COMPLETE
            active_visit.save()

        assessment = serializer.save(
            assessed_by=self.request.user,
            priority=priority,
            ai_rationale=rationale,
            visit=active_visit
        )

        # Update or create queue ticket
        ticket = QueueTicket.objects.filter(patient=patient).exclude(status=QueueTicket.Status.COMPLETED).first()
        if not ticket:
            QueueTicket.objects.create(
                patient=patient,
                visit=active_visit,
                facility_id=1,
                ticket_number=patient.mrn,
                priority=priority,
                status=QueueTicket.Status.TRIAGE_COMPLETE,
                triage_assessment=assessment
            )
        else:
            ticket.priority = priority
            ticket.triage_assessment = assessment
            ticket.visit = active_visit
            ticket.status = QueueTicket.Status.TRIAGE_COMPLETE
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
        if ticket.visit:
            ticket.visit.status = Visit.Status.COMPLETED
            ticket.visit.is_completed = True
            ticket.visit.completed_at = timezone.now()
            ticket.visit.save()
        return Response({'status': 'Ticket completed', 'id': ticket.id})


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all().select_related('patient', 'assigned_doctor')
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient', 'status', 'priority', 'assigned_doctor', 'is_completed']
    search_fields = ['visit_number', 'patient__first_name', 'patient__last_name', 'patient__mrn', 'chief_complaint']
    ordering_fields = ['created_at', 'priority']

    @action(detail=True, methods=['post'])
    def complete_visit(self, request, pk=None):
        visit = self.get_object()
        visit.status = Visit.Status.COMPLETED
        visit.is_completed = True
        visit.completed_at = timezone.now()
        visit.save()
        return Response(self.get_serializer(visit).data)
