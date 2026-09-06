from rest_framework import serializers
from .models import Facility, Department

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'rooms', 'is_active']

class FacilitySerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Facility
        fields = ['id', 'name', 'code', 'address', 'city', 'phone', 'is_active', 'departments']
