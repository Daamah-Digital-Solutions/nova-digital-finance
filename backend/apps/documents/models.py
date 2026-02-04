from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Document(TimeStampedModel):
    class DocumentType(models.TextChoices):
        CERTIFICATE = "certificate", "Certificate (Sak)"
        CONTRACT = "contract", "Trilateral Contract"
        RECEIPT = "receipt", "Payment Receipt"
        KYC_SUMMARY = "kyc_summary", "KYC Summary"
        STATEMENT = "statement", "Account Statement"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    financing = models.ForeignKey(
        "financing.FinancingApplication",
        on_delete=models.CASCADE,
        related_name="documents",
        null=True,
        blank=True,
    )
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    document_number = models.CharField(max_length=30, unique=True, blank=True)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/")
    verification_code = models.CharField(max_length=64, blank=True)
    is_signed = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_number}: {self.title}"

    def save(self, *args, **kwargs):
        if not self.document_number:
            from common.utils import generate_document_number
            self.document_number = generate_document_number()
        super().save(*args, **kwargs)
