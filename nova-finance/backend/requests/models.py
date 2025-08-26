from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class LoanRequest(models.Model):
    """
    Model for various loan modification requests
    """
    REQUEST_TYPES = [
        ('increase', 'Loan Amount Increase'),
        ('settlement', 'Early Settlement'),
        ('deferral', 'Payment Deferral'),
        ('restructure', 'Loan Restructuring'),
        ('extension', 'Loan Extension'),
        ('partial_settlement', 'Partial Settlement'),
        ('currency_change', 'Currency Change'),
        ('payment_plan', 'Payment Plan Modification'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loan_requests')
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, related_name='modification_requests')
    
    # Request details
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPES)
    request_number = models.CharField(max_length=50, unique=True, blank=True)
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    reason = models.TextField(help_text="Reason for the request")
    
    # Request data (flexible JSON field for different request types)
    request_data = models.JSONField(default=dict, help_text="Request-specific data")
    
    # Financial details (if applicable)
    requested_amount_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Amount for increase/settlement requests"
    )
    current_balance_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Current loan balance at time of request"
    )
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    # Approval details
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='approved_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Additional details
    supporting_documents = models.ManyToManyField(
        'documents.Document', blank=True, 
        help_text="Supporting documents for the request"
    )
    
    # Financial impact (calculated fields)
    fee_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    new_monthly_payment_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_final_payment_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Internal notes
    internal_notes = models.TextField(blank=True, help_text="Internal staff notes")
    customer_notes = models.TextField(blank=True, help_text="Notes visible to customer")

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Loan Request"
        verbose_name_plural = "Loan Requests"

    def save(self, *args, **kwargs):
        if not self.request_number:
            self.request_number = self.generate_request_number()
        super().save(*args, **kwargs)

    def generate_request_number(self):
        from datetime import datetime
        prefix = self.request_type.upper()[:3]
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"{prefix}-{timestamp}-{str(self.id)[:8].upper()}"

    def __str__(self):
        return f"{self.get_request_type_display()} - {self.request_number}"


class LoanIncreaseRequest(models.Model):
    """
    Specific model for loan amount increase requests
    """
    INCREASE_REASONS = [
        ('business_expansion', 'Business Expansion'),
        ('investment_opportunity', 'Investment Opportunity'),
        ('emergency_expense', 'Emergency Expense'),
        ('debt_consolidation', 'Debt Consolidation'),
        ('market_opportunity', 'Market Opportunity'),
        ('other', 'Other'),
    ]

    loan_request = models.OneToOneField(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='increase_details'
    )
    
    # Current loan details
    current_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    current_monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Requested increase details
    increase_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    increase_reason = models.CharField(max_length=30, choices=INCREASE_REASONS)
    
    # New loan terms (if approved)
    new_total_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    new_monthly_payment_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_duration_months = models.IntegerField(null=True, blank=True)
    
    # Additional fee for increase
    processing_fee_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Risk assessment
    income_verification_required = models.BooleanField(default=True)
    additional_documents_required = models.BooleanField(default=False)
    credit_check_required = models.BooleanField(default=True)

    def __str__(self):
        return f"Increase Request - {self.increase_amount_usd} USD"


class SettlementRequest(models.Model):
    """
    Specific model for early settlement requests
    """
    SETTLEMENT_TYPES = [
        ('full', 'Full Settlement'),
        ('partial', 'Partial Settlement'),
    ]

    loan_request = models.OneToOneField(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='settlement_details'
    )
    
    settlement_type = models.CharField(max_length=20, choices=SETTLEMENT_TYPES, default='full')
    
    # Current loan status
    current_outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    current_monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    remaining_payments = models.IntegerField()
    
    # Settlement details
    settlement_amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    settlement_fee_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Settlement terms
    settlement_deadline = models.DateField()
    payment_method = models.CharField(max_length=50, default='bank_transfer')
    
    # Savings calculation
    total_savings_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    interest_savings_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def calculate_settlement_amount(self):
        """
        Calculate settlement amount with potential discount
        """
        # Standard calculation: 95% of outstanding balance for early settlement
        discount_rate = Decimal('0.05')  # 5% discount for early settlement
        settlement_amount = self.current_outstanding_balance * (Decimal('1.00') - discount_rate)
        
        self.settlement_amount_usd = settlement_amount
        self.discount_amount_usd = self.current_outstanding_balance - settlement_amount
        
        # Calculate savings (remaining payments - settlement amount)
        total_remaining_payments = self.current_monthly_payment * self.remaining_payments
        self.total_savings_usd = total_remaining_payments - settlement_amount
        
        return settlement_amount

    def __str__(self):
        return f"{self.get_settlement_type_display()} - {self.settlement_amount_usd} USD"


