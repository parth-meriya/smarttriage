from django.urls import path
from .views import FacilityListView, FacilityDetailView

urlpatterns = [
    path('', FacilityListView.as_view(), name='facility_list'),
    path('<int:pk>/', FacilityDetailView.as_view(), name='facility_detail'),
]
