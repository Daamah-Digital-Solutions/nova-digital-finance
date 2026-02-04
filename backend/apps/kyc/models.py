from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class KYCApplication(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="kyc_application",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_kyc_applications",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    pdf_summary = models.FileField(upload_to="kyc/summaries/", blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "KYC Application"
        verbose_name_plural = "KYC Applications"

    def __str__(self):
        return f"KYC: {self.user.email} ({self.status})"


class KYCDocument(TimeStampedModel):
    class DocumentType(models.TextChoices):
        PASSPORT = "passport", "Passport"
        NATIONAL_ID = "national_id", "National ID"
        DRIVERS_LICENSE = "drivers_license", "Driver's License"
        BANK_STATEMENT = "bank_statement", "Bank Statement"
        ADDRESS_PROOF = "address_proof", "Proof of Address"
        INCOME_PROOF = "income_proof", "Proof of Income"
        SELFIE = "selfie", "Selfie with ID"

    kyc_application = models.ForeignKey(
        KYCApplication,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file = models.FileField(upload_to="kyc/documents/")
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type}: {self.file_name}"
