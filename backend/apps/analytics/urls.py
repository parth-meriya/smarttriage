from django.urls import path
from .views import OperationsMetricsView

urlpatterns = [
    path('operations/', OperationsMetricsView.as_view(), name='operations_metrics'),
]
