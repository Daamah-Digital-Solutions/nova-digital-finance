from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentViewSet, DocumentTemplateViewSet, DocumentAccessViewSet,
    SharedDocumentView, GenerateDocumentView
)

app_name = 'documents'

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'templates', DocumentTemplateViewSet, basename='documenttemplate')
router.register(r'access-logs', DocumentAccessViewSet, basename='documentaccess')

urlpatterns = [
    path('', include(router.urls)),
    
    # Shared document access
    path('documents/shared/<str:token>/', SharedDocumentView.as_view(), name='shared-document'),
    
    # Document generation endpoints
    path('generate/loan/<uuid:loan_id>/', GenerateDocumentView.as_view(), name='generate-loan-docs'),
    path('generate/application/<uuid:application_id>/', GenerateDocumentView.as_view(), name='generate-app-docs'),
    path('generate/both/<uuid:loan_id>/<uuid:application_id>/', GenerateDocumentView.as_view(), name='generate-both-docs'),
    
]