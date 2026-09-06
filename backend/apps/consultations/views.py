from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Consultation
from .serializers import ConsultationSerializer
from apps.triage.models import QueueTicket

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('patient', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient', 'doctor', 'disposition']

    def perform_create(self, serializer):
        consultation = serializer.save(doctor=self.request.user)
        # Transition active queue ticket to in consultation
        ticket = QueueTicket.objects.filter(
            patient=consultation.patient,
            status=QueueTicket.Status.WAITING
        ).first()
        if ticket:
            ticket.status = QueueTicket.Status.IN_CONSULTATION
            ticket.called_at = timezone.now()
            ticket.save()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        consultation = self.get_object()
        consultation.completed_at = timezone.now()
        consultation.diagnosis = request.data.get('diagnosis', consultation.diagnosis)
        consultation.treatment_plan = request.data.get('treatment_plan', consultation.treatment_plan)
        consultation.disposition = request.data.get('disposition', consultation.disposition)
        consultation.save()

        # Mark queue ticket as completed
        ticket = QueueTicket.objects.filter(patient=consultation.patient).exclude(status=QueueTicket.Status.COMPLETED).first()
        if ticket:
            ticket.status = QueueTicket.Status.COMPLETED
            ticket.completed_at = timezone.now()
            ticket.save()

        return Response(self.get_serializer(consultation).data)
