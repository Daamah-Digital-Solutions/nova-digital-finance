from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Payment(TimeStampedModel):
    class PaymentType(models.TextChoices):
        FEE = "fee", "Application Fee"
        INSTALLMENT = "installment", "Installment Payment"

    class PaymentMethod(models.TextChoices):
        STRIPE_CARD = "stripe_card", "Credit/Debit Card"
        STRIPE_BANK = "stripe_bank", "Bank Transfer"
        CRYPTO = "crypto", "Cryptocurrency"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    financing = models.ForeignKey(
        "financing.FinancingApplication",
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
    )
    installment = models.ForeignKey(
        "financing.Installment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_reference = models.CharField(max_length=100, unique=True, blank=True)

    # Stripe fields
    stripe_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    # NowPayments fields
    nowpayments_payment_id = models.CharField(max_length=255, blank=True)
    nowpayments_order_id = models.CharField(max_length=255, blank=True)
    crypto_address = models.CharField(max_length=255, blank=True)
    crypto_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    crypto_currency = models.CharField(max_length=20, blank=True)

    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_reference}: {self.amount} {self.currency} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.transaction_reference:
            from common.utils import generate_reference
            self.transaction_reference = generate_reference(prefix="PAY")
        super().save(*args, **kwargs)


class ScheduledPayment(TimeStampedModel):
    installment = models.ForeignKey(
        "financing.Installment",
        on_delete=models.CASCADE,
        related_name="scheduled_payments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scheduled_payments",
    )
    scheduled_date = models.DateField()
    payment_method = models.CharField(
        max_length=20, choices=Payment.PaymentMethod.choices
    )
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scheduled_source",
    )

    class Meta:
        ordering = ["scheduled_date"]

    def __str__(self):
        return f"Scheduled: {self.installment} on {self.scheduled_date}"
