from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid
from datetime import timedelta

class ContractTemplate(models.Model):
    """
    Template for different types of contracts
    """
    CONTRACT_TYPES = [
        ('loan_agreement', 'Loan Agreement'),
        ('tripartite_contract', 'Tripartite Contract (Nova-Client-Capimax)'),
        ('prn_issuance', 'PRN Issuance Agreement'),
        ('pledge_agreement', 'Pledge Agreement'),
        ('investment_authorization', 'Investment Authorization'),
    ]
    
    LANGUAGES = [
        ('en', 'English'),
        ('ar', 'Arabic'),
        ('es', 'Spanish'),
        ('fr', 'French'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    contract_type = models.CharField(max_length=50, choices=CONTRACT_TYPES)
    language = models.CharField(max_length=5, choices=LANGUAGES, default='en')
    version = models.CharField(max_length=10, default='1.0')
    template_content = models.TextField()  # HTML template with placeholders
    legal_text = models.TextField()  # Legal clauses and terms
    is_active = models.BooleanField(default=True)
    requires_signature = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['contract_type', 'language', 'version']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.language}) v{self.version}"

class TripartiteContract(models.Model):
    """
    Main tripartite contract between Nova, Client, and Capimax
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_signatures', 'Pending Signatures'),
        ('nova_signed', 'Nova Signed'),
        ('client_signed', 'Client Signed'),
        ('fully_executed', 'Fully Executed'),
        ('terminated', 'Terminated'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_number = models.CharField(max_length=50, unique=True)
    loan_application = models.OneToOneField('loans.LoanApplication', on_delete=models.CASCADE, related_name='tripartite_contract')
    certificate = models.OneToOneField('pronova.ElectronicCertificate', on_delete=models.CASCADE, related_name='tripartite_contract')
    
    # Parties
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tripartite_contracts')
    
    # Contract details
    prn_amount = models.DecimalField(max_digits=18, decimal_places=8)
    usd_value = models.DecimalField(max_digits=12, decimal_places=2)
    loan_duration_months = models.PositiveIntegerField()
    monthly_payment_usd = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Contract status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Signature tracking
    nova_signature_date = models.DateTimeField(null=True, blank=True)
    client_signature_date = models.DateTimeField(null=True, blank=True)
    nova_signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='nova_signed_contracts'
    )
    
    # Contract lifecycle
    effective_date = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField()
    termination_date = models.DateTimeField(null=True, blank=True)
    termination_reason = models.TextField(blank=True)
    
    # Document generation
    pdf_generated = models.BooleanField(default=False)
    pdf_file_path = models.CharField(max_length=500, blank=True)
    
    # Capimax integration
    capimax_contract_id = models.CharField(max_length=255, blank=True)
    capimax_authorized = models.BooleanField(default=False)
    capimax_authorization_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.contract_number:
            self.contract_number = f"TPC{timezone.now().year}{str(self.id)[:8].upper()}"
        
        if not self.expiry_date:
            self.expiry_date = timezone.now() + timedelta(days=30 * self.loan_duration_months + 30)
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Tripartite Contract {self.contract_number}"

class ElectronicSignature(models.Model):
    """
    Electronic signature records for contracts
    """
    SIGNATURE_TYPES = [
        ('click_to_sign', 'Click to Sign'),
        ('drawn_signature', 'Drawn Signature'),
        ('uploaded_signature', 'Uploaded Signature'),
        ('sms_verification', 'SMS Verification'),
        ('email_verification', 'Email Verification'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(TripartiteContract, on_delete=models.CASCADE, related_name='signatures')
    signer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contract_signatures')
    signer_role = models.CharField(max_length=50)  # 'client', 'nova_admin', etc.
    
    # Signature details
    signature_type = models.CharField(max_length=20, choices=SIGNATURE_TYPES)
    signature_data = models.TextField()  # Base64 signature image or verification code
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_method = models.CharField(max_length=50, blank=True)
    verification_code = models.CharField(max_length=10, blank=True)
    verification_attempts = models.PositiveIntegerField(default=0)
    
    signed_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['contract', 'signer']
    
    def __str__(self):
        return f"Signature by {self.signer.email} for {self.contract.contract_number}"

class ContractAmendment(models.Model):
    """
    Amendments to existing contracts
    """
    AMENDMENT_TYPES = [
        ('loan_extension', 'Loan Term Extension'),
        ('payment_modification', 'Payment Modification'),
        ('amount_adjustment', 'Amount Adjustment'),
        ('capimax_change', 'Capimax Investment Change'),
        ('general_amendment', 'General Amendment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_contract = models.ForeignKey(TripartiteContract, on_delete=models.CASCADE, related_name='amendments')
    amendment_number = models.CharField(max_length=50)
    amendment_type = models.CharField(max_length=30, choices=AMENDMENT_TYPES)
    
    # Amendment details
    description = models.TextField()
    changes_summary = models.JSONField(default=dict)  # Store what changed
    legal_justification = models.TextField()
    
    # Approval workflow
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requested_amendments')
    approved_by_nova = models.BooleanField(default=False)
    approved_by_client = models.BooleanField(default=False)
    
    # Effective dates
    requested_date = models.DateTimeField(auto_now_add=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    effective_date = models.DateTimeField(null=True, blank=True)
    
    # Document
    pdf_generated = models.BooleanField(default=False)
    pdf_file_path = models.CharField(max_length=500, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.amendment_number:
            contract_num = self.original_contract.contract_number
            amendment_count = self.original_contract.amendments.count() + 1
            self.amendment_number = f"{contract_num}-AMD{amendment_count:02d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Amendment {self.amendment_number}"

class ContractNotification(models.Model):
    """
    Notifications related to contract events
    """
    NOTIFICATION_TYPES = [
        ('signature_required', 'Signature Required'),
        ('contract_executed', 'Contract Fully Executed'),
        ('contract_expired', 'Contract Expired'),
        ('amendment_requested', 'Amendment Requested'),
        ('payment_reminder', 'Payment Reminder'),
        ('capimax_update', 'Capimax Update'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(TripartiteContract, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Delivery
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    
    # Actions
    action_required = models.BooleanField(default=False)
    action_url = models.URLField(blank=True)
    action_completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.notification_type} for {self.contract.contract_number}"