class DeferralRequest(models.Model):
    """
    Specific model for payment deferral requests
    """
    DEFERRAL_REASONS = [
        ('financial_hardship', 'Financial Hardship'),
        ('job_loss', 'Job Loss'),
        ('medical_emergency', 'Medical Emergency'),
        ('business_disruption', 'Business Disruption'),
        ('natural_disaster', 'Natural Disaster'),
        ('other', 'Other'),
    ]

    loan_request = models.OneToOneField(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='deferral_details'
    )
    
    # Deferral details
    deferral_reason = models.CharField(max_length=30, choices=DEFERRAL_REASONS)
    requested_months = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    
    # Current payment details
    next_payment_due = models.DateField()
    monthly_payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # New payment schedule (if approved)
    new_payment_start_date = models.DateField(null=True, blank=True)
    new_final_payment_date = models.DateField(null=True, blank=True)
    deferral_fee_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Supporting information
    expected_income_recovery_date = models.DateField(null=True, blank=True)
    proposed_catch_up_plan = models.TextField(blank=True)
    
    # Risk assessment
    hardship_documentation_provided = models.BooleanField(default=False)
    alternative_payment_plan = models.TextField(blank=True)

    def __str__(self):
        return f"Deferral Request - {self.requested_months} months"


class RequestStatusHistory(models.Model):
    """
    Model to track status changes in loan requests
    """
    loan_request = models.ForeignKey(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='status_history'
    )
    
    old_status = models.CharField(max_length=20, choices=LoanRequest.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=LoanRequest.STATUS_CHOICES)
    
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True
    )
    change_reason = models.TextField(blank=True)
    
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name = "Request Status History"
        verbose_name_plural = "Request Status Histories"

    def __str__(self):
        return f"{self.old_status} → {self.new_status} at {self.changed_at}"


class RequestComment(models.Model):
    """
    Model for comments and communications on loan requests
    """
    COMMENT_TYPES = [
        ('customer', 'Customer Comment'),
        ('staff', 'Staff Note'),
        ('system', 'System Message'),
        ('approval', 'Approval Note'),
        ('rejection', 'Rejection Note'),
    ]

    loan_request = models.ForeignKey(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='comments'
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True
    )
    comment_type = models.CharField(max_length=20, choices=COMMENT_TYPES, default='customer')
    
    content = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Internal staff notes not visible to customer")
    is_important = models.BooleanField(default=False)
    
    # File attachments
    attachments = models.ManyToManyField('documents.Document', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_comment_type_display()} by {self.author} at {self.created_at}"


class RequestApprovalWorkflow(models.Model):
    """
    Model for approval workflow steps
    """
    WORKFLOW_STEPS = [
        ('initial_review', 'Initial Review'),
        ('financial_analysis', 'Financial Analysis'),
        ('risk_assessment', 'Risk Assessment'),
        ('management_approval', 'Management Approval'),
        ('final_approval', 'Final Approval'),
    ]

    STEP_STATUS = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
    ]

    loan_request = models.ForeignKey(
        LoanRequest, on_delete=models.CASCADE, 
        related_name='approval_steps'
    )
    
    step_name = models.CharField(max_length=30, choices=WORKFLOW_STEPS)
    step_order = models.IntegerField()
    status = models.CharField(max_length=20, choices=STEP_STATUS, default='pending')
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='assigned_approval_steps'
    )
    
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='completed_approval_steps'
    )
    
    notes = models.TextField(blank=True)
    decision = models.CharField(max_length=20, blank=True)  # 'approved', 'rejected', 'pending'
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['step_order']
        unique_together = ['loan_request', 'step_name']

    def __str__(self):
        return f"{self.get_step_name_display()} - {self.status}"