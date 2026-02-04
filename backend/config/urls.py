from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.urls_users")),
    path("api/v1/kyc/", include("apps.kyc.urls")),
    path("api/v1/financing/", include("apps.financing.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/documents/", include("apps.documents.urls")),
    path("api/v1/signatures/", include("apps.signatures.urls")),
    path("api/v1/requests/", include("apps.requests.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/content/", include("apps.content.urls")),
    path("api/v1/admin/", include("apps.accounts.urls_admin")),
    # Webhooks
    path("api/v1/webhooks/", include("apps.payments.urls_webhooks")),
    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
