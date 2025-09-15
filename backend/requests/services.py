from datetime import datetime, timedelta, date
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from typing import Dict, List, Optional

from .models import (
    LoanRequest, LoanIncreaseRequest, SettlementRequest, DeferralRequest,
    RequestStatusHistory, RequestComment, RequestApprovalWorkflow
)
from loans.models import Loan, Payment
from documents.services import DocumentGenerationService


class LoanRequestService:
    """
    Service for managing loan modification requests
    """

    def create_increase_request(self, user, loan: Loan, data: Dict) -> LoanRequest:
        """
        Create a loan amount increase request
        """
        with transaction.atomic():
            # Validate loan is eligible for increase
            if loan.status != 'active':
                raise ValueError("Only active loans can be increased")
            
            if loan.modification_requests.filter(
                request_type='increase', 
                status__in=['pending', 'under_review', 'approved']
            ).exists():
                raise ValueError("There is already a pending increase request for this loan")

            # Calculate current loan details
            current_balance = loan.remaining_balance_usd
            increase_amount = Decimal(data['increase_amount_usd'])
            new_total_amount = loan.principal_amount_usd + increase_amount
            
            # Calculate processing fee (1% of increase amount)
            processing_fee = increase_amount * Decimal('0.01')
            
            # Create main request
            loan_request = LoanRequest.objects.create(
                user=user,
                loan=loan,
                request_type='increase',
                title=f"Loan Amount Increase - {increase_amount} USD",
                description=data.get('description', ''),
                reason=data.get('reason', ''),
                requested_amount_usd=increase_amount,
                current_balance_usd=current_balance,
                fee_amount_usd=processing_fee,
                request_data={
                    'current_loan_amount': str(loan.principal_amount_usd),
                    'requested_increase': str(increase_amount),
                    'new_total_amount': str(new_total_amount),
                    'processing_fee': str(processing_fee)
                }
            )

            # Create specific increase request details
            LoanIncreaseRequest.objects.create(
                loan_request=loan_request,
                current_amount_usd=loan.principal_amount_usd,
                current_monthly_payment=loan.monthly_payment_usd,
                increase_amount_usd=increase_amount,
                increase_reason=data.get('increase_reason', 'other'),
                new_total_amount_usd=new_total_amount,
                processing_fee_usd=processing_fee
            )

            # Initialize approval workflow
            self._initialize_approval_workflow(loan_request, 'increase')
            
            # Add initial comment
            self._add_system_comment(
                loan_request, 
                f"Loan increase request created for {increase_amount} USD"
            )

            return loan_request

    def create_settlement_request(self, user, loan: Loan, data: Dict) -> LoanRequest:
        """
        Create an early settlement request
        """
        with transaction.atomic():
            if loan.status != 'active':
                raise ValueError("Only active loans can be settled")

            # Calculate current loan details
            current_balance = loan.remaining_balance_usd
            remaining_payments = loan.remaining_payments_count
            settlement_type = data.get('settlement_type', 'full')
            
            # Calculate settlement amount with discount
            discount_rate = Decimal('0.05')  # 5% early settlement discount
            settlement_amount = current_balance * (Decimal('1.00') - discount_rate)
            discount_amount = current_balance - settlement_amount
            
            # Calculate savings
            total_remaining_payments = loan.monthly_payment_usd * remaining_payments
            total_savings = total_remaining_payments - settlement_amount

            # Create main request
            loan_request = LoanRequest.objects.create(
                user=user,
                loan=loan,
                request_type='settlement',
                title=f"Early Settlement Request - {settlement_type.title()}",
                description=data.get('description', ''),
                reason=data.get('reason', 'Early payoff to save on interest'),
                requested_amount_usd=settlement_amount,
                current_balance_usd=current_balance,
                request_data={
                    'settlement_type': settlement_type,
                    'current_balance': str(current_balance),
                    'settlement_amount': str(settlement_amount),
                    'discount_amount': str(discount_amount),
                    'total_savings': str(total_savings)
                }
            )

            # Create specific settlement request details
            settlement_deadline = timezone.now().date() + timedelta(days=30)
            
            settlement_request = SettlementRequest.objects.create(
                loan_request=loan_request,
                settlement_type=settlement_type,
                current_outstanding_balance=current_balance,
                current_monthly_payment=loan.monthly_payment_usd,
                remaining_payments=remaining_payments,
                settlement_amount_usd=settlement_amount,
                discount_amount_usd=discount_amount,
                settlement_deadline=settlement_deadline,
                total_savings_usd=total_savings
            )

            # Initialize approval workflow (simplified for settlements)
            self._initialize_approval_workflow(loan_request, 'settlement')
            
            # Add initial comment
            self._add_system_comment(
                loan_request,
                f"Settlement request created. Settlement amount: {settlement_amount} USD (savings: {total_savings} USD)"
            )

            return loan_request

    def create_deferral_request(self, user, loan: Loan, data: Dict) -> LoanRequest:
        """
        Create a payment deferral request
        """
        with transaction.atomic():
            if loan.status != 'active':
                raise ValueError("Only active loans can have payment deferrals")

            requested_months = int(data['requested_months'])
            if requested_months < 1 or requested_months > 12:
                raise ValueError("Deferral period must be between 1 and 12 months")

            # Calculate deferral impact
            next_payment_due = loan.next_payment_date
            new_payment_start_date = next_payment_due + timedelta(days=30 * requested_months)
            new_final_payment_date = loan.final_payment_date + timedelta(days=30 * requested_months)
            
            # Calculate deferral fee (2% of deferred amount per month)
            deferred_amount = loan.monthly_payment_usd * requested_months
            deferral_fee = deferred_amount * Decimal('0.02')

            # Create main request
            loan_request = LoanRequest.objects.create(
                user=user,
                loan=loan,
                request_type='deferral',
                title=f"Payment Deferral Request - {requested_months} months",
                description=data.get('description', ''),
                reason=data.get('reason', ''),
                new_final_payment_date=new_final_payment_date,
                fee_amount_usd=deferral_fee,
                request_data={
                    'requested_months': requested_months,
                    'deferred_amount': str(deferred_amount),
                    'deferral_fee': str(deferral_fee),
                    'new_payment_start_date': new_payment_start_date.isoformat(),
                    'new_final_payment_date': new_final_payment_date.isoformat()
                }
            )

            # Create specific deferral request details
            DeferralRequest.objects.create(
                loan_request=loan_request,
                deferral_reason=data.get('deferral_reason', 'financial_hardship'),
                requested_months=requested_months,
                next_payment_due=next_payment_due,
                monthly_payment_amount=loan.monthly_payment_usd,
                new_payment_start_date=new_payment_start_date,
                new_final_payment_date=new_final_payment_date,
                deferral_fee_usd=deferral_fee,
                expected_income_recovery_date=data.get('expected_recovery_date'),
                proposed_catch_up_plan=data.get('catch_up_plan', '')
            )

            # Initialize approval workflow
            self._initialize_approval_workflow(loan_request, 'deferral')
            
            # Add initial comment
            self._add_system_comment(
                loan_request,
                f"Deferral request created for {requested_months} months. Fee: {deferral_fee} USD"
            )

            return loan_request

    def approve_request(self, request: LoanRequest, approved_by, approval_notes: str = '') -> bool:
        """
        Approve a loan request and execute the changes
        """
        with transaction.atomic():
            if request.status != 'under_review':
                raise ValueError("Only requests under review can be approved")

            try:
                # Execute the request based on type
                if request.request_type == 'increase':
                    self._execute_increase_request(request)
                elif request.request_type == 'settlement':
                    self._execute_settlement_request(request)
                elif request.request_type == 'deferral':
                    self._execute_deferral_request(request)

                # Update request status
                request.status = 'approved'
                request.approved_by = approved_by
                request.approved_at = timezone.now()
                request.customer_notes = approval_notes
                request.save()

                # Add status history
                self._add_status_history(request, 'under_review', 'approved', approved_by)
                
                # Add approval comment
                RequestComment.objects.create(
                    loan_request=request,
                    author=approved_by,
                    comment_type='approval',
                    content=f"Request approved. {approval_notes}",
                    is_internal=False
                )

                # Mark all workflow steps as completed
                request.approval_steps.update(
                    status='completed',
                    completed_by=approved_by,
                    completed_at=timezone.now(),
                    decision='approved'
                )

                return True

            except Exception as e:
                # If execution fails, mark as rejected
                self.reject_request(request, approved_by, f"Execution failed: {str(e)}")
                return False

    def reject_request(self, request: LoanRequest, rejected_by, rejection_reason: str):
        """
        Reject a loan request
        """
        old_status = request.status
        request.status = 'rejected'
        request.rejection_reason = rejection_reason
        request.save()

        # Add status history
        self._add_status_history(request, old_status, 'rejected', rejected_by)
        
        # Add rejection comment
        RequestComment.objects.create(
            loan_request=request,
            author=rejected_by,
            comment_type='rejection',
            content=f"Request rejected. Reason: {rejection_reason}",
            is_internal=False
        )

    def _execute_increase_request(self, request: LoanRequest):
        """
        Execute an approved loan increase request
        """
        increase_details = request.increase_details
        loan = request.loan

        # Update loan principal amount
        loan.principal_amount_usd += increase_details.increase_amount_usd
        
        # Recalculate monthly payment if duration is changed
        if increase_details.new_duration_months:
            loan.duration_months = increase_details.new_duration_months
            loan.monthly_payment_usd = increase_details.new_monthly_payment_usd
        
        # Update final payment date if needed
        if request.new_final_payment_date:
            loan.final_payment_date = request.new_final_payment_date

        loan.save()

        # Create a payment record for the processing fee
        if request.fee_amount_usd > 0:
            Payment.objects.create(
                loan=loan,
                user=loan.user,
                payment_type='fee',
                amount_usd=request.fee_amount_usd,
                description=f"Processing fee for loan increase request {request.request_number}",
                status='pending'
            )

    def _execute_settlement_request(self, request: LoanRequest):
        """
        Execute an approved settlement request
        """
        settlement_details = request.settlement_details
        loan = request.loan

        if settlement_details.settlement_type == 'full':
            # Create settlement payment
            Payment.objects.create(
                loan=loan,
                user=loan.user,
                payment_type='settlement',
                amount_usd=settlement_details.settlement_amount_usd,
                description=f"Early settlement payment for loan {loan.loan_number}",
                status='pending'
            )
            
            # Update loan status (will be marked as settled when payment is completed)
            loan.status = 'pending_settlement'
            loan.save()

    def _execute_deferral_request(self, request: LoanRequest):
        """
        Execute an approved deferral request
        """
        deferral_details = request.deferral_details
        loan = request.loan

        # Update loan payment schedule
        loan.final_payment_date = deferral_details.new_final_payment_date
        loan.save()

        # Create fee payment if applicable
        if request.fee_amount_usd > 0:
            Payment.objects.create(
                loan=loan,
                user=loan.user,
                payment_type='fee',
                amount_usd=request.fee_amount_usd,
                description=f"Deferral fee for {deferral_details.requested_months} months",
                status='pending'
            )

        # Update any pending payments to reflect new schedule
        pending_payments = loan.payments.filter(status='pending', due_date__gte=timezone.now().date())
        for payment in pending_payments:
            # Defer each payment by the requested months
            payment.due_date += timedelta(days=30 * deferral_details.requested_months)
            payment.save()

    def _initialize_approval_workflow(self, request: LoanRequest, request_type: str):
        """
        Initialize approval workflow steps based on request type
        """
        if request_type == 'increase':
            steps = [
                ('initial_review', 1),
                ('financial_analysis', 2),
                ('risk_assessment', 3),
                ('management_approval', 4),
            ]
        elif request_type == 'settlement':
            steps = [
                ('initial_review', 1),
                ('final_approval', 2),
            ]
        elif request_type == 'deferral':
            steps = [
                ('initial_review', 1),
                ('risk_assessment', 2),
                ('management_approval', 3),
            ]
        else:
            steps = [('initial_review', 1)]

        for step_name, order in steps:
            RequestApprovalWorkflow.objects.create(
                loan_request=request,
                step_name=step_name,
                step_order=order,
                status='pending'
            )

    def _add_status_history(self, request: LoanRequest, old_status: str, new_status: str, changed_by):
        """
        Add status change to history
        """
        RequestStatusHistory.objects.create(
            loan_request=request,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by
        )

    def _add_system_comment(self, request: LoanRequest, content: str):
        """
        Add system-generated comment
        """
        RequestComment.objects.create(
            loan_request=request,
            comment_type='system',
            content=content,
            is_internal=False
        )

    def get_user_requests(self, user) -> List[LoanRequest]:
        """
        Get all requests for a user
        """
        return LoanRequest.objects.filter(user=user).order_by('-requested_at')

    def get_request_statistics(self, user) -> Dict:
        """
        Get request statistics for a user
        """
        requests = self.get_user_requests(user)
        
        return {
            'total_requests': requests.count(),
            'pending_requests': requests.filter(status__in=['pending', 'under_review']).count(),
            'approved_requests': requests.filter(status='approved').count(),
            'rejected_requests': requests.filter(status='rejected').count(),
            'completed_requests': requests.filter(status='completed').count(),
            'request_types': {
                request_type: requests.filter(request_type=request_type).count()
                for request_type, _ in LoanRequest.REQUEST_TYPES
            }
        }

    def can_user_create_request(self, user, loan: Loan, request_type: str) -> tuple[bool, str]:
        """
        Check if user can create a specific type of request for a loan
        """
        # Check loan status
        if loan.status != 'active':
            return False, "Loan must be active to create requests"

        # Check for existing pending requests of same type
        existing_request = loan.modification_requests.filter(
            request_type=request_type,
            status__in=['pending', 'under_review', 'approved']
        ).first()
        
        if existing_request:
            return False, f"There is already a pending {request_type} request for this loan"

        # Type-specific validations
        if request_type == 'increase':
            # Check if loan is recent enough (at least 3 payments made)
            payments_made = loan.payments.filter(status='completed').count()
            if payments_made < 3:
                return False, "At least 3 payments must be completed before requesting an increase"

        elif request_type == 'settlement':
            # Check minimum loan age (at least 1 payment made)
            payments_made = loan.payments.filter(status='completed').count()
            if payments_made < 1:
                return False, "At least 1 payment must be completed before early settlement"

        elif request_type == 'deferral':
            # Check for recent deferrals (max 2 per year)
            recent_deferrals = loan.modification_requests.filter(
                request_type='deferral',
                status__in=['approved', 'completed'],
                requested_at__gte=timezone.now() - timedelta(days=365)
            ).count()
            
            if recent_deferrals >= 2:
                return False, "Maximum 2 deferrals allowed per year"

        return True, "Request can be created"