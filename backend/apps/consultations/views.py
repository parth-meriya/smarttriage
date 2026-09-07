from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Consultation
from .serializers import ConsultationSerializer
from apps.triage.models import QueueTicket, Visit
from apps.accounts.permissions import IsClinicalStaff

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('patient', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [IsClinicalStaff]
    filterset_fields = ['patient', 'doctor', 'disposition']

    def perform_create(self, serializer):
        doctor = self.request.user if self.request.user.is_authenticated else None
        consultation = serializer.save(doctor=doctor)
        # Transition active queue ticket to in consultation
        ticket = QueueTicket.objects.filter(
            patient=consultation.patient
        ).exclude(status=QueueTicket.Status.COMPLETED).first()
        if ticket:
            ticket.status = QueueTicket.Status.IN_CONSULTATION
            ticket.called_at = timezone.now()
            ticket.save()
            if ticket.visit:
                ticket.visit.status = Visit.Status.IN_CONSULTATION
                if doctor and doctor.role == 'Doctor':
                    ticket.visit.assigned_doctor = doctor
                ticket.visit.save()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        consultation = self.get_object()
        consultation.completed_at = timezone.now()
        consultation.clinical_findings = request.data.get('clinical_findings', consultation.clinical_findings)
        consultation.diagnosis = request.data.get('diagnosis', consultation.diagnosis)
        consultation.treatment_plan = request.data.get('treatment_plan', consultation.treatment_plan)
        consultation.disposition = request.data.get('disposition', consultation.disposition)
        consultation.save()

        # Mark queue ticket and visit encounter as completed
        ticket = QueueTicket.objects.filter(
            patient=consultation.patient
        ).exclude(status=QueueTicket.Status.COMPLETED).first()
        if ticket:
            ticket.status = QueueTicket.Status.COMPLETED
            ticket.completed_at = timezone.now()
            ticket.save()
            if ticket.visit:
                ticket.visit.status = Visit.Status.COMPLETED
                ticket.visit.is_completed = True
                ticket.visit.completed_at = timezone.now()
                ticket.visit.save()

        return Response(self.get_serializer(consultation).data)

