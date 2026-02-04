from django.urls import path

from . import views

urlpatterns = [
    path("", views.KYCApplicationView.as_view(), name="kyc"),
    path("submit/", views.KYCSubmitView.as_view(), name="kyc-submit"),
    path("documents/", views.KYCDocumentListCreateView.as_view(), name="kyc-documents"),
    path("documents/<uuid:pk>/", views.KYCDocumentDeleteView.as_view(), name="kyc-document-delete"),
]
