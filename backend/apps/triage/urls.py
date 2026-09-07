from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, VitalSignViewSet, TriageAssessmentViewSet, QueueViewSet, VisitViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'vitals', VitalSignViewSet, basename='vital')
router.register(r'assessments', TriageAssessmentViewSet, basename='assessment')
router.register(r'queue', QueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
]
