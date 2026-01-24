"""
URL configuration for nova_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time


def health_check(request):
    """
    Health check endpoint for Docker healthchecks and monitoring.
    Returns system status including database and cache connectivity.
    """
    health_status = {
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': time.time(),
        'checks': {}
    }

    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['checks']['database'] = 'healthy'
    except Exception as e:
        health_status['checks']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'

    # Check cache connectivity
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = 'healthy'
        else:
            health_status['checks']['cache'] = 'unhealthy: cache read failed'
            health_status['status'] = 'degraded'
    except Exception as e:
        health_status['checks']['cache'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'

    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)


def ready_check(request):
    """
    Readiness check endpoint for Kubernetes/container orchestration.
    Returns whether the application is ready to receive traffic.
    """
    return JsonResponse({'ready': True})


urlpatterns = [
    # Health and readiness endpoints
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', ready_check, name='ready_check'),

    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/currencies/', include('currencies.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/investments/', include('investments.urls')),
    path('api/requests/', include('requests.urls')),
    path('api/pronova/', include('pronova.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/capimax/', include('capimax.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
