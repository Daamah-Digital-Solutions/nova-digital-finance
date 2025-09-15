from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid
from datetime import datetime

class PRNWallet(models.Model):
    """
    PRN (Pronova) Wallet for each user - tracks their PRN balance
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prn_wallet')
    balance = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    pledged_balance = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    available_balance = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    wallet_address = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.wallet_address:
            self.wallet_address = f"PRN{str(self.id)[:8].upper()}{datetime.now().strftime('%Y%m')}"
        
        # Calculate available balance (total - pledged)
        self.available_balance = self.balance - self.pledged_balance
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.balance} PRN"

class PRNTransaction(models.Model):
    """
    PRN transaction history - all PRN movements
    """
    TRANSACTION_TYPES = [
        ('issue', 'Issue PRN (Loan Disbursement)'),
        ('pledge', 'Pledge PRN (Loan Collateral)'),
        ('unpledge', 'Unpledge PRN (Loan Repayment)'),
        ('transfer', 'Transfer PRN'),
        ('burn', 'Burn PRN (System)'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_hash = models.CharField(max_length=128, unique=True)
    from_wallet = models.ForeignKey(PRNWallet, on_delete=models.CASCADE, related_name='outgoing_transactions', null=True, blank=True)
    to_wallet = models.ForeignKey(PRNWallet, on_delete=models.CASCADE, related_name='incoming_transactions')
    amount = models.DecimalField(max_digits=18, decimal_places=8)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_id = models.CharField(max_length=255, blank=True)  # Link to loan application
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.transaction_hash:
            self.transaction_hash = f"PRN{datetime.now().strftime('%Y%m%d%H%M%S')}{str(self.id)[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type}: {self.amount} PRN - {self.status}"

class ElectronicCertificate(models.Model):
    """
    Electronic Certificate (الصك الإلكتروني) - proves PRN ownership
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pledged', 'Pledged to Nova'),
        ('released', 'Released'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    loan_application = models.OneToOneField('loans.LoanApplication', on_delete=models.CASCADE, related_name='certificate')
    prn_amount = models.DecimalField(max_digits=18, decimal_places=8)
    usd_value = models.DecimalField(max_digits=12, decimal_places=2)  # Always 1:1 with PRN
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Certificate details
    issued_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    pledge_release_date = models.DateTimeField(null=True, blank=True)
    
    # Capimax integration
    capimax_certificate_id = models.CharField(max_length=255, blank=True)
    capimax_investment_active = models.BooleanField(default=False)
    
    # Document generation
    pdf_generated = models.BooleanField(default=False)
    pdf_file_path = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.certificate_number = f"NC{datetime.now().year}{str(self.id)[:8].upper()}"
        
        # PRN is always 1:1 with USD
        if self.prn_amount and not self.usd_value:
            self.usd_value = self.prn_amount
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificate {self.certificate_number} - {self.prn_amount} PRN"

class CapimaxInvestment(models.Model):
    """
    Track investments made on Capimax platform using certificates
    """
    STATUS_CHOICES = [
        ('active', 'Active Investment'),
        ('completed', 'Investment Completed'),
        ('withdrawn', 'Investment Withdrawn'),
        ('paused', 'Investment Paused'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate = models.OneToOneField(ElectronicCertificate, on_delete=models.CASCADE, related_name='capimax_investment')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='capimax_investments')
    
    # Capimax details
    capimax_investment_id = models.CharField(max_length=255, unique=True)
    capimax_profile_id = models.CharField(max_length=255)
    investment_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    investment_type = models.CharField(max_length=100)
    
    # Profit tracking
    current_profit_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_profit_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_profit_update = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_date = models.DateTimeField(auto_now_add=True)
    ended_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Capimax Investment {self.capimax_investment_id} - ${self.investment_amount_usd}"

class PRNSystemReserve(models.Model):
    """
    System reserve tracking - Nova's PRN backing reserves
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    total_prn_issued = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    total_usd_backing = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    prn_in_circulation = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    prn_pledged_total = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    
    # System health metrics
    backing_ratio = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('1.0000'))  # Should always be 1.0000
    last_audit_date = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Ensure 1:1 backing ratio
        if self.total_prn_issued > 0:
            self.backing_ratio = self.total_usd_backing / self.total_prn_issued
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PRN Reserve: {self.total_prn_issued} PRN backed by ${self.total_usd_backing}"
