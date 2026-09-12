from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.utils import timezone
from .models import Patient, VitalSign, TriageAssessment, QueueTicket, Visit, HealthReport
from . import queue_service
from .serializers import (
    PatientSerializer,
    VitalSignSerializer,
    TriageAssessmentSerializer,
    QueueTicketSerializer,
    VisitSerializer,
    HealthReportSerializer
)
from apps.accounts.permissions import IsClinicalStaff, IsClinicalStaffOrPatient

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().prefetch_related('vital_signs', 'triage_assessments', 'health_reports')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['first_name', 'last_name', 'mrn', 'phone']
    ordering_fields = ['registered_at', 'age']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Patients can only access their own clinical record through the API.
        if user.is_authenticated and getattr(user, 'role', None) == 'Patient':
            patient = getattr(user, 'patient_profile', None)
            if patient:
                return qs.filter(pk=patient.pk)
            return qs.filter(email=user.email)
        return qs

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Returns the clinical patient record associated with the authenticated user."""
        try:
            if hasattr(request.user, 'patient_profile'):
                patient = request.user.patient_profile
            else:
                # Fallback match by email or name
                patient = Patient.objects.filter(
                    email=request.user.email
                ).first() or Patient.objects.filter(
                    first_name=request.user.first_name,
                    last_name=request.user.last_name
                ).first()
            if patient:
                return Response(self.get_serializer(patient).data)
        except Exception:
            pass
        return Response({'detail': 'No patient record found for this user.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        patient = self.get_object()
        vitals = VitalSignSerializer(patient.vital_signs.all(), many=True).data
        assessments = TriageAssessmentSerializer(patient.triage_assessments.all(), many=True).data
        tickets = QueueTicketSerializer(patient.queue_tickets.all(), many=True).data
        reports = HealthReportSerializer(patient.health_reports.all(), many=True, context={'request': request}).data
        return Response({
            'patient': PatientSerializer(patient, context={'request': request}).data,
            'vitals': vitals,
            'triage_history': assessments,
            'visits': tickets,
            'reports': reports
        })

    @action(detail=True, methods=['get'])
    def reports(self, request, pk=None):
        patient = self.get_object()
        reports = HealthReportSerializer(patient.health_reports.all(), many=True, context={'request': request}).data
        return Response(reports)


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
    permission_classes = [IsClinicalStaffOrPatient]
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

        # Update or create queue ticket (guarded against duplicates under concurrency)
        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            ticket = (
                QueueTicket.objects.select_for_update()
                .filter(patient=patient)
                .exclude(status=QueueTicket.Status.COMPLETED)
                .first()
            )
            if not ticket:
                from apps.facilities.models import Facility
                facility, _ = Facility.objects.get_or_create(code='NMC-01', defaults={'name': 'Northside Medical Center'})
                ticket = QueueTicket.objects.create(
                    patient=patient,
                    visit=active_visit,
                    facility=facility,
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
            queue_service.recalculate_estimates()


class QueueViewSet(viewsets.ModelViewSet):
    queryset = QueueTicket.objects.exclude(status=QueueTicket.Status.COMPLETED)
    serializer_class = QueueTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['priority', 'status', 'assigned_room']
    ordering_fields = ['priority', 'arrived_at', 'order']

    def get_permissions(self):
        """Only clinical/admin staff may mutate the queue; patients read their own state."""
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'call_patient', 'complete']:
            return [IsClinicalStaff()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Defense-in-depth: patients may only ever see their own queue tickets.
        if user.is_authenticated and getattr(user, 'role', None) == 'Patient':
            patient = getattr(user, 'patient_profile', None)
            if patient:
                return qs.filter(patient=patient)
            return qs.filter(patient__email=user.email)
        return qs

    @action(detail=False, methods=['get'])
    def live_feed(self, request):
        """Categorized, priority-ordered queue for Doctor / Nurse / Admin views."""
        # Priority order is enforced here (level, then FIFO arrival time)
        active_tickets = self.get_queryset().order_by('priority', 'arrived_at', 'id')
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
                'triage_in_progress': active_tickets.filter(status=QueueTicket.Status.TRIAGE_IN_PROGRESS).count(),
            }
        })

    @action(detail=False, methods=['get'])
    def my_status(self, request):
        """
        Live queue state for the authenticated patient: triage level, position,
        patients ahead, estimated wait, and status transitions.
        """
        patient = getattr(request.user, 'patient_profile', None)
        if not patient:
            patient = Patient.objects.filter(email=request.user.email).first()
        ticket = QueueTicket.objects.filter(patient=patient).exclude(
            status=QueueTicket.Status.COMPLETED
        ).order_by('-arrived_at').first() if patient else None

        if not ticket:
            return Response({'detail': 'No active queue ticket found.'}, status=status.HTTP_404_NOT_FOUND)

        data = queue_service.serialize_queue_state(ticket)
        data['next_step'] = {
            QueueTicket.Status.WAITING: 'Waiting for Nurse Assessment',
            QueueTicket.Status.TRIAGE_IN_PROGRESS: 'Nurse assessment in progress',
            QueueTicket.Status.TRIAGE_COMPLETE: 'Waiting for Doctor',
            QueueTicket.Status.IN_CONSULTATION: 'You are currently with the doctor',
        }.get(ticket.status, 'Waiting')
        if ticket.priority == 1 and ticket.status != QueueTicket.Status.IN_CONSULTATION:
            data['banner'] = 'Emergency Priority – Doctor Attention Required'
        elif ticket.status == QueueTicket.Status.TRIAGE_COMPLETE and data['patients_ahead'] == 0:
            data['banner'] = 'Your turn is approaching – please proceed for doctor consultation.'
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsClinicalStaff])
    def next_patient(self, request):
        """Backend-decided next eligible patient (priority queue, never FCFS)."""
        ticket = queue_service.next_eligible_ticket()
        if not ticket:
            return Response({'detail': 'No patients waiting in the queue.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(queue_service.serialize_next_patient(ticket))

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def call_patient(self, request, pk=None):
        """
        Doctor starts treatment. Transactional + guarded so two doctors can never
        take the same patient simultaneously.
        """
        ticket = self.get_object()
        if ticket.status == QueueTicket.Status.IN_CONSULTATION:
            return Response(
                {'detail': 'Patient is already in consultation.'},
                status=status.HTTP_409_CONFLICT,
            )
        if ticket.status == QueueTicket.Status.COMPLETED:
            return Response(
                {'detail': 'Cannot start treatment on a completed ticket.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Atomic guard: re-read status inside the transaction and verify it's
        # still eligible, so two doctors calling simultaneously cannot both succeed.
        ticket = QueueTicket.objects.select_for_update().get(pk=ticket.pk)
        if ticket.status in (
            QueueTicket.Status.IN_CONSULTATION,
            QueueTicket.Status.COMPLETED,
        ):
            return Response(
                {'detail': 'Patient is already in consultation or completed.'},
                status=status.HTTP_409_CONFLICT,
            )

        ticket.status = QueueTicket.Status.IN_CONSULTATION
        ticket.called_at = timezone.now()
        ticket.save(update_fields=['status', 'called_at'])
        if ticket.visit:
            ticket.visit.status = Visit.Status.IN_CONSULTATION
            if request.user.is_authenticated and getattr(request.user, 'role', None) == 'Doctor':
                ticket.visit.assigned_doctor = request.user
            ticket.visit.save()
        queue_service.recalculate_estimates()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def complete(self, request, pk=None):
        """
        Doctor completes treatment. Transactional: removes the patient from the
        active queue, advances the queue, and persists the next eligible patient.
        """
        ticket = self.get_object()
        if ticket.status == QueueTicket.Status.COMPLETED:
            return Response({'detail': 'Ticket already completed.'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.status = QueueTicket.Status.COMPLETED
        ticket.completed_at = timezone.now()
        ticket.save(update_fields=['status', 'completed_at'])
        if ticket.visit:
            ticket.visit.status = Visit.Status.COMPLETED
            ticket.visit.is_completed = True
            ticket.visit.completed_at = timezone.now()
            ticket.visit.save()

        queue_service.recalculate_estimates()
        next_ticket = queue_service.next_eligible_ticket()
        return Response({
            'status': 'Ticket completed',
            'id': ticket.id,
            'next_patient': (
                queue_service.serialize_next_patient(next_ticket) if next_ticket else None
            ),
        })


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


class HealthReportViewSet(viewsets.ModelViewSet):
    queryset = HealthReport.objects.all().select_related('patient', 'uploaded_by', 'visit')
    serializer_class = HealthReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['patient', 'report_type', 'visit']
    search_fields = ['title', 'description', 'patient__first_name', 'patient__last_name', 'patient__mrn']
    ordering_fields = ['created_at', 'report_type']

    def get_queryset(self):
        qs = super().get_queryset()
        # If the user is a patient, they can only view their own reports
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', None) == 'Patient':
            patient = getattr(self.request.user, 'patient_profile', None)
            if patient:
                return qs.filter(patient=patient)
            return qs.filter(patient__email=self.request.user.email)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

