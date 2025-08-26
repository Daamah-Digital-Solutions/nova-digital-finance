from django.urls import path
from . import views

app_name = 'contracts'

urlpatterns = [
    # User contract views
    path('', views.UserContractsView.as_view(), name='user-contracts'),
    path('<uuid:pk>/', views.ContractDetailView.as_view(), name='contract-detail'),
    path('<uuid:contract_id>/status/', views.contract_status, name='contract-status'),
    path('<uuid:contract_id>/download/', views.download_contract, name='download-contract'),
    
    # Contract generation
    path('generate/certificate/<uuid:certificate_id>/', views.generate_contract_for_certificate, name='generate-contract-for-certificate'),
    
    # Electronic signatures
    path('<uuid:contract_id>/sign/initiate/', views.initiate_signature, name='initiate-signature'),
    path('signatures/<uuid:signature_id>/complete/', views.complete_signature, name='complete-signature'),
    
    # Notifications
    path('notifications/', views.UserNotificationsView.as_view(), name='user-notifications'),
    path('notifications/<uuid:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    
    # Admin endpoints
    path('admin/list/', views.admin_contracts_list, name='admin-contracts-list'),
    path('admin/<uuid:contract_id>/sign/', views.admin_sign_contract, name='admin-sign-contract'),
]