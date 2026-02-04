from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class FinancingApplication(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_FEE = "pending_fee", "Pending Fee Payment"
        FEE_PAID = "fee_paid", "Fee Paid"
        PENDING_SIGNATURE = "pending_signature", "Pending Signature"
        SIGNED = "signed", "Signed"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="financing_applications",
    )
    application_number = models.CharField(max_length=30, unique=True, blank=True)
    bronova_amount = models.DecimalField(max_digits=14, decimal_places=2)
    usd_equivalent = models.DecimalField(max_digits=14, decimal_places=2)
    fee_percentage = models.DecimalField(max_digits=4, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=12, decimal_places=2)
    repayment_period_months = models.PositiveIntegerField()
    monthly_installment = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    # Acknowledgment fields
    ack_terms = models.BooleanField(default=False)
    ack_fee_non_refundable = models.BooleanField(default=False)
    ack_repayment_schedule = models.BooleanField(default=False)
    ack_risk_disclosure = models.BooleanField(default=False)

    # Admin fields
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_applications",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.application_number}: {self.bronova_amount} PRN ({self.status})"

    def save(self, *args, **kwargs):
        if not self.application_number:
            from common.utils import generate_reference
            self.application_number = generate_reference(prefix="FA")
        super().save(*args, **kwargs)

    @property
    def total_repayment(self):
        return self.bronova_amount

    @property
    def total_with_fee(self):
        return self.bronova_amount + self.fee_amount


class Installment(TimeStampedModel):
    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        DUE = "due", "Due"
        PAID = "paid", "Paid"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        OVERDUE = "overdue", "Overdue"
        DEFERRED = "deferred", "Deferred"

    financing = models.ForeignKey(
        FinancingApplication,
        on_delete=models.CASCADE,
        related_name="installments",
    )
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING)
    paid_at = models.DateTimeField(null=True, blank=True)
    deferred_to = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["installment_number"]
        unique_together = ["financing", "installment_number"]

    def __str__(self):
        return f"#{self.installment_number} - {self.amount} ({self.status})"

    @property
    def remaining_amount(self):
        return self.amount - self.paid_amount

    @property
    def is_fully_paid(self):
        return self.paid_amount >= self.amount
