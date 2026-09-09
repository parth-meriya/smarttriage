from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # If the user registered as a Patient, create a Patient clinical record and queue encounter
        if user.role == User.Role.PATIENT:
            try:
                from apps.triage.models import Patient, Visit, QueueTicket
                from apps.facilities.models import Facility

                raw_age = request.data.get('age')
                age = int(raw_age) if raw_age and str(raw_age).isdigit() else 30
                gender = request.data.get('gender', 'Male')
                dob = request.data.get('date_of_birth') or None
                address = request.data.get('address', '')
                emergency_name = request.data.get('emergency_contact_name', '')
                emergency_phone = request.data.get('emergency_contact_phone', '')
                phone = user.phone_number or request.data.get('phone', '')
                complaint = request.data.get('complaint') or request.data.get('chief_complaint') or 'General Emergency Intake'

                patient, created = Patient.objects.get_or_create(
                    user=user,
                    defaults={
                        'first_name': user.first_name or user.username,
                        'last_name': user.last_name or 'Patient',
                        'age': age,
                        'gender': gender,
                        'date_of_birth': dob,
                        'email': user.email or '',
                        'phone': phone,
                        'address': address,
                        'emergency_contact_name': emergency_name,
                        'emergency_contact_phone': emergency_phone,
                    }
                )
                if not created:
                    patient.first_name = user.first_name or patient.first_name
                    patient.last_name = user.last_name or patient.last_name
                    patient.age = age
                    patient.gender = gender
                    if dob:
                        patient.date_of_birth = dob
                    patient.email = user.email or patient.email
                    patient.phone = phone or patient.phone
                    patient.address = address or patient.address
                    patient.emergency_contact_name = emergency_name or patient.emergency_contact_name
                    patient.emergency_contact_phone = emergency_phone or patient.emergency_contact_phone
                    patient.save()

                # Automatically create an active visit and queue ticket so the patient immediately reflects on Doctor and Nurse screens
                facility, _ = Facility.objects.get_or_create(
                    code='NMC-01',
                    defaults={'name': 'Northside Medical Center'}
                )
                active_visit = Visit.objects.filter(patient=patient, is_completed=False).first()
                if not active_visit:
                    active_visit = Visit.objects.create(
                        patient=patient,
                        chief_complaint=complaint,
                        facility=facility,
                        status=Visit.Status.WAITING,
                        priority=4
                    )
                
                active_ticket = QueueTicket.objects.filter(patient=patient).exclude(status=QueueTicket.Status.COMPLETED).first()
                if not active_ticket:
                    QueueTicket.objects.create(
                        patient=patient,
                        visit=active_visit,
                        facility=facility,
                        ticket_number=patient.mrn,
                        priority=4,
                        status=QueueTicket.Status.WAITING
                    )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error creating patient clinical record: {e}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

from rest_framework.views import APIView

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)

class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_available', 'department']
    search_fields = ['first_name', 'last_name', 'username', 'department']

    def get_queryset(self):
        return User.objects.all().order_by('first_name')
