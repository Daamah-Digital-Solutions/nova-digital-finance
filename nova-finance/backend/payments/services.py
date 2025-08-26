import stripe
import json
from decimal import Decimal
from typing import Dict, Tuple, Optional
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import PaymentMethod, PaymentIntent, PaymentTransaction, RefundRequest
from loans.models import LoanApplication, Loan

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_...')

class StripePaymentService:
    """
    Enhanced Stripe payment service for Nova Finance
    """
    
    def __init__(self):
        self.stripe = stripe
    
    def create_customer(self, user) -> str:
        """
        Create or retrieve Stripe customer for user
        """
        # Check if Stripe is enabled for testing
        if not getattr(settings, 'STRIPE_ENABLED', False):
            # Return a mock customer ID for testing
            return f"cus_test_{user.id}"
        
        try:
            # Check if user already has a Stripe customer ID
            if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
                return user.stripe_customer_id
            
            customer = self.stripe.Customer.create(
                email=user.email,
                name=user.get_full_name() or user.email,
                metadata={
                    'user_id': str(user.id),
                    'nova_finance_user': True
                }
            )
            
            # Save customer ID to user profile (assuming the field exists)
            # user.stripe_customer_id = customer.id
            # user.save()
            
            return customer.id
        except stripe.error.StripeError as e:
            # For testing, return mock customer ID if Stripe fails
            if settings.DEBUG:
                return f"cus_test_{user.id}"
            raise Exception(f"Failed to create Stripe customer: {str(e)}")
    
    def add_payment_method(self, user, payment_method_id: str, set_default: bool = False) -> PaymentMethod:
        """
        Add payment method to user account
        """
        try:
            customer_id = self.create_customer(user)
            
            # Attach payment method to customer
            self.stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            # Retrieve payment method details
            pm = self.stripe.PaymentMethod.retrieve(payment_method_id)
            
            # Create local payment method record
            payment_method = PaymentMethod.objects.create(
                user=user,
                payment_type='credit_card' if pm.type == 'card' else pm.type,
                card_last_four=pm.card.last4 if pm.card else '',
                card_brand=pm.card.brand if pm.card else '',
                card_exp_month=pm.card.exp_month if pm.card else None,
                card_exp_year=pm.card.exp_year if pm.card else None,
                stripe_payment_method_id=payment_method_id,
                is_default=set_default
            )
            
            # Set as default payment method for customer if requested
            if set_default:
                self.stripe.Customer.modify(
                    customer_id,
                    invoice_settings={'default_payment_method': payment_method_id}
                )
            
            return payment_method
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to add payment method: {str(e)}")
    
    def create_loan_fee_payment(self, loan_application: LoanApplication) -> PaymentIntent:
        """
        Create payment intent for loan processing fee
        """
        customer_id = self.create_customer(loan_application.user)
        
        # Calculate total payment amount (loan amount + processing fee)
        total_amount = loan_application.total_payment_usd
        fee_amount = loan_application.fee_amount_usd
        
        # Check if Stripe is enabled
        if not getattr(settings, 'STRIPE_ENABLED', False):
            # Create mock payment intent for testing
            payment_intent = PaymentIntent.objects.create(
                user=loan_application.user,
                loan_application=loan_application,
                stripe_payment_intent_id=f"pi_test_{loan_application.id}",
                amount_usd=total_amount,
                fee_amount=Decimal('0.00'),
                purpose='loan_fee',
                client_secret=f"pi_test_{loan_application.id}_secret_test",
                status='succeeded',  # Mark as succeeded for testing
                metadata={
                    'loan_application_id': str(loan_application.id),
                    'fee_percentage': str(loan_application.fee_percentage),
                    'test_mode': True
                },
                stripe_response={'test_mode': True}
            )
            return payment_intent
        
        try:
            # Create Stripe payment intent
            intent = self.stripe.PaymentIntent.create(
                amount=int(total_amount * 100),  # Convert to cents
                currency='usd',
                customer=customer_id,
                description=f'Nova Finance Loan Payment (Loan + Processing Fee) - Application {loan_application.id}',
                metadata={
                    'loan_application_id': str(loan_application.id),
                    'user_id': str(loan_application.user.id),
                    'fee_type': 'processing_fee',
                    'loan_amount_usd': str(loan_application.loan_amount_usd),
                    'fee_amount_usd': str(fee_amount),
                    'total_amount_usd': str(total_amount),
                    'nova_finance_payment': True
                },
                automatic_payment_methods={'enabled': True}
            )
            
            # Create local payment intent record
            payment_intent = PaymentIntent.objects.create(
                user=loan_application.user,
                loan_application=loan_application,
                stripe_payment_intent_id=intent.id,
                amount_usd=total_amount,
                fee_amount=Decimal('0.00'),  # No additional fees for processing fee
                purpose='loan_fee',
                client_secret=intent.client_secret,
                metadata={
                    'loan_application_id': str(loan_application.id),
                    'fee_percentage': str(loan_application.fee_percentage)
                },
                stripe_response=intent
            )
            
            return payment_intent
        except stripe.error.StripeError as e:
            # For testing, create mock payment intent if Stripe fails
            if settings.DEBUG:
                payment_intent = PaymentIntent.objects.create(
                    user=loan_application.user,
                    loan_application=loan_application,
                    stripe_payment_intent_id=f"pi_test_{loan_application.id}",
                    amount_usd=total_amount,
                    fee_amount=Decimal('0.00'),
                    purpose='loan_fee',
                    client_secret=f"pi_test_{loan_application.id}_secret_test",
                    status='succeeded',  # Mark as succeeded for testing
                    metadata={
                        'loan_application_id': str(loan_application.id),
                        'fee_percentage': str(loan_application.fee_percentage),
                        'test_mode': True,
                        'error': str(e)
                    },
                    stripe_response={'test_mode': True, 'error': str(e)}
                )
                return payment_intent
            raise Exception(f"Failed to create loan fee payment: {str(e)}")
    
    def create_loan_installment_payment(self, loan: Loan, installment_amount: Decimal) -> PaymentIntent:
        """
        Create payment intent for loan installment
        """
        try:
            customer_id = self.create_customer(loan.user)
            
            # Create Stripe payment intent
            intent = self.stripe.PaymentIntent.create(
                amount=int(installment_amount * 100),  # Convert to cents
                currency='usd',
                customer=customer_id,
                description=f'Nova Finance Loan Installment - Loan {loan.loan_number}',
                metadata={
                    'loan_id': str(loan.id),
                    'loan_number': loan.loan_number,
                    'user_id': str(loan.user.id),
                    'payment_type': 'installment',
                    'remaining_balance': str(loan.remaining_amount_usd),
                    'nova_finance_payment': True
                },
                automatic_payment_methods={'enabled': True}
            )
            
            # Create local payment intent record
            payment_intent = PaymentIntent.objects.create(
                user=loan.user,
                loan=loan,
                stripe_payment_intent_id=intent.id,
                amount_usd=installment_amount,
                purpose='installment',
                client_secret=intent.client_secret,
                metadata={
                    'loan_id': str(loan.id),
                    'installment_number': loan.payments_made + 1
                },
                stripe_response=intent
            )
            
            return payment_intent
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create installment payment: {str(e)}")
    
    def process_payment_webhook(self, event_type: str, event_data: dict) -> bool:
        """
        Process Stripe webhook events
        """
        try:
            if event_type == 'payment_intent.succeeded':
                return self._handle_payment_success(event_data)
            elif event_type == 'payment_intent.payment_failed':
                return self._handle_payment_failure(event_data)
            elif event_type == 'payment_method.attached':
                return self._handle_payment_method_attached(event_data)
            
            return True
        except Exception as e:
            print(f"Webhook processing error: {e}")
            return False
    
    def _handle_payment_success(self, event_data: dict) -> bool:
        """
        Handle successful payment
        """
        stripe_payment_intent_id = event_data['id']
        
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=stripe_payment_intent_id
            )
            
            # Update payment intent status
            payment_intent.status = 'succeeded'
            payment_intent.processed_at = timezone.now()
            payment_intent.stripe_response = event_data
            payment_intent.save()
            
            # Create transaction record
            charge_data = event_data.get('charges', {}).get('data', [{}])[0]
            
            transaction = PaymentTransaction.objects.create(
                payment_intent=payment_intent,
                user=payment_intent.user,
                stripe_charge_id=charge_data.get('id', ''),
                amount_charged=Decimal(str(event_data['amount'] / 100)),
                amount_received=Decimal(str(event_data['amount_received'] / 100)),
                processing_fee=Decimal(str(charge_data.get('application_fee_amount', 0) / 100)),
                status='completed',
                receipt_url=charge_data.get('receipt_url', '')
            )
            
            # Process business logic based on payment purpose
            if payment_intent.purpose == 'loan_fee':
                self._process_loan_fee_payment(payment_intent, transaction)
            elif payment_intent.purpose == 'installment':
                self._process_installment_payment(payment_intent, transaction)
            
            return True
        except PaymentIntent.DoesNotExist:
            print(f"Payment intent not found: {stripe_payment_intent_id}")
            return False
        except Exception as e:
            print(f"Error processing payment success: {e}")
            return False
    
    def _process_loan_fee_payment(self, payment_intent: PaymentIntent, transaction: PaymentTransaction):
        """
        Process loan fee payment and trigger PRN issuance
        """
        loan_application = payment_intent.loan_application
        
        # Update loan application - fee paid
        loan_application.status = 'approved'  # Move to approved after fee payment
        loan_application.processed_at = timezone.now()
        loan_application.save()
        
        # Trigger PRN issuance and certificate generation
        from pronova.services import PRNManagementService
        
        service = PRNManagementService()
        certificate = service.process_approved_loan(loan_application)
        
        if certificate:
            # Send confirmation email
            self._send_payment_confirmation_email(
                payment_intent.user,
                'Loan Fee Payment Successful',
                'Your loan processing fee has been paid successfully. Your PRN tokens and certificate have been generated.',
                {
                    'loan_application': loan_application,
                    'certificate': certificate,
                    'transaction': transaction
                }
            )
    
    def _process_installment_payment(self, payment_intent: PaymentIntent, transaction: PaymentTransaction):
        """
        Process loan installment payment
        """
        loan = payment_intent.loan
        
        # Update loan payment tracking
        loan.paid_amount_usd += transaction.amount_received
        loan.remaining_amount_usd = loan.total_amount_usd - loan.paid_amount_usd
        loan.payments_made += 1
        
        # Check if loan is fully paid
        if loan.remaining_amount_usd <= Decimal('0.01'):  # Account for small rounding
            loan.status = 'completed'
            loan.remaining_amount_usd = Decimal('0.00')
            
            # Release PRN pledge
            from pronova.services import PRNManagementService
            service = PRNManagementService()
            service.release_pledge(loan.loan_application)
            
            # Send loan completion email
            self._send_payment_confirmation_email(
                loan.user,
                'Loan Fully Repaid',
                'Congratulations! Your loan has been fully repaid. Your PRN tokens are now released.',
                {
                    'loan': loan,
                    'transaction': transaction,
                    'final_payment': True
                }
            )
        else:
            # Update next payment date
            from datetime import timedelta
            loan.next_payment_date = loan.next_payment_date + timedelta(days=30)
            
            # Send regular installment confirmation
            self._send_payment_confirmation_email(
                loan.user,
                'Loan Payment Received',
                f'Your loan installment payment of ${transaction.amount_received} has been processed.',
                {
                    'loan': loan,
                    'transaction': transaction,
                    'remaining_payments': (loan.duration_months - loan.payments_made)
                }
            )
        
        loan.save()
    
    def _handle_payment_failure(self, event_data: dict) -> bool:
        """
        Handle failed payment
        """
        stripe_payment_intent_id = event_data['id']
        
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=stripe_payment_intent_id
            )
            
            payment_intent.status = 'failed'
            payment_intent.stripe_response = event_data
            payment_intent.save()
            
            # Send failure notification email
            self._send_payment_failure_email(payment_intent, event_data)
            
            return True
        except PaymentIntent.DoesNotExist:
            return False
    
    def _handle_payment_method_attached(self, event_data: dict) -> bool:
        """
        Handle payment method attachment
        """
        # This is handled in add_payment_method, but we can log it here
        return True
    
    def _send_payment_confirmation_email(self, user, subject: str, message: str, context: dict):
        """
        Send payment confirmation email
        """
        try:
            # TODO: Replace with proper email template in Phase 5
            send_mail(
                subject=f'Nova Finance - {subject}',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@novafinance.com'),
                recipient_list=[user.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send confirmation email: {e}")
    
    def _send_payment_failure_email(self, payment_intent: PaymentIntent, event_data: dict):
        """
        Send payment failure notification
        """
        try:
            failure_reason = event_data.get('last_payment_error', {}).get('message', 'Unknown error')
            
            send_mail(
                subject='Nova Finance - Payment Failed',
                message=f'Your payment of ${payment_intent.amount_usd} failed. Reason: {failure_reason}',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@novafinance.com'),
                recipient_list=[payment_intent.user.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send failure email: {e}")
    
    def create_refund(self, transaction: PaymentTransaction, amount: Decimal, reason: str) -> Tuple[bool, dict]:
        """
        Create refund for transaction
        """
        try:
            refund = self.stripe.Refund.create(
                charge=transaction.stripe_charge_id,
                amount=int(amount * 100),  # Convert to cents
                reason='requested_by_customer',
                metadata={
                    'transaction_id': str(transaction.id),
                    'refund_reason': reason,
                    'nova_finance_refund': True
                }
            )
            
            # Create refund request record
            refund_request = RefundRequest.objects.create(
                transaction=transaction,
                user=transaction.user,
                reason=reason,
                amount_requested=amount,
                amount_approved=amount,
                status='processed',
                stripe_refund_id=refund.id,
                processed_at=timezone.now()
            )
            
            return True, {'refund_id': refund.id, 'refund_request': refund_request}
        except stripe.error.StripeError as e:
            return False, {'error': str(e)}

class PaymentScheduleService:
    """
    Service for managing payment schedules and reminders
    """
    
    def __init__(self):
        self.payment_service = StripePaymentService()
    
    def get_upcoming_payments(self, user, days_ahead: int = 30) -> list:
        """
        Get upcoming payments for user
        """
        from datetime import timedelta
        from loans.models import Loan
        
        cutoff_date = timezone.now().date() + timedelta(days=days_ahead)
        
        upcoming_loans = Loan.objects.filter(
            user=user,
            status='active',
            next_payment_date__lte=cutoff_date
        )
        
        upcoming_payments = []
        for loan in upcoming_loans:
            days_until = (loan.next_payment_date - timezone.now().date()).days
            
            upcoming_payments.append({
                'loan_id': str(loan.id),
                'loan_number': loan.loan_number,
                'amount_usd': float(loan.monthly_payment_usd),
                'due_date': loan.next_payment_date.isoformat(),
                'days_until_due': days_until,
                'is_overdue': days_until < 0,
                'remaining_balance': float(loan.remaining_amount_usd),
                'payments_remaining': loan.duration_months - loan.payments_made
            })
        
        return sorted(upcoming_payments, key=lambda x: x['days_until_due'])
    
    def send_payment_reminders(self) -> dict:
        """
        Send payment reminders for upcoming due dates
        """
        from datetime import timedelta
        from loans.models import Loan
        
        results = {
            'reminders_sent': 0,
            'overdue_notices': 0,
            'errors': 0
        }
        
        # Get loans due in 3 days
        reminder_date = timezone.now().date() + timedelta(days=3)
        due_soon = Loan.objects.filter(
            status='active',
            next_payment_date=reminder_date
        )
        
        for loan in due_soon:
            try:
                self._send_payment_reminder(loan, 'upcoming')
                results['reminders_sent'] += 1
            except Exception as e:
                results['errors'] += 1
                print(f"Failed to send reminder for loan {loan.id}: {e}")
        
        # Get overdue loans
        overdue_loans = Loan.objects.filter(
            status='active',
            next_payment_date__lt=timezone.now().date()
        )
        
        for loan in overdue_loans:
            try:
                days_overdue = (timezone.now().date() - loan.next_payment_date).days
                self._send_payment_reminder(loan, 'overdue', days_overdue)
                results['overdue_notices'] += 1
            except Exception as e:
                results['errors'] += 1
                print(f"Failed to send overdue notice for loan {loan.id}: {e}")
        
        return results
    
    def _send_payment_reminder(self, loan, reminder_type: str, days_overdue: int = 0):
        """
        Send payment reminder email
        """
        if reminder_type == 'upcoming':
            subject = 'Payment Reminder - Due in 3 Days'
            message = f'Your loan payment of ${loan.monthly_payment_usd} is due on {loan.next_payment_date}.'
        else:  # overdue
            subject = 'Overdue Payment Notice'
            message = f'Your loan payment of ${loan.monthly_payment_usd} is {days_overdue} days overdue.'
        
        send_mail(
            subject=f'Nova Finance - {subject}',
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@novafinance.com'),
            recipient_list=[loan.user.email],
            fail_silently=True
        )