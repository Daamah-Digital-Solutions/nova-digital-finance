from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class ClientRequest(TimeStampedModel):
    class RequestType(models.TextChoices):
        LOAN_INCREASE = "loan_increase", "Loan Increase"
        SETTLEMENT = "settlement", "Early Settlement"
        TRANSFER = "transfer", "Balance Transfer"
        DEFERRAL = "deferral", "Payment Deferral"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_requests",
    )
    financing = models.ForeignKey(
        "financing.FinancingApplication",
        on_delete=models.CASCADE,
        related_name="client_requests",
        null=True,
        blank=True,
    )
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    subject = models.CharField(max_length=255)
    details = models.JSONField(default=dict)
    description = models.TextField(blank=True)
    admin_response = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.request_type}: {self.subject} ({self.status})"
