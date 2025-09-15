from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
import random
from datetime import datetime, timedelta

from .models import LoanApplication, Loan, Payment, LoanRequest
from .serializers import (
    LoanApplicationSerializer, LoanSerializer, PaymentSerializer,
    LoanRequestSerializer, LoanCalculatorSerializer
)
from currencies.models import Currency

class LoanApplicationCreateView(generics.CreateAPIView):
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Check if user has submitted KYC (approved or under review)
        if request.user.kyc_status in ['pending', 'rejected']:
            return Response({
                'error': 'KYC verification required to apply for loans'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()

        # Auto-approval logic (simplified for demo)
        approval_result = self.process_automatic_approval(application)
        
        if approval_result['approved']:
            application.status = 'approved'
            application.approval_notes = approval_result['notes']
            application.processed_at = datetime.now()
            application.save()
            
            # Process PRN issuance and certificate generation
            self.process_prn_and_certificate(application)
            
            # Send approval email
            self.send_approval_email(application)
            
            return Response({
                'application': LoanApplicationSerializer(application).data,
                'approved': True,
                'message': 'Your loan application has been approved! Please proceed to payment.'
            }, status=status.HTTP_201_CREATED)
        else:
            application.status = 'rejected'
            application.rejection_reason = approval_result['reason']
            application.processed_at = datetime.now()
            application.save()
            
            return Response({
                'application': LoanApplicationSerializer(application).data,
                'approved': False,
                'message': 'Your loan application has been rejected.',
                'reason': approval_result['reason']
            }, status=status.HTTP_201_CREATED)

    def process_automatic_approval(self, application):
        """
        Simplified automatic approval logic
        In production, this would integrate with credit scoring systems
        """
        user = application.user
        
        # Basic approval criteria
        criteria_passed = 0
        total_criteria = 5
        
        # 1. KYC verified
        if user.is_kyc_verified:
            criteria_passed += 1
            
        # 2. Reasonable loan amount (under 50k USD)
        if application.loan_amount_usd <= 50000:
            criteria_passed += 1
            
        # 3. Reasonable duration (12-36 months)
        if 12 <= application.duration_months <= 36:
            criteria_passed += 1
            
        # 4. No active defaulted loans
        active_defaulted = user.loans.filter(status='defaulted').count()
        if active_defaulted == 0:
            criteria_passed += 1
            
        # 5. Random factor (90% approval rate for demo)
        if random.random() < 0.9:
            criteria_passed += 1
        
        approval_score = (criteria_passed / total_criteria) * 100
        
        if approval_score >= 80:
            return {
                'approved': True,
                'score': approval_score,
                'notes': f'Automatic approval - Score: {approval_score}%'
            }
        else:
            return {
                'approved': False,
                'score': approval_score,
                'reason': f'Approval criteria not met - Score: {approval_score}%'
            }

    def send_approval_email(self, application):
        try:
            send_mail(
                subject='Loan Application Approved - Nova Finance',
                message=f'Congratulations! Your loan application for {application.loan_amount_usd} USD has been approved.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[application.user.email],
                fail_silently=True,
            )
        except Exception:
            pass
    
    def process_prn_and_certificate(self, application):
        """
        Process PRN issuance and certificate generation for approved loans
        """
        try:
            from pronova.services import PRNManagementService
            
            service = PRNManagementService()
            certificate = service.process_approved_loan(application)
            
            if certificate:
                print(f"PRN issued and certificate generated for loan {application.id}")
                print(f"Certificate: {certificate.certificate_number}")
                return certificate
            else:
                print(f"Failed to process PRN for loan {application.id}")
                return None
                
        except Exception as e:
            print(f"Error processing PRN and certificate: {e}")
            return None

class LoanApplicationListView(generics.ListAPIView):
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanApplication.objects.filter(user=self.request.user).order_by('-created_at')

class LoanListView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user).order_by('-created_at')

class LoanDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user)

class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')

class LoanRequestCreateView(generics.CreateAPIView):
    serializer_class = LoanRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

class LoanRequestListView(generics.ListAPIView):
    serializer_class = LoanRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanRequest.objects.filter(user=self.request.user).order_by('-created_at')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_loan(request):
    """
    Calculate loan terms and monthly payments
    """
    serializer = LoanCalculatorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    try:
        calculation = serializer.calculate()
        return Response(calculation)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_currencies(request):
    """
    Get list of available currencies for loan applications
    """
    currencies = Currency.objects.filter(is_active=True).order_by('name')
    return Response([{
        'id': str(currency.id),
        'symbol': currency.symbol,
        'name': currency.name,
        'full_name': currency.full_name,
        'description': currency.description,
        'is_featured': currency.is_featured
    } for currency in currencies])

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_application_payment(request, application_id):
    """
    Process payment for approved loan application and create loan
    """
    try:
        application = LoanApplication.objects.get(
            id=application_id,
            user=request.user,
            status='approved'
        )
    except LoanApplication.DoesNotExist:
        return Response({
            'error': 'Application not found or not approved'
        }, status=status.HTTP_404_NOT_FOUND)

    # Simulate payment processing (integrate with Stripe/payment gateway)
    payment_successful = True  # This would come from payment gateway
    
    if payment_successful:
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
            duration_months=application.duration_months
        )
        
        # Create first payment record for tracking
        Payment.objects.create(
            loan=loan,
            user=application.user,
            payment_type='fee',
            amount_usd=application.fee_amount_usd,
            payment_method='credit_card',
            transaction_id=f'TXN{datetime.now().strftime("%Y%m%d%H%M%S")}',
            installment_number=0,
            status='completed',
            paid_date=datetime.now()
        )
        
        return Response({
            'loan': LoanSerializer(loan).data,
            'message': 'Payment successful! Your loan is now active.'
        })
    else:
        return Response({
            'error': 'Payment processing failed'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def loan_dashboard_stats(request):
    """
    Get dashboard statistics for user's loans
    """
    user = request.user
    loans = user.loans.all()
    applications = user.loan_applications.all()
    
    stats = {
        'total_applications': applications.count(),
        'approved_applications': applications.filter(status='approved').count(),
        'pending_applications': applications.filter(status__in=['submitted', 'under_review']).count(),
        'rejected_applications': applications.filter(status='rejected').count(),
        
        'total_loans': loans.count(),
        'active_loans': loans.filter(status='active').count(),
        'completed_loans': loans.filter(status='completed').count(),
        
        'total_borrowed_usd': sum(loan.principal_amount_usd for loan in loans),
        'total_paid_usd': sum(loan.paid_amount_usd for loan in loans),
        'total_remaining_usd': sum(loan.remaining_amount_usd for loan in loans.filter(status='active')),
        
        'next_payment_due': None,
        'next_payment_amount': None
    }
    
    # Find next payment due
    active_loans = loans.filter(status='active').order_by('next_payment_date')
    if active_loans.exists():
        next_loan = active_loans.first()
        stats['next_payment_due'] = next_loan.next_payment_date
        stats['next_payment_amount'] = next_loan.monthly_payment_usd
    
    return Response(stats)
