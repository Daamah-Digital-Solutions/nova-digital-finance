from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
import uuid
from datetime import datetime, timedelta

class LoanApplication(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loan_applications')
    
    # PRN Integration - Now loans are disbursed in PRN, not direct currency
    prn_amount = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))  # PRN amount (1:1 with USD)
    loan_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))  # USD value (always 1:1 with PRN)
    
    # Keep currency for display/calculation purposes only
    currency = models.ForeignKey('currencies.Currency', on_delete=models.CASCADE, null=True, blank=True)
    loan_amount_currency = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    exchange_rate_at_application = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    
    duration_months = models.PositiveIntegerField(default=12)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.50'))
    fee_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    monthly_payment_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_payment_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # PRN and Certificate Integration
    prn_issued = models.BooleanField(default=False)
    prn_pledged = models.BooleanField(default=False)
    certificate_generated = models.BooleanField(default=False)
    application_data = models.JSONField(default=dict)
    approval_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_loans'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Ensure PRN amount matches USD amount (1:1 peg)
        if self.loan_amount_usd and not self.prn_amount:
            self.prn_amount = self.loan_amount_usd
        elif self.prn_amount and not self.loan_amount_usd:
            self.loan_amount_usd = self.prn_amount
        
        if not self.fee_amount_usd:
            self.fee_amount_usd = self.loan_amount_usd * (self.fee_percentage / 100)
        
        if not self.monthly_payment_usd:
            self.monthly_payment_usd = self.loan_amount_usd / self.duration_months
            
        if not self.total_payment_usd:
            self.total_payment_usd = self.loan_amount_usd + self.fee_amount_usd
            
        super().save(*args, **kwargs)

    def issue_prn_and_certificate(self):
        """
        Issue PRN tokens and generate electronic certificate after loan approval
        """
        if self.status == 'approved' and not self.prn_issued:
            from wallets.models import WalletService
            from pronova.models import ElectronicCertificate
            from datetime import timedelta
            from django.utils import timezone
            
            # Get Nova's wallet service
            wallet_service, created = WalletService.objects.get_or_create(
                service_name='Nova PRN Service'
            )
            
            # Issue PRN tokens
            transaction = wallet_service.issue_prn(self.loan_amount_usd, self.user)
            
            # Pledge PRN immediately as collateral
            wallet_service.pledge_prn(self.prn_amount, self.user, self.id)
            
            # Generate electronic certificate
            certificate = ElectronicCertificate.objects.create(
                user=self.user,
                loan_application=self,
                prn_amount=self.prn_amount,
                usd_value=self.loan_amount_usd,
                status='pledged',
                expiry_date=timezone.now() + timedelta(days=30 * self.duration_months + 30)
            )
            
            # Create a Document record for the frontend Documents page
            from documents.models import Document
            Document.objects.create(
                user=self.user,
                loan_application=self,
                document_type='loan_certificate',
                title=f"PRN Certificate - {certificate.certificate_number}",
                document_number=certificate.certificate_number,
                generated_data={
                    'certificate_id': str(certificate.id),
                    'certificate_number': certificate.certificate_number,
                    'prn_amount': str(certificate.prn_amount),
                    'usd_value': str(certificate.usd_value),
                    'status': certificate.status
                },
                status='generated'
            )
            
            # Update loan application status
            self.prn_issued = True
            self.prn_pledged = True
            self.certificate_generated = True
            self.save()
            
            return transaction, certificate
        
        return None, None

class Loan(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='loan')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loans')
    loan_number = models.CharField(max_length=50, unique=True)
    currency = models.ForeignKey('currencies.Currency', on_delete=models.CASCADE)
    principal_amount_currency = models.DecimalField(max_digits=18, decimal_places=8)
    principal_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    fee_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_payment_usd = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    remaining_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.PositiveIntegerField()
    payments_made = models.PositiveIntegerField(default=0)
    next_payment_date = models.DateField()
    final_payment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_invested_capimax = models.BooleanField(default=False)
    capimax_investment_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.loan_number:
            self.loan_number = f"NL{datetime.now().year}{str(self.id)[:8].upper()}"
        
        if not self.remaining_amount_usd:
            self.remaining_amount_usd = self.total_amount_usd - self.paid_amount_usd
            
        if not self.next_payment_date:
            self.next_payment_date = datetime.now().date() + timedelta(days=30)
            
        if not self.final_payment_date:
            self.final_payment_date = datetime.now().date() + timedelta(days=30 * self.duration_months)
            
        super().save(*args, **kwargs)

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('installment', 'Monthly Installment'),
        ('partial', 'Partial Payment'),
        ('full', 'Full Settlement'),
        ('fee', 'Processing Fee'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='installment')
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=255, unique=True)
    gateway_response = models.JSONField(default=dict)
    installment_number = models.PositiveIntegerField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


# Signal handler for automatic payment receipt generation
@receiver(post_save, sender=Payment)
def auto_generate_payment_receipt(sender, instance, created, **kwargs):
    """
    Automatically generate payment receipt when payment is completed
    """
    if instance.status == 'completed' and instance.paid_date:
        # Check if receipt already exists
        from documents.models import Document
        existing_receipt = Document.objects.filter(
            user=instance.user,
            payment=instance,
            document_type='payment_receipt'
        ).first()
        
        if not existing_receipt:
            try:
                from documents.services import DocumentGenerationService
                doc_service = DocumentGenerationService()
                doc_service.generate_payment_receipt(instance)
                print(f"Auto-generated payment receipt for payment {instance.transaction_id}")
            except Exception as e:
                print(f"Failed to auto-generate payment receipt: {e}")


class LoanRequest(models.Model):
    REQUEST_TYPES = [
        ('increase', 'Loan Increase'),
        ('settlement', 'Early Settlement'),
        ('deferral', 'Payment Deferral'),
        ('transfer', 'Transfer to Another Person'),
        ('waiver', 'Payment Waiver'),
        ('extension', 'Loan Extension'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    description = models.TextField()
    request_data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_loan_requests'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
