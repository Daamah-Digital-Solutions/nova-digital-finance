from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid

class CapimaxPlatform(models.Model):
    """
    Capimax platform configuration and API settings
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform_name = models.CharField(max_length=100, default='Capimax')
    api_base_url = models.URLField(default='https://api.capimax.com/v1/')
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    
    # Platform status
    is_active = models.BooleanField(default=True)
    accepts_nova_certificates = models.BooleanField(default=True)
    minimum_investment_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('100.00'))
    maximum_investment_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50000.00'))
    
    # Fee structure
    platform_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.50'))
    nova_commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))  # Nova doesn't take commissions
    
    # Integration settings
    auto_sync_enabled = models.BooleanField(default=True)
    sync_interval_minutes = models.PositiveIntegerField(default=60)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.platform_name} ({'Active' if self.is_active else 'Inactive'})"

class CapimaxAccount(models.Model):
    """
    Client's account on Capimax platform linked to Nova certificate
    """
    ACCOUNT_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='capimax_account')
    certificate = models.OneToOneField('pronova.ElectronicCertificate', on_delete=models.CASCADE, related_name='capimax_account')
    platform = models.ForeignKey(CapimaxPlatform, on_delete=models.CASCADE)
    
    # Capimax account details
    capimax_account_id = models.CharField(max_length=255, unique=True)
    capimax_user_id = models.CharField(max_length=255)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='pending')
    
    # Investment capacity
    total_capacity_usd = models.DecimalField(max_digits=12, decimal_places=2)  # Based on certificate value
    available_capacity_usd = models.DecimalField(max_digits=12, decimal_places=2)
    invested_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Profit tracking
    total_profits_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_losses_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_profit_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Account lifecycle
    activated_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.capimax_account_id:
            self.capimax_account_id = f"NCA{timezone.now().year}{str(self.id)[:8].upper()}"
        
        # Set capacity based on certificate
        if not self.total_capacity_usd and self.certificate:
            self.total_capacity_usd = self.certificate.usd_value
            self.available_capacity_usd = self.certificate.usd_value
            
        # Calculate net profit
        self.net_profit_usd = self.total_profits_usd - self.total_losses_usd
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Capimax Account {self.capimax_account_id} - {self.user.email}"

class CapimaxInvestment(models.Model):
    """
    Individual investment made through Capimax using Nova certificate
    """
    INVESTMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]
    
    INVESTMENT_TYPES = [
        ('forex', 'Forex Trading'),
        ('stocks', 'Stock Market'),
        ('commodities', 'Commodities'),
        ('crypto', 'Cryptocurrency'),
        ('bonds', 'Government Bonds'),
        ('mutual_funds', 'Mutual Funds'),
        ('real_estate', 'Real Estate'),
        ('mixed_portfolio', 'Mixed Portfolio'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(CapimaxAccount, on_delete=models.CASCADE, related_name='investments')
    
    # Investment details
    investment_id = models.CharField(max_length=50, unique=True)
    capimax_investment_id = models.CharField(max_length=255)  # ID from Capimax platform
    investment_type = models.CharField(max_length=30, choices=INVESTMENT_TYPES)
    investment_name = models.CharField(max_length=200)
    
    # Financial details
    invested_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    current_value_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    profit_loss_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    profit_loss_percentage = models.DecimalField(max_digits=8, decimal_places=4, default=Decimal('0.0000'))
    
    # Investment lifecycle
    status = models.CharField(max_length=20, choices=INVESTMENT_STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField()
    expected_completion_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Risk and return
    risk_level = models.CharField(max_length=20, choices=[
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('very_high', 'Very High Risk'),
    ], default='medium')
    expected_return_percentage = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    
    # Metadata
    investment_description = models.TextField(blank=True)
    investment_terms = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.investment_id:
            self.investment_id = f"INV{timezone.now().year}{str(self.id)[:8].upper()}"
        
        # Calculate profit/loss percentage
        if self.invested_amount_usd > 0:
            self.profit_loss_usd = self.current_value_usd - self.invested_amount_usd
            self.profit_loss_percentage = (self.profit_loss_usd / self.invested_amount_usd) * 100
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Investment {self.investment_id} - {self.investment_name}"

class CapimaxTransaction(models.Model):
    """
    Transaction records for Capimax investments
    """
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit to Investment'),
        ('withdrawal', 'Withdrawal from Investment'),
        ('profit_distribution', 'Profit Distribution'),
        ('loss_realization', 'Loss Realization'),
        ('fee_payment', 'Fee Payment'),
        ('dividend', 'Dividend Payment'),
        ('interest', 'Interest Payment'),
    ]
    
    TRANSACTION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey(CapimaxInvestment, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(CapimaxAccount, on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction details
    transaction_id = models.CharField(max_length=50, unique=True)
    capimax_transaction_id = models.CharField(max_length=255, blank=True)
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    
    # Financial details
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    fee_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status and lifecycle
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='pending')
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    description = models.TextField(blank=True)
    transaction_data = models.JSONField(default=dict)  # Store additional API response data
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = f"TXN{timezone.now().year}{str(self.id)[:8].upper()}"
        
        # Calculate net amount
        if self.transaction_type in ['deposit', 'profit_distribution', 'dividend', 'interest']:
            self.net_amount_usd = self.amount_usd - self.fee_amount_usd
        else:  # withdrawal, loss, fee
            self.net_amount_usd = self.amount_usd + self.fee_amount_usd
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.get_transaction_type_display()}"

class CapimaxAPILog(models.Model):
    """
    Log of API communications with Capimax platform
    """
    LOG_TYPES = [
        ('account_creation', 'Account Creation'),
        ('investment_create', 'Investment Creation'),
        ('investment_update', 'Investment Update'),
        ('profit_sync', 'Profit Synchronization'),
        ('transaction_sync', 'Transaction Sync'),
        ('status_check', 'Status Check'),
        ('error_handling', 'Error Handling'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    log_type = models.CharField(max_length=30, choices=LOG_TYPES)
    
    # API call details
    endpoint = models.CharField(max_length=255)
    http_method = models.CharField(max_length=10)
    request_data = models.JSONField(default=dict)
    response_data = models.JSONField(default=dict)
    
    # Response details
    status_code = models.PositiveIntegerField()
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    # Timing
    request_at = models.DateTimeField(auto_now_add=True)
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    
    # Related objects
    account = models.ForeignKey(CapimaxAccount, on_delete=models.CASCADE, null=True, blank=True, related_name='api_logs')
    investment = models.ForeignKey(CapimaxInvestment, on_delete=models.CASCADE, null=True, blank=True, related_name='api_logs')
    
    class Meta:
        ordering = ['-request_at']
    
    def __str__(self):
        return f"{self.get_log_type_display()} - {self.status_code} ({self.request_at.strftime('%Y-%m-%d %H:%M')})"