from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid

class PaymentMethod(models.Model):
    PAYMENT_TYPES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('digital_wallet', 'Digital Wallet'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    card_last_four = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)  # Visa, MasterCard, etc.
    card_exp_month = models.PositiveIntegerField(null=True, blank=True)
    card_exp_year = models.PositiveIntegerField(null=True, blank=True)
    stripe_payment_method_id = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            # Ensure only one default payment method per user
            PaymentMethod.objects.filter(
                user=self.user, 
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)

class PaymentIntent(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
        ('requires_action', 'Requires Action'),
    ]

    PAYMENT_PURPOSE = [
        ('loan_fee', 'Loan Processing Fee'),
        ('installment', 'Loan Installment'),
        ('penalty', 'Late Payment Penalty'),
        ('settlement', 'Early Settlement'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    loan_application = models.ForeignKey('loans.LoanApplication', on_delete=models.CASCADE, null=True, blank=True)
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, null=True, blank=True)
    
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')
    
    purpose = models.CharField(max_length=20, choices=PAYMENT_PURPOSE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)
    client_secret = models.TextField()
    
    metadata = models.JSONField(default=dict)
    stripe_response = models.JSONField(default=dict)
    
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class PaymentTransaction(models.Model):
    TRANSACTION_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('disputed', 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_intent = models.OneToOneField(PaymentIntent, on_delete=models.CASCADE, related_name='transaction')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    amount_charged = models.DecimalField(max_digits=12, decimal_places=2)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2)
    processing_fee = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='pending')
    failure_reason = models.TextField(blank=True)
    
    receipt_url = models.URLField(blank=True)
    invoice_pdf = models.FileField(upload_to='invoices/', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RefundRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(PaymentTransaction, on_delete=models.CASCADE, related_name='refund_requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    reason = models.TextField()
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    amount_approved = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    
    stripe_refund_id = models.CharField(max_length=255, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds'
    )
    
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
