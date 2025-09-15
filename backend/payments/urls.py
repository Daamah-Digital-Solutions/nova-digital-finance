from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment Methods
    path('methods/', views.PaymentMethodListView.as_view(), name='method_list'),
    path('methods/create/', views.PaymentMethodCreateView.as_view(), name='method_create'),
    path('methods/<uuid:pk>/delete/', views.PaymentMethodDeleteView.as_view(), name='method_delete'),
    
    # Payment Intents
    path('intents/', views.PaymentIntentListView.as_view(), name='intent_list'),
    path('intents/create/', views.PaymentIntentCreateView.as_view(), name='intent_create'),
    
    # Transactions
    path('transactions/', views.PaymentTransactionListView.as_view(), name='transaction_list'),
    
    # Specific Payment Actions
    path('loan-fee/<uuid:application_id>/', views.create_loan_fee_payment, name='loan_fee_payment'),
    path('installment/<uuid:loan_id>/', views.create_installment_payment, name='installment_payment'),
    path('confirm/', views.confirm_payment, name='confirm_payment'),
    
    # Dashboard
    path('dashboard/stats/', views.payment_dashboard_stats, name='dashboard_stats'),
    
    # Enhanced Nova Finance endpoints
    path('upcoming/', views.upcoming_payments_view, name='upcoming-payments'),
    path('schedule/reminders/', views.send_payment_reminders, name='send-reminders'),
    
    # Stripe webhooks
    path('stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
]