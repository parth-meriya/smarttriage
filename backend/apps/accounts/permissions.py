from rest_framework.permissions import BasePermission

class IsDoctor(BasePermission):
    """Allows access only to authenticated users with Doctor role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Doctor')

class IsNurse(BasePermission):
    """Allows access only to authenticated users with Nurse role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Nurse')

class IsAdminUserOrStaff(BasePermission):
    """Allows access only to authenticated users with Admin role or superuser."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'Admin' or request.user.is_staff))

class IsPatient(BasePermission):
    """Allows access only to authenticated users with Patient role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Patient')

class IsClinicalStaff(BasePermission):
    """Allows access to Doctors and Nurses."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['Doctor', 'Nurse', 'Admin']
        )
