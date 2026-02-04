import hashlib
import hmac
import json
import logging

import stripe
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid Stripe webhook payload")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid Stripe webhook signature")
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(data)
        elif event_type == "payment_intent.succeeded":
            self._handle_payment_succeeded(data)
        elif event_type == "payment_intent.payment_failed":
            self._handle_payment_failed(data)

        return Response(status=status.HTTP_200_OK)

    def _handle_checkout_completed(self, session):
        from apps.payments.models import Payment
        from apps.payments.services import PaymentService

        try:
            payment = Payment.objects.get(stripe_session_id=session["id"])
            payment.stripe_payment_intent_id = session.get("payment_intent", "")
            payment.status = Payment.Status.COMPLETED
            payment.save(update_fields=[
                "stripe_payment_intent_id", "status", "updated_at"
            ])
            PaymentService.process_completed_payment(payment)
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for session: {session['id']}")

    def _handle_payment_succeeded(self, payment_intent):
        from apps.payments.models import Payment

        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent["id"]
            )
            if payment.status != Payment.Status.COMPLETED:
                payment.status = Payment.Status.COMPLETED
                payment.save(update_fields=["status", "updated_at"])
        except Payment.DoesNotExist:
            pass

    def _handle_payment_failed(self, payment_intent):
        from apps.payments.models import Payment

        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent["id"]
            )
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
        except Payment.DoesNotExist:
            pass


class NowPaymentsWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_X_NOWPAYMENTS_SIG", "")

        # Verify HMAC signature
        if settings.NOWPAYMENTS_IPN_SECRET:
            sorted_data = json.dumps(
                json.loads(payload), sort_keys=True, separators=(",", ":")
            )
            expected_sig = hmac.new(
                settings.NOWPAYMENTS_IPN_SECRET.encode(),
                sorted_data.encode(),
                hashlib.sha512,
            ).hexdigest()

            if not hmac.compare_digest(sig_header, expected_sig):
                logger.error("Invalid NowPayments webhook signature")
                return Response(status=status.HTTP_400_BAD_REQUEST)

        data = json.loads(payload)
        payment_status = data.get("payment_status")
        order_id = data.get("order_id")

        from apps.payments.models import Payment
        from apps.payments.services import PaymentService

        try:
            payment = Payment.objects.get(nowpayments_order_id=order_id)
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for order: {order_id}")
            return Response(status=status.HTTP_404_NOT_FOUND)

        if payment_status == "finished":
            payment.status = Payment.Status.COMPLETED
            payment.nowpayments_payment_id = str(data.get("payment_id", ""))
            payment.save(update_fields=[
                "status", "nowpayments_payment_id", "updated_at"
            ])
            PaymentService.process_completed_payment(payment)
        elif payment_status in ("failed", "expired"):
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
        elif payment_status in ("waiting", "confirming", "sending"):
            payment.status = Payment.Status.PROCESSING
            payment.save(update_fields=["status", "updated_at"])

        return Response(status=status.HTTP_200_OK)
