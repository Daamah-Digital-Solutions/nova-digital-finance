from django.urls import path
from . import views

app_name = 'pronova'

urlpatterns = [
    # PRN Wallet
    path('wallet/', views.PRNWalletView.as_view(), name='prn-wallet'),
    path('wallet/balance/', views.prn_wallet_balance, name='prn-wallet-balance'),
    path('transactions/', views.PRNTransactionListView.as_view(), name='prn-transactions'),
    
    # Electronic Certificates
    path('certificates/', views.UserCertificatesView.as_view(), name='user-certificates'),
    path('certificates/<uuid:pk>/', views.CertificateDetailView.as_view(), name='certificate-detail'),
    path('certificates/<uuid:certificate_id>/generate-pdf/', views.generate_certificate_pdf, name='generate-certificate-pdf'),
    path('certificates/<uuid:certificate_id>/download/', views.download_certificate, name='download-certificate'),
    
    # Capimax Investments
    path('investments/', views.CapimaxInvestmentListView.as_view(), name='capimax-investments'),
    
    # Admin/System Operations
    path('loans/<uuid:loan_id>/process-approval/', views.process_loan_approval, name='process-loan-approval'),
    path('system/stats/', views.prn_system_stats, name='prn-system-stats'),
]