from django.urls import path

from .webhooks import NowPaymentsWebhookView, StripeWebhookView

urlpatterns = [
    path("stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("nowpayments/", NowPaymentsWebhookView.as_view(), name="nowpayments-webhook"),
]
