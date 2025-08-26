from django.urls import path
from . import views

app_name = 'capimax'

urlpatterns = [
    # Account management
    path('activate/', views.activate_certificate, name='activate-certificate'),
    path('account/status/', views.account_status, name='account-status'),
    path('account/sync/', views.sync_account, name='sync-account'),
    
    # Investment management
    path('opportunities/', views.investment_opportunities, name='investment-opportunities'),
    path('investments/create/', views.create_investment, name='create-investment'),
    path('investments/', views.user_investments, name='user-investments'),
    path('investments/<uuid:investment_id>/', views.investment_detail, name='investment-detail'),
    path('investments/<uuid:investment_id>/withdraw/', views.withdraw_investment, name='withdraw-investment'),
    
    # Performance and analytics
    path('performance/', views.performance_summary, name='performance-summary'),
    path('transactions/', views.transaction_history, name='transaction-history'),
    
    # Admin endpoints
    path('admin/sync-all/', views.admin_sync_all, name='admin-sync-all'),
    path('admin/accounts/', views.admin_accounts_list, name='admin-accounts-list'),
    path('admin/platform/', views.admin_platform_settings, name='admin-platform-settings'),
]