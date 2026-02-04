from django.urls import path

from . import views

urlpatterns = [
    path("", views.PaymentListView.as_view(), name="payment-list"),
    path("<uuid:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"),
    path("<uuid:pk>/receipt/", views.PaymentReceiptView.as_view(), name="payment-receipt"),
    path("stripe/checkout/", views.StripeCheckoutView.as_view(), name="stripe-checkout"),
    path("crypto/create/", views.CryptoPaymentCreateView.as_view(), name="crypto-create"),
    path("schedule/", views.ScheduledPaymentListCreateView.as_view(), name="scheduled-payments"),
    path("schedule/<uuid:pk>/", views.ScheduledPaymentDeleteView.as_view(), name="scheduled-payment-delete"),
]
