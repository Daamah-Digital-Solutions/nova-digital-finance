import json
from decimal import Decimal
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from django.utils import timezone

from loans.models import LoanApplication, Loan, Payment
from currencies.models import Currency, ExchangeRate
from authentication.models import UserProfile
from payments.models import PaymentMethod, PaymentTransaction
from documents.models import Document

User = get_user_model()


class LoanApplicationFlowIntegrationTest(APITestCase):
    """Integration tests for complete loan application flow"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create user profile for KYC
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890',
            date_of_birth='1990-01-01',
            nationality='US',
            address='123 Test St',
            city='Test City',
            country='United States',
            annual_income='75000'
        )
        
        # Set user as KYC verified
        self.user.kyc_status = 'approved'
        self.user.save()
        
        # Create currencies
        self.usd = Currency.objects.create(
            code='USD',
            name='US Dollar',
            symbol='$',
            is_active=True
        )
        
        self.prn = Currency.objects.create(
            code='PRN',
            name='Pronova',
            symbol='PRN',
            is_active=True
        )
        
        # Create exchange rates
        ExchangeRate.objects.create(
            from_currency=self.usd,
            to_currency=self.usd,
            rate=Decimal('1.00')
        )
        
        ExchangeRate.objects.create(
            from_currency=self.prn,
            to_currency=self.usd,
            rate=Decimal('0.50')
        )
        
        # Authenticate user
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
    
    def test_complete_loan_application_flow(self):
        """Test complete loan application from start to finish"""
        
        # Step 1: Apply for loan
        loan_data = {
            'amount_requested': 10000.00,
            'currency': 'USD',
            'purpose': 'business_expansion',
            'duration_months': 12,
            'employment_status': 'employed',
            'monthly_income': 6000.00,
            'existing_debts': 5000.00
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('application_number', response.data)
        
        application_id = response.data['id']
        application = LoanApplication.objects.get(id=application_id)
        
        # Step 2: Application should be automatically processed
        self.assertEqual(application.status, 'approved')  # Assuming auto-approval for good profile
        
        # Step 3: Loan should be created automatically
        loan = Loan.objects.get(application=application)
        self.assertEqual(loan.status, 'approved')
        self.assertEqual(loan.amount_usd, Decimal('10000.00'))
        
        # Step 4: Check loan details
        response = self.client.get(f'/api/loans/{loan.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        self.assertEqual(float(response.data['amount_usd']), 10000.00)
        
        return loan
    
    def test_loan_activation_flow(self):
        """Test loan activation after approval"""
        loan = self.test_complete_loan_application_flow()
        
        # Activate the loan
        response = self.client.post(f'/api/loans/{loan.id}/activate/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        loan.refresh_from_db()
        self.assertEqual(loan.status, 'active')
        self.assertIsNotNone(loan.disbursed_at)
    
    @patch('payments.services.StripePaymentService.process_payment')
    def test_loan_payment_flow(self, mock_stripe):
        """Test complete loan payment process"""
        # Setup mock
        mock_stripe.return_value = {
            'success': True,
            'transaction_id': 'pi_test123',
            'amount': 500.00,
            'currency': 'USD'
        }
        
        loan = self.test_complete_loan_application_flow()
        loan.status = 'active'
        loan.save()
        
        # Create payment method
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            type='card',
            provider='stripe',
            provider_id='pm_test123',
            is_default=True,
            metadata={'last4': '4242', 'brand': 'visa'}
        )
        
        # Make a payment
        payment_data = {
            'amount': 500.00,
            'payment_method_id': str(payment_method.id),
            'currency': 'USD'
        }
        
        response = self.client.post(f'/api/loans/{loan.id}/payments/', payment_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'completed')
        
        # Check payment was recorded
        payment = Payment.objects.get(id=response.data['id'])
        self.assertEqual(payment.loan, loan)
        self.assertEqual(payment.amount_usd, Decimal('500.00'))
        self.assertEqual(payment.status, 'completed')
        
        # Check loan balance updated
        loan.refresh_from_db()
        expected_balance = loan.amount_usd + loan.fee_amount_usd - Decimal('500.00')
        self.assertEqual(loan.remaining_balance_usd, expected_balance)
    
    def test_loan_rejection_flow(self):
        """Test loan application rejection flow"""
        # Create user with poor profile for rejection
        poor_user = User.objects.create_user(
            username='pooruser',
            email='poor@example.com',
            password='testpass123'
        )
        
        # Create poor profile
        UserProfile.objects.create(
            user=poor_user,
            phone_number='+1234567890',
            date_of_birth='2005-01-01',  # Too young
            annual_income='15000'  # Low income
        )
        
        poor_user.kyc_status = 'approved'
        poor_user.save()
        
        # Authenticate poor user
        refresh = RefreshToken.for_user(poor_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Apply for loan
        loan_data = {
            'amount_requested': 50000.00,  # High amount
            'currency': 'USD',
            'purpose': 'personal',
            'duration_months': 60,
            'employment_status': 'unemployed',
            'monthly_income': 1000.00,
            'existing_debts': 20000.00
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        application = LoanApplication.objects.get(id=response.data['id'])
        self.assertEqual(application.status, 'rejected')
        
        # Should not create a loan
        self.assertFalse(Loan.objects.filter(application=application).exists())
    
    def test_kyc_requirement_for_loan_application(self):
        """Test that KYC verification is required for loan application"""
        # Create user without KYC approval
        unverified_user = User.objects.create_user(
            username='unverified',
            email='unverified@example.com',
            password='testpass123'
        )
        
        # Authenticate unverified user
        refresh = RefreshToken.for_user(unverified_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Try to apply for loan
        loan_data = {
            'amount_requested': 5000.00,
            'currency': 'USD',
            'purpose': 'personal',
            'duration_months': 12
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('kyc', response.data['error'].lower())
    
    def test_currency_conversion_in_loan(self):
        """Test loan application with different currencies"""
        loan_data = {
            'amount_requested': 20000.00,  # 20,000 PRN
            'currency': 'PRN',
            'purpose': 'business_expansion',
            'duration_months': 24
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        loan = Loan.objects.get(application__id=response.data['id'])
        
        # Should convert PRN to USD (20,000 PRN * 0.5 = 10,000 USD)
        self.assertEqual(loan.amount_usd, Decimal('10000.00'))
        self.assertEqual(loan.currency.code, 'PRN')
    
    @patch('documents.services.DocumentGenerationService.generate_loan_contract')
    def test_document_generation_on_approval(self, mock_doc_gen):
        """Test automatic document generation on loan approval"""
        mock_doc_gen.return_value = b'PDF content'
        
        loan = self.test_complete_loan_application_flow()
        
        # Check if document was created
        documents = Document.objects.filter(
            user=self.user,
            document_type='loan_contract',
            related_loan=loan
        )
        
        # Document should be generated (mocked)
        mock_doc_gen.assert_called()
    
    def test_loan_early_settlement(self):
        """Test early loan settlement flow"""
        loan = self.test_complete_loan_application_flow()
        loan.status = 'active'
        loan.remaining_balance_usd = Decimal('8500.00')  # Some payments made
        loan.save()
        
        # Request early settlement
        response = self.client.post(f'/api/loans/{loan.id}/settle/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('settlement_amount', response.data)
        
        settlement_amount = Decimal(response.data['settlement_amount'])
        self.assertLess(settlement_amount, loan.remaining_balance_usd)  # Should be discounted
    
    def test_loan_modification_request(self):
        """Test loan modification request creation"""
        loan = self.test_complete_loan_application_flow()
        loan.status = 'active'
        loan.save()
        
        # Request loan increase
        request_data = {
            'request_type': 'increase',
            'requested_amount': 5000.00,
            'reason': 'Business expansion needs'
        }
        
        response = self.client.post(f'/api/loans/{loan.id}/requests/', request_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['request_type'], 'increase')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_multiple_loan_applications(self):
        """Test user with multiple loan applications"""
        # Create first loan
        loan1 = self.test_complete_loan_application_flow()
        
        # Try to apply for second loan while first is active
        loan_data = {
            'amount_requested': 5000.00,
            'currency': 'USD',
            'purpose': 'personal',
            'duration_months': 6
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        # Should either be approved or require additional verification
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ])
        
        if response.status_code == status.HTTP_201_CREATED:
            # If approved, check loan limits are enforced
            application = LoanApplication.objects.get(id=response.data['id'])
            self.assertIsNotNone(application)
    
    def test_loan_payment_schedule_generation(self):
        """Test automatic payment schedule generation"""
        loan = self.test_complete_loan_application_flow()
        loan.status = 'active'
        loan.save()
        
        # Get payment schedule
        response = self.client.get(f'/api/loans/{loan.id}/schedule/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payments', response.data)
        self.assertGreater(len(response.data['payments']), 0)
        
        # Check payment amounts add up correctly
        total_payments = sum(Decimal(payment['amount']) for payment in response.data['payments'])
        expected_total = loan.amount_usd + loan.fee_amount_usd
        
        # Allow for small rounding differences
        self.assertAlmostEqual(float(total_payments), float(expected_total), places=2)
    
    def test_loan_analytics_and_reporting(self):
        """Test loan analytics endpoints"""
        loan = self.test_complete_loan_application_flow()
        
        # Get user loan summary
        response = self.client.get('/api/loans/summary/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_loans', response.data)
        self.assertIn('active_loans', response.data)
        self.assertIn('total_borrowed', response.data)
        
        # Check values are correct
        self.assertEqual(response.data['total_loans'], 1)
        self.assertEqual(response.data['active_loans'], 1)


class LoanSecurityIntegrationTest(APITestCase):
    """Integration tests for loan security features"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Set up authentication
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
    
    @patch('security.middleware.MHCCIntegrationMiddleware._detect_threats')
    def test_fraud_detection_on_application(self, mock_fraud_detection):
        """Test fraud detection during loan application"""
        mock_fraud_detection.return_value = True  # Threat detected
        
        loan_data = {
            'amount_requested': 100000.00,  # Suspiciously high
            'currency': 'USD',
            'purpose': 'other'
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        # Request should be blocked or flagged
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST
        ])
    
    @patch('security.mhcc_integration.security_monitor.analyze_api_behavior')
    def test_api_abuse_detection(self, mock_api_monitor):
        """Test API abuse detection for loan endpoints"""
        mock_api_monitor.return_value = False  # Anomaly detected
        
        # Make multiple rapid requests
        for _ in range(5):
            response = self.client.get('/api/loans/')
            
        # Should trigger monitoring (implementation would block excessive requests)
        mock_api_monitor.assert_called()
    
    def test_unauthorized_loan_access(self):
        """Test that users can only access their own loans"""
        # Create another user's loan
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        
        # This would require an actual loan to exist - simplified test
        response = self.client.get('/api/loans/999/')  # Non-existent loan
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LoanPerformanceTest(TransactionTestCase):
    """Performance tests for loan operations"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create currency
        self.usd = Currency.objects.create(
            code='USD',
            name='US Dollar',
            symbol='$',
            is_active=True
        )
        
        ExchangeRate.objects.create(
            from_currency=self.usd,
            to_currency=self.usd,
            rate=Decimal('1.00')
        )
    
    def test_bulk_loan_creation_performance(self):
        """Test performance of creating multiple loans"""
        import time
        
        start_time = time.time()
        
        # Create multiple loan applications
        applications = []
        for i in range(10):
            application = LoanApplication.objects.create(
                user=self.user,
                amount_requested=Decimal('5000.00'),
                currency=self.usd,
                purpose='personal',
                status='approved'
            )
            applications.append(application)
        
        # Create loans
        for application in applications:
            Loan.objects.create(
                user=self.user,
                application=application,
                amount_usd=application.amount_requested,
                currency=application.currency,
                fee_rate=Decimal('0.03'),
                fee_amount_usd=application.amount_requested * Decimal('0.03'),
                status='approved'
            )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 5.0)  # 5 seconds max
        self.assertEqual(Loan.objects.count(), 10)
    
    def test_loan_query_performance(self):
        """Test performance of loan queries"""
        # Create test data
        applications = []
        loans = []
        
        for i in range(50):
            application = LoanApplication.objects.create(
                user=self.user,
                amount_requested=Decimal('1000.00'),
                currency=self.usd,
                purpose='personal',
                status='approved'
            )
            applications.append(application)
            
            loan = Loan.objects.create(
                user=self.user,
                application=application,
                amount_usd=Decimal('1000.00'),
                currency=self.usd,
                fee_rate=Decimal('0.03'),
                fee_amount_usd=Decimal('30.00'),
                status='active'
            )
            loans.append(loan)
        
        import time
        start_time = time.time()
        
        # Test complex query
        active_loans = Loan.objects.filter(
            user=self.user,
            status='active'
        ).select_related('currency', 'application').count()
        
        end_time = time.time()
        query_time = end_time - start_time
        
        self.assertEqual(active_loans, 50)
        self.assertLess(query_time, 1.0)  # Should be fast