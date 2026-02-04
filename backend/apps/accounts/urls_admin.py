from django.urls import path

from apps.accounts import views as account_views
from apps.financing import views as financing_views
from apps.payments import views as payment_views
from apps.requests import views as request_views
from apps.content import views as content_views
from apps.kyc import views as kyc_views

urlpatterns = [
    # Dashboard
    path("dashboard/", account_views.AdminDashboardView.as_view(), name="admin-dashboard"),
    # Clients
    path("clients/", account_views.AdminClientListView.as_view(), name="admin-clients"),
    path("clients/<uuid:pk>/", account_views.AdminClientDetailView.as_view(), name="admin-client-detail"),
    # KYC
    path("kyc/", kyc_views.AdminKYCListView.as_view(), name="admin-kyc-list"),
    path("kyc/<uuid:pk>/", kyc_views.AdminKYCDetailView.as_view(), name="admin-kyc-detail"),
    # Financing
    path("applications/", financing_views.AdminFinancingListView.as_view(), name="admin-applications"),
    path("applications/<uuid:pk>/", financing_views.AdminFinancingDetailView.as_view(), name="admin-application-detail"),
    path("applications/<uuid:pk>/approve/", financing_views.AdminFinancingApproveView.as_view(), name="admin-application-approve"),
    path("applications/<uuid:pk>/reject/", financing_views.AdminFinancingRejectView.as_view(), name="admin-application-reject"),
    # Payments
    path("payments/", payment_views.AdminPaymentListView.as_view(), name="admin-payments"),
    # Requests
    path("requests/", request_views.AdminRequestListView.as_view(), name="admin-requests"),
    path("requests/<uuid:pk>/", request_views.AdminRequestDetailView.as_view(), name="admin-request-detail"),
    # Content
    path("content/pages/", content_views.AdminPageListCreateView.as_view(), name="admin-pages"),
    path("content/pages/<uuid:pk>/", content_views.AdminPageDetailView.as_view(), name="admin-page-detail"),
    path("content/faq/", content_views.AdminFAQListCreateView.as_view(), name="admin-faq"),
    path("content/faq/<uuid:pk>/", content_views.AdminFAQDetailView.as_view(), name="admin-faq-detail"),
]
