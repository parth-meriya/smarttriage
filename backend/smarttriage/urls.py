from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def ws_queue_info(request):
    return JsonResponse({
        "status": "online",
        "protocol": "WebSocket",
        "uri": "ws://localhost:8000/ws/queue/",
        "service": "SmartTriage Real-Time Queue Feed",
        "description": "This endpoint accepts WebSocket connections. Connect using ws:// or wss:// protocol (e.g. from the Next.js application)."
    })

urlpatterns = [
    # Root redirects directly to interactive Swagger API documentation
    path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='api-root-redirect'),
    path('ws/queue/', ws_queue_info, name='ws-queue-info'),

    path('admin/', admin.site.urls),

    # API v1 routes
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/facilities/', include('apps.facilities.urls')),
    path('api/v1/triage/', include('apps.triage.urls')),
    path('api/v1/consultations/', include('apps.consultations.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),

    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
