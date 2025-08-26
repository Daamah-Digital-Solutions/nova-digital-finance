from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
import uuid
import os

class DocumentTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('loan_certificate', 'Loan Certificate'),
        ('financing_contract', 'Financing Contract'),
        ('kyc_report', 'KYC Report'),
        ('payment_receipt', 'Payment Receipt'),
        ('investment_certificate', 'Investment Certificate'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES)
    html_template = models.TextField()
    css_styles = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    version = models.CharField(max_length=10, default='1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['template_type', 'version']

    def __str__(self):
        return f"{self.name} v{self.version}"

class Document(models.Model):
    DOCUMENT_TYPES = [
        ('loan_certificate', 'Loan Certificate'),
        ('financing_contract', 'Financing Contract'),
        ('kyc_report', 'KYC Report'),
        ('payment_receipt', 'Payment Receipt'),
        ('investment_certificate', 'Investment Certificate'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('signed', 'Signed'),
        ('delivered', 'Delivered'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    loan_application = models.ForeignKey('loans.LoanApplication', on_delete=models.CASCADE, null=True, blank=True)
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, null=True, blank=True)
    payment = models.ForeignKey('loans.Payment', on_delete=models.CASCADE, null=True, blank=True)
    
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=255)
    document_number = models.CharField(max_length=50, unique=True)
    
    template_used = models.ForeignKey(DocumentTemplate, on_delete=models.PROTECT, null=True, blank=True)
    generated_data = models.JSONField(default=dict)
    
    pdf_file = models.FileField(upload_to='documents/', blank=True)
    html_content = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_public = models.BooleanField(default=False)
    
    digital_signature = models.TextField(blank=True)
    signature_timestamp = models.DateTimeField(null=True, blank=True)
    
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.document_number:
            self.document_number = self.generate_document_number()
        super().save(*args, **kwargs)

    def generate_document_number(self):
        from datetime import datetime
        prefix = self.document_type.upper()[:3]
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"{prefix}-{timestamp}-{str(self.id)[:8].upper()}"

    def get_download_url(self):
        if self.pdf_file:
            return self.pdf_file.url
        return None

class ElectronicSignature(models.Model):
    SIGNATURE_TYPES = [
        ('simple', 'Simple Electronic Signature'),
        ('advanced', 'Advanced Electronic Signature'),
        ('qualified', 'Qualified Electronic Signature'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='document_signatures')
    
    signature_type = models.CharField(max_length=20, choices=SIGNATURE_TYPES, default='simple')
    signature_data = models.TextField()  # Base64 encoded signature or hash
    signature_method = models.CharField(max_length=50)  # 'canvas', 'typed', 'uploaded', etc.
    
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    geolocation = models.JSONField(default=dict, blank=True)
    
    certificate_data = models.TextField(blank=True)
    verification_hash = models.CharField(max_length=256)
    
    signed_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)

    class Meta:
        ordering = ['-signed_at']

class DocumentAccess(models.Model):
    ACCESS_TYPES = [
        ('view', 'View'),
        ('download', 'Download'),
        ('share', 'Share'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    session_id = models.CharField(max_length=255, blank=True)
    referrer = models.URLField(blank=True)
    
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-accessed_at']

class DocumentShare(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    share_token = models.CharField(max_length=128, unique=True)
    shared_with_email = models.EmailField(blank=True)
    
    can_download = models.BooleanField(default=True)
    password_protected = models.BooleanField(default=False)
    password_hash = models.CharField(max_length=128, blank=True)
    
    access_count = models.PositiveIntegerField(default=0)
    max_access_count = models.PositiveIntegerField(null=True, blank=True)
    
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
