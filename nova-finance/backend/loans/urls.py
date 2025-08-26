from django.urls import path
from . import views

app_name = 'loans'

urlpatterns = [
    # Loan Applications
    path('applications/', views.LoanApplicationListView.as_view(), name='application_list'),
    path('applications/create/', views.LoanApplicationCreateView.as_view(), name='application_create'),
    path('applications/<uuid:application_id>/pay/', views.approve_application_payment, name='application_payment'),
    
    # Loans
    path('', views.LoanListView.as_view(), name='loan_list'),
    path('<uuid:pk>/', views.LoanDetailView.as_view(), name='loan_detail'),
    
    # Payments
    path('payments/', views.PaymentListView.as_view(), name='payment_list'),
    
    # Loan Requests
    path('requests/', views.LoanRequestListView.as_view(), name='request_list'),
    path('requests/create/', views.LoanRequestCreateView.as_view(), name='request_create'),
    
    # Utilities
    path('calculate/', views.calculate_loan, name='calculate_loan'),
    path('currencies/', views.available_currencies, name='available_currencies'),
    path('dashboard/stats/', views.loan_dashboard_stats, name='dashboard_stats'),
]