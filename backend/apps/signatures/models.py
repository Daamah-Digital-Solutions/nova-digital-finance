from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class SignatureRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SIGNED = "signed", "Signed"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.CASCADE,
        related_name="signature_requests",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="signature_requests",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField()
    signed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Signature: {self.document.title} ({self.status})"


class Signature(TimeStampedModel):
    signature_request = models.OneToOneField(
        SignatureRequest,
        on_delete=models.CASCADE,
        related_name="signature",
    )
    signature_image = models.ImageField(upload_to="signatures/")
    signature_data = models.JSONField(default=dict)
    consent_text = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Signed: {self.signature_request.document.title}"
