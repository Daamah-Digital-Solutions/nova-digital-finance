import logging
from decimal import Decimal

import stripe
import requests
from django.conf import settings
from django.utils import timezone

from .models import Payment
from apps.financing.models import FinancingApplication, Installment

logger = logging.getLogger(__name__)


class StripeService:
    @staticmethod
    def create_checkout_session(user, financing_id, payment_type, amount,
                                 success_url, cancel_url, installment_id=None):
        stripe.api_key = settings.STRIPE_SECRET_KEY

        financing = FinancingApplication.objects.get(pk=financing_id, user=user)

        installment = None
        if installment_id:
            installment = Installment.objects.get(pk=installment_id, financing=financing)

        # Create payment record
        payment = Payment.objects.create(
            user=user,
            financing=financing,
            installment=installment,
            payment_type=payment_type,
            payment_method=Payment.PaymentMethod.STRIPE_CARD,
            amount=Decimal(str(amount)),
            currency="USD",
            description=f"{payment_type} payment for {financing.application_number}",
        )

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(Decimal(str(amount)) * 100),
                    "product_data": {
                        "name": f"Nova Digital Finance - {payment_type.title()}",
                        "description": f"Application: {financing.application_number}",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            metadata={
                "payment_id": str(payment.id),
                "financing_id": str(financing.id),
                "payment_type": payment_type,
            },
        )

        payment.stripe_session_id = session.id
        payment.save(update_fields=["stripe_session_id"])

        return {
            "session_id": session.id,
            "session_url": session.url,
            "payment_id": str(payment.id),
        }


class NowPaymentsService:
    BASE_URL = "https://api.nowpayments.io/v1"
    SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1"

    @classmethod
    def _get_base_url(cls):
        if settings.NOWPAYMENTS_SANDBOX:
            return cls.SANDBOX_URL
        return cls.BASE_URL

    @classmethod
    def _headers(cls):
        return {
            "x-api-key": settings.NOWPAYMENTS_API_KEY,
            "Content-Type": "application/json",
        }

    @classmethod
    def create_payment(cls, user, financing_id, payment_type, amount,
                       crypto_currency="btc", installment_id=None):
        financing = FinancingApplication.objects.get(pk=financing_id, user=user)

        installment = None
        if installment_id:
            installment = Installment.objects.get(pk=installment_id, financing=financing)

        payment = Payment.objects.create(
            user=user,
            financing=financing,
            installment=installment,
            payment_type=payment_type,
            payment_method=Payment.PaymentMethod.CRYPTO,
            amount=Decimal(str(amount)),
            currency="USD",
            crypto_currency=crypto_currency,
            description=f"{payment_type} payment for {financing.application_number}",
        )

        # Create NowPayments payment
        payload = {
            "price_amount": float(amount),
            "price_currency": "usd",
            "pay_currency": crypto_currency,
            "order_id": str(payment.id),
            "order_description": f"Nova Finance - {financing.application_number}",
        }

        try:
            response = requests.post(
                f"{cls._get_base_url()}/payment",
                json=payload,
                headers=cls._headers(),
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            payment.nowpayments_payment_id = str(data.get("payment_id", ""))
            payment.nowpayments_order_id = str(payment.id)
            payment.crypto_address = data.get("pay_address", "")
            payment.crypto_amount = Decimal(str(data.get("pay_amount", 0)))
            payment.status = Payment.Status.PROCESSING
            payment.save()

            return {
                "payment_id": str(payment.id),
                "pay_address": data.get("pay_address"),
                "pay_amount": data.get("pay_amount"),
                "pay_currency": data.get("pay_currency"),
                "nowpayments_id": data.get("payment_id"),
            }
        except requests.RequestException as e:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
            logger.error(f"NowPayments error: {e}")
            raise ValueError(f"Failed to create crypto payment: {str(e)}")


class PaymentService:
    @staticmethod
    def process_completed_payment(payment):
        """Handle post-payment processing."""
        if payment.payment_type == Payment.PaymentType.FEE:
            PaymentService._process_fee_payment(payment)
        elif payment.payment_type == Payment.PaymentType.INSTALLMENT:
            PaymentService._process_installment_payment(payment)

        # Generate receipt
        PaymentService.generate_receipt(payment)

        # Send notification
        from apps.notifications.services import NotificationService
        NotificationService.notify(
            user=payment.user,
            title="Payment Received",
            message=f"Your payment of ${payment.amount} has been confirmed. "
                    f"Reference: {payment.transaction_reference}",
            category="payment",
            action_url="/dashboard/payments",
        )

    @staticmethod
    def _process_fee_payment(payment):
        financing = payment.financing
        if financing and financing.status == FinancingApplication.Status.PENDING_FEE:
            financing.status = FinancingApplication.Status.FEE_PAID
            financing.save(update_fields=["status", "updated_at"])

            # Create signature request for contract
            from apps.documents.services import DocumentService
            DocumentService.create_signing_request(financing)

    @staticmethod
    def _process_installment_payment(payment):
        installment = payment.installment
        if installment:
            installment.paid_amount += payment.amount
            if installment.paid_amount >= installment.amount:
                installment.status = Installment.Status.PAID
                installment.paid_at = timezone.now()
            else:
                installment.status = Installment.Status.PARTIALLY_PAID
            installment.save()

            # Check if all installments are paid
            financing = payment.financing
            if financing:
                all_paid = not financing.installments.exclude(
                    status=Installment.Status.PAID
                ).exists()
                if all_paid:
                    financing.status = FinancingApplication.Status.COMPLETED
                    financing.save(update_fields=["status", "updated_at"])

    @staticmethod
    def generate_receipt(payment):
        from apps.documents.services import DocumentService
        return DocumentService.generate_receipt(payment)
