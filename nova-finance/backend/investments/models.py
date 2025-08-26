from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
import uuid


class InvestmentPlatform(models.Model):
    """
    Model for investment platforms (like Capimax)
    """
    PLATFORM_TYPES = [
        ('cryptocurrency', 'Cryptocurrency Platform'),
        ('forex', 'Forex Trading'),
        ('stocks', 'Stock Market'),
        ('commodities', 'Commodities'),
        ('mixed', 'Mixed Assets'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Under Maintenance'),
        ('suspended', 'Suspended'),
        ('beta', 'Beta Testing'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    platform_type = models.CharField(max_length=20, choices=PLATFORM_TYPES)
    
    description = models.TextField()
    website_url = models.URLField()
    api_endpoint = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    
    min_investment_usd = models.DecimalField(
        max_digits=12, decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    max_investment_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=4,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('1'))],
        help_text="Commission rate as decimal (e.g., 0.001 for 0.1%)"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_verified = models.BooleanField(default=False)
    supports_certificates = models.BooleanField(default=True)
    
    # API Integration settings
    api_key_required = models.BooleanField(default=True)
    webhook_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_platform_type_display()})"


class UserInvestmentAccount(models.Model):
    """
    Model for user accounts on investment platforms
    """
    VERIFICATION_STATUS = [
        ('pending', 'Verification Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    platform = models.ForeignKey(InvestmentPlatform, on_delete=models.CASCADE)
    
    platform_user_id = models.CharField(max_length=255)
    platform_username = models.CharField(max_length=255, blank=True)
    
    # Account verification
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # API credentials (encrypted)
    api_key = models.TextField(blank=True, help_text="Encrypted API key")
    api_secret = models.TextField(blank=True, help_text="Encrypted API secret")
    
    # Account balance tracking
    balance_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    available_balance_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'platform']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} on {self.platform.name}"


