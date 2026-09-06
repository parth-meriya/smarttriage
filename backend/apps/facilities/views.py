from rest_framework import generics, permissions
from .models import Facility
from .serializers import FacilitySerializer

class FacilityListView(generics.ListCreateAPIView):
    queryset = Facility.objects.filter(is_active=True)
    serializer_class = FacilitySerializer
    permission_classes = [permissions.IsAuthenticated]

class FacilityDetailView(generics.RetrieveUpdateAPIView):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [permissions.IsAuthenticated]
