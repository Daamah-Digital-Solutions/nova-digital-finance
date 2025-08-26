from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import stripe
from django.conf import settings
from decimal import Decimal
from datetime import datetime

from .models import PaymentMethod, PaymentIntent, PaymentTransaction, RefundRequest
from .serializers import (
    PaymentMethodSerializer, CreatePaymentMethodSerializer,
    PaymentIntentSerializer, CreatePaymentIntentSerializer,
    PaymentTransactionSerializer, ConfirmPaymentSerializer,
    RefundRequestSerializer
)
from loans.models import LoanApplication, Loan

# Initialize Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_dummy_key')

class PaymentMethodListView(generics.ListAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)

class PaymentMethodCreateView(generics.CreateAPIView):
    serializer_class = CreatePaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentMethodDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        payment_method = self.get_object()
        
        try:
            # Detach from Stripe customer
            stripe.PaymentMethod.detach(payment_method.stripe_payment_method_id)
        except stripe.error.StripeError:
            pass  # Continue even if Stripe detach fails
        
        # Mark as inactive instead of deleting
        payment_method.is_active = False
        payment_method.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class PaymentIntentListView(generics.ListAPIView):
    serializer_class = PaymentIntentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentIntent.objects.filter(user=self.request.user).order_by('-created_at')

class PaymentIntentCreateView(generics.CreateAPIView):
    serializer_class = CreatePaymentIntentSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentTransactionListView(generics.ListAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentTransaction.objects.filter(user=self.request.user).order_by('-created_at')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_loan_fee_payment(request, application_id):
    """
    Create payment intent for loan processing fee
    """
    try:
        application = get_object_or_404(
            LoanApplication, 
            id=application_id, 
            user=request.user, 
            status='approved'
        )
    except:
        return Response({
            'error': 'Loan application not found or not approved'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check if payment already exists
    existing_payment = PaymentIntent.objects.filter(
        loan_application=application,
        purpose='loan_fee',
        status__in=['pending', 'processing', 'succeeded']
    ).first()
    
    if existing_payment:
        return Response({
            'payment_intent': PaymentIntentSerializer(existing_payment).data,
            'client_secret': existing_payment.client_secret
        })

    try:
        # Use our service to create payment intent
        from .services import StripePaymentService
        service = StripePaymentService()
        
        payment_intent = service.create_loan_fee_payment(application)
        
        return Response({
            'payment_intent': PaymentIntentSerializer(payment_intent).data,
            'client_secret': payment_intent.client_secret,
            'publishable_key': getattr(settings, 'STRIPE_PUBLISHABLE_KEY', 'pk_test_placeholder_key'),
            'test_mode': not getattr(settings, 'STRIPE_ENABLED', False)
        })
        
    except Exception as e:
        return Response({
            'error': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_installment_payment(request, loan_id):
    """
    Create payment intent for loan installment
    """
    try:
        loan = get_object_or_404(
            Loan,
            id=loan_id,
            user=request.user,
            status='active'
        )
    except:
        return Response({
            'error': 'Loan not found or not active'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        customer_id = get_or_create_stripe_customer(request.user)
        
        # Use monthly payment amount
        payment_amount = loan.monthly_payment_usd
        stripe_processing_fee = (payment_amount * Decimal('0.029')) + Decimal('0.30')
        total_amount = payment_amount + stripe_processing_fee
        
        # Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(total_amount * 100),
            currency='usd',
            customer=customer_id,
            metadata={
                'user_id': str(request.user.id),
                'loan_id': str(loan.id),
                'purpose': 'installment',
                'installment_number': str(loan.payments_made + 1)
            },
            description=f"Nova Finance - Installment Payment (Loan: {loan.loan_number})"
        )
        
        # Create local PaymentIntent record
        payment_intent = PaymentIntent.objects.create(
            user=request.user,
            loan=loan,
            stripe_payment_intent_id=intent.id,
            amount_usd=payment_amount,
            fee_amount=stripe_processing_fee,
            purpose='installment',
            client_secret=intent.client_secret,
            stripe_response=intent
        )
        
        return Response({
            'payment_intent': PaymentIntentSerializer(payment_intent).data,
            'client_secret': intent.client_secret,
            'publishable_key': getattr(settings, 'STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy_key')
        })
        
    except stripe.error.StripeError as e:
        return Response({
            'error': f'Payment setup failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_payment(request):
    """
    Confirm payment and handle post-payment actions
    """
    serializer = ConfirmPaymentSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    try:
        result = serializer.confirm_payment()
        payment_intent = result['payment_intent']
        
        # Handle successful payment
        if result['status'] == 'succeeded':
            if payment_intent.purpose == 'loan_fee':
                # Create loan from approved application
                handle_loan_fee_payment_success(payment_intent)
            elif payment_intent.purpose == 'installment':
                # Update loan payment status
                handle_installment_payment_success(payment_intent)
        
        return Response({
            'status': result['status'],
            'requires_action': result.get('requires_action', False),
            'client_secret': result.get('client_secret'),
            'message': 'Payment processed successfully' if result['status'] == 'succeeded' else 'Payment requires additional action'
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_dashboard_stats(request):
    """
    Get payment statistics for dashboard
    """
    user = request.user
    
    # Get payment statistics
    payment_intents = PaymentIntent.objects.filter(user=user)
    transactions = PaymentTransaction.objects.filter(user=user)
    
    stats = {
        'total_payments': payment_intents.count(),
        'successful_payments': payment_intents.filter(status='succeeded').count(),
        'failed_payments': payment_intents.filter(status='failed').count(),
        'pending_payments': payment_intents.filter(status='pending').count(),
        
        'total_paid': sum(t.amount_received for t in transactions.filter(status='completed')),
        'total_fees_paid': sum(t.processing_fee for t in transactions.filter(status='completed')),
        
        'payment_methods_count': user.payment_methods.filter(is_active=True).count(),
        'recent_payments': PaymentTransactionSerializer(
            transactions.filter(status='completed')[:5], many=True
        ).data
    }
    
    return Response(stats)

def get_or_create_stripe_customer(user):
    """
    Helper function to get or create Stripe customer
    """
    try:
        # For demo purposes, create a new customer each time
        # In production, store and retrieve customer ID from user model
        customer = stripe.Customer.create(
            email=user.email,
            name=user.username,
            metadata={
                'user_id': str(user.id),
                'client_number': user.client_number
            }
        )
        return customer.id
    except stripe.error.StripeError as e:
        raise Exception(f"Failed to create Stripe customer: {str(e)}")

def handle_loan_fee_payment_success(payment_intent):
    """
    Handle successful loan fee payment - create the loan
    """
    application = payment_intent.loan_application
    
    # Create loan from application
    loan = Loan.objects.create(
        application=application,
        user=application.user,
        currency=application.currency,
        principal_amount_currency=application.loan_amount_currency,
        principal_amount_usd=application.loan_amount_usd,
        fee_amount_usd=application.fee_amount_usd,
        monthly_payment_usd=application.monthly_payment_usd,
        total_amount_usd=application.total_payment_usd,
        duration_months=application.duration_months,
        remaining_amount_usd=application.loan_amount_usd  # Principal only, fee already paid
    )
    
    # Create payment record in loan system
    from loans.models import Payment
    Payment.objects.create(
        loan=loan,
        user=application.user,
        payment_type='fee',
        amount_usd=payment_intent.amount_usd,
        payment_method='credit_card',
        transaction_id=payment_intent.stripe_payment_intent_id,
        installment_number=0,
        status='completed',
        paid_date=datetime.now()
    )

def handle_installment_payment_success(payment_intent):
    """
    Handle successful installment payment - update loan
    """
    loan = payment_intent.loan
    
    # Update loan payment tracking
    loan.paid_amount_usd += payment_intent.amount_usd
    loan.remaining_amount_usd -= payment_intent.amount_usd
    loan.payments_made += 1
    
    # Check if loan is fully paid
    if loan.remaining_amount_usd <= 0:
        loan.status = 'completed'
    
    loan.save()
    
    # Create payment record
    from loans.models import Payment
    Payment.objects.create(
        loan=loan,
        user=loan.user,
        payment_type='installment',
        amount_usd=payment_intent.amount_usd,
        payment_method='credit_card',
        transaction_id=payment_intent.stripe_payment_intent_id,
        installment_number=loan.payments_made,
        status='completed',
        paid_date=datetime.now()
    )


# Enhanced Nova Finance Payment Views

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_payments_view(request):
    """
    Get upcoming payments for user using enhanced payment service
    """
    try:
        from .services import PaymentScheduleService
        
        schedule_service = PaymentScheduleService()
        upcoming_payments = schedule_service.get_upcoming_payments(
            user=request.user,
            days_ahead=int(request.GET.get('days_ahead', 30))
        )
        
        return Response({
            'upcoming_payments': upcoming_payments,
            'total_count': len(upcoming_payments)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to get upcoming payments: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_payment_reminders(request):
    """
    Admin endpoint to send payment reminders
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .services import PaymentScheduleService
        
        schedule_service = PaymentScheduleService()
        results = schedule_service.send_payment_reminders()
        
        return Response({
            'success': True,
            'message': 'Payment reminders sent successfully',
            'results': results
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to send payment reminders: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    """
    import json
    import hmac
    import hashlib
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    
    # Verify webhook signature
    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=400)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=400)
    else:
        # For development - parse without verification
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=400)
    
    # Process webhook event
    try:
        from .services import StripePaymentService
        
        payment_service = StripePaymentService()
        success = payment_service.process_payment_webhook(
            event_type=event['type'],
            event_data=event['data']['object']
        )
        
        if success:
            return Response({'status': 'success'})
        else:
            return Response({'status': 'error'}, status=400)
            
    except Exception as e:
        print(f"Webhook processing error: {e}")
        return Response({'error': str(e)}, status=500)