class InvestmentPosition(models.Model):
    """
    Model for tracking investment positions
    """
    POSITION_TYPES = [
        ('long', 'Long Position'),
        ('short', 'Short Position'),
        ('neutral', 'Neutral'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(UserInvestmentAccount, on_delete=models.CASCADE, related_name='positions')
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, null=True, blank=True)
    
    # Position details
    position_id = models.CharField(max_length=255, help_text="Platform-specific position ID")
    asset_symbol = models.CharField(max_length=20)
    asset_name = models.CharField(max_length=255)
    
    position_type = models.CharField(max_length=20, choices=POSITION_TYPES, default='long')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Financial details
    investment_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    current_value_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    entry_price = models.DecimalField(max_digits=16, decimal_places=8)
    current_price = models.DecimalField(max_digits=16, decimal_places=8, default=Decimal('0.00'))
    
    quantity = models.DecimalField(max_digits=16, decimal_places=8)
    
    # P&L tracking
    unrealized_pnl_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    realized_pnl_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Timestamps
    opened_at = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-opened_at']

    def __str__(self):
        return f"{self.asset_symbol} position - ${self.investment_amount_usd}"

    @property
    def profit_loss_percentage(self):
        if self.investment_amount_usd > 0:
            return (self.unrealized_pnl_usd / self.investment_amount_usd) * 100
        return Decimal('0.00')


# Signal handler for automatic investment certificate generation
@receiver(post_save, sender=InvestmentPosition)
def auto_generate_investment_certificate(sender, instance, created, **kwargs):
    """
    Automatically generate investment certificate when investment position becomes active
    """
    if instance.status == 'active' and instance.investment_amount_usd > 0:
        # Check if certificate already exists
        from documents.models import Document
        existing_certificate = Document.objects.filter(
            user=instance.account.user,
            document_type='investment_certificate'
        ).filter(
            generated_data__position_id=str(instance.id)
        ).first()
        
        if not existing_certificate:
            try:
                from documents.services import DocumentGenerationService
                doc_service = DocumentGenerationService()
                
                # Create investment data structure for certificate generation
                investment_data = {
                    'id': str(instance.id),
                    'amount_usd': float(instance.investment_amount_usd),
                    'asset_allocation': {
                        'symbol': instance.asset_symbol,
                        'name': instance.asset_name,
                        'percentage': 100
                    },
                    'expected_return_percentage': 10,  # Default expected return
                    'term_months': 12,  # Default term
                    'platform_name': instance.account.platform.name,
                    'position_type': instance.position_type,
                    'opened_at': instance.opened_at.isoformat() if instance.opened_at else None
                }
                
                # Create a mock investment object
                from types import SimpleNamespace
                investment = SimpleNamespace(
                    id=investment_data['id'],
                    user=instance.account.user,
                    amount_usd=investment_data['amount_usd'],
                    asset_allocation=investment_data['asset_allocation'],
                    expected_return_percentage=investment_data['expected_return_percentage'],
                    term_months=investment_data['term_months'],
                    platform_name=investment_data['platform_name'],
                    position_type=investment_data['position_type'],
                    opened_at=instance.opened_at
                )
                
                doc_service.generate_investment_certificate(investment)
                print(f"Auto-generated investment certificate for position {instance.id}")
            except Exception as e:
                print(f"Failed to auto-generate investment certificate: {e}")


class InvestmentTransaction(models.Model):
    """
    Model for tracking investment transactions
    """
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('buy', 'Buy Order'),
        ('sell', 'Sell Order'),
        ('dividend', 'Dividend Payment'),
        ('fee', 'Platform Fee'),
        ('commission', 'Commission'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(UserInvestmentAccount, on_delete=models.CASCADE, related_name='transactions')
    position = models.ForeignKey(InvestmentPosition, on_delete=models.CASCADE, null=True, blank=True)
    
    transaction_id = models.CharField(max_length=255, help_text="Platform-specific transaction ID")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Asset information
    asset_symbol = models.CharField(max_length=20, blank=True)
    quantity = models.DecimalField(max_digits=16, decimal_places=8, null=True, blank=True)
    price = models.DecimalField(max_digits=16, decimal_places=8, null=True, blank=True)
    
    # Financial details
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    fee_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    executed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-executed_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()} - ${self.amount_usd}"


class CapimaxIntegration(models.Model):
    """
    Specific model for Capimax platform integration
    """
    INVESTMENT_STRATEGIES = [
        ('conservative', 'Conservative Growth'),
        ('moderate', 'Moderate Growth'),
        ('aggressive', 'Aggressive Growth'),
        ('income', 'Income Focused'),
        ('balanced', 'Balanced Portfolio'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Capimax specific settings
    capimax_user_id = models.CharField(max_length=255, unique=True)
    preferred_strategy = models.CharField(max_length=20, choices=INVESTMENT_STRATEGIES, default='balanced')
    
    # Risk management
    max_investment_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('50.00'),
        validators=[MinValueValidator(Decimal('1.00')), MaxValueValidator(Decimal('100.00'))],
        help_text="Maximum percentage of loan amount to invest"
    )
    
    stop_loss_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('10.00'),
        validators=[MinValueValidator(Decimal('1.00')), MaxValueValidator(Decimal('50.00'))],
        help_text="Stop loss percentage"
    )
    
    take_profit_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('20.00'),
        validators=[MinValueValidator(Decimal('5.00')), MaxValueValidator(Decimal('100.00'))],
        help_text="Take profit percentage"
    )
    
    # Auto-investment settings
    auto_invest_enabled = models.BooleanField(default=False)
    auto_invest_amount_usd = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100.00'))
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # API integration
    api_key = models.TextField(blank=True, help_text="Encrypted Capimax API key")
    webhook_secret = models.CharField(max_length=255, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Capimax Integration"
        verbose_name_plural = "Capimax Integrations"

    def __str__(self):
        return f"Capimax integration for {self.user.username}"


class InvestmentAlert(models.Model):
    """
    Model for investment alerts and notifications
    """
    ALERT_TYPES = [
        ('price_target', 'Price Target Reached'),
        ('stop_loss', 'Stop Loss Triggered'),
        ('take_profit', 'Take Profit Triggered'),
        ('margin_call', 'Margin Call'),
        ('deposit_required', 'Deposit Required'),
        ('withdrawal_completed', 'Withdrawal Completed'),
        ('position_closed', 'Position Closed'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investment_alerts')
    account = models.ForeignKey(UserInvestmentAccount, on_delete=models.CASCADE, null=True, blank=True)
    position = models.ForeignKey(InvestmentPosition, on_delete=models.CASCADE, null=True, blank=True)
    
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Trigger conditions
    trigger_price = models.DecimalField(max_digits=16, decimal_places=8, null=True, blank=True)
    trigger_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    
    triggered_at = models.DateTimeField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-triggered_at']

    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.user.username}"