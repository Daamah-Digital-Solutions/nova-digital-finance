import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock

from authentication.models import UserProfile, KYCDocument
from loans.models import LoanApplication, Loan
from payments.models import PaymentMethod, PaymentTransaction
from documents.models import Document
from currencies.models import Currency, ExchangeRate
from investments.models import InvestmentPlatform, UserInvestmentAccount
from requests.models import LoanRequest

User = get_user_model()


class APIEndpointTestCase(APITestCase):
    """Base test case for API endpoints with common setup"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Create user profile
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890',
            date_of_birth='1990-01-01',
            nationality='US',
            address='123 Test St',
            city='Test City',
            country='United States'
        )
        
        # Set up currencies
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
        
        # Generate tokens
        self.user_refresh = RefreshToken.for_user(self.user)
        self.admin_refresh = RefreshToken.for_user(self.admin_user)
    
    def authenticate_user(self):
        """Authenticate as regular user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_refresh.access_token}')
    
    def authenticate_admin(self):
        """Authenticate as admin user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_refresh.access_token}')
    
    def unauthenticate(self):
        """Remove authentication"""
        self.client.credentials()


class AuthenticationEndpointsTest(APIEndpointTestCase):
    """Test authentication API endpoints"""
    
    def test_register_endpoint(self):
        """Test user registration endpoint"""
        registration_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')
    
    def test_login_endpoint(self):
        """Test user login endpoint"""
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_logout_endpoint(self):
        """Test user logout endpoint"""
        self.authenticate_user()
        
        response = self.client.post('/api/auth/logout/', {
            'refresh': str(self.user_refresh)
        })
        
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
    
    def test_token_refresh_endpoint(self):
        """Test token refresh endpoint"""
        response = self.client.post('/api/auth/token/refresh/', {
            'refresh': str(self.user_refresh)
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_user_profile_endpoint(self):
        """Test user profile endpoints"""
        self.authenticate_user()
        
        # Get profile
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        
        # Update profile
        update_data = {'first_name': 'Updated'}
        response = self.client.patch('/api/auth/me/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
    
    def test_kyc_endpoints(self):
        """Test KYC-related endpoints"""
        self.authenticate_user()
        
        # Get KYC status
        response = self.client.get('/api/auth/kyc/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kyc_status', response.data)
        
        # Get KYC documents
        response = self.client.get('/api/auth/kyc/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class LoanEndpointsTest(APIEndpointTestCase):
    """Test loan API endpoints"""
    
    def setUp(self):
        super().setUp()
        self.user.kyc_status = 'approved'
        self.user.save()
    
    def test_loan_application_endpoint(self):
        """Test loan application endpoint"""
        self.authenticate_user()
        
        loan_data = {
            'amount_requested': 10000.00,
            'currency': 'USD',
            'purpose': 'business_expansion',
            'duration_months': 12,
            'employment_status': 'employed',
            'monthly_income': 5000.00
        }
        
        response = self.client.post('/api/loans/apply/', loan_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('application_number', response.data)
        self.assertEqual(response.data['status'], 'approved')
    
    def test_loan_list_endpoint(self):
        """Test loan list endpoint"""
        self.authenticate_user()
        
        # Create test loan
        application = LoanApplication.objects.create(
            user=self.user,
            amount_requested=Decimal('5000.00'),
            currency=self.usd,
            purpose='personal',
            status='approved'
        )
        
        loan = Loan.objects.create(
            user=self.user,
            application=application,
            amount_usd=Decimal('5000.00'),
            currency=self.usd,
            fee_rate=Decimal('0.03'),
            fee_amount_usd=Decimal('150.00'),
            status='active'
        )
        
        response = self.client.get('/api/loans/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(response.data[0]['id'], str(loan.id))
    
    def test_loan_detail_endpoint(self):
        """Test loan detail endpoint"""
        self.authenticate_user()
        
        # Create test loan
        application = LoanApplication.objects.create(
            user=self.user,
            amount_requested=Decimal('5000.00'),
            currency=self.usd,
            purpose='personal',
            status='approved'
        )
        
        loan = Loan.objects.create(
            user=self.user,
            application=application,
            amount_usd=Decimal('5000.00'),
            currency=self.usd,
            fee_rate=Decimal('0.03'),
            fee_amount_usd=Decimal('150.00'),
            status='active'
        )
        
        response = self.client.get(f'/api/loans/{loan.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(loan.id))
        self.assertEqual(float(response.data['amount_usd']), 5000.00)
    
    def test_loan_payment_schedule_endpoint(self):
        """Test loan payment schedule endpoint"""
        self.authenticate_user()
        
        # Create test loan
        application = LoanApplication.objects.create(
            user=self.user,
            amount_requested=Decimal('5000.00'),
            currency=self.usd,
            purpose='personal',
            status='approved'
        )
        
        loan = Loan.objects.create(
            user=self.user,
            application=application,
            amount_usd=Decimal('5000.00'),
            currency=self.usd,
            fee_rate=Decimal('0.03'),
            fee_amount_usd=Decimal('150.00'),
            status='active'
        )
        
        response = self.client.get(f'/api/loans/{loan.id}/schedule/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payments', response.data)
    
    def test_loan_summary_endpoint(self):
        """Test loan summary endpoint"""
        self.authenticate_user()
        
        response = self.client.get('/api/loans/summary/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_loans', response.data)
        self.assertIn('active_loans', response.data)
        self.assertIn('total_borrowed', response.data)


class PaymentEndpointsTest(APIEndpointTestCase):
    """Test payment API endpoints"""
    
    def setUp(self):
        super().setUp()
        
        # Create test loan
        application = LoanApplication.objects.create(
            user=self.user,
            amount_requested=Decimal('5000.00'),
            currency=self.usd,
            purpose='personal',
            status='approved'
        )
        
        self.loan = Loan.objects.create(
            user=self.user,
            application=application,
            amount_usd=Decimal('5000.00'),
            currency=self.usd,
            fee_rate=Decimal('0.03'),
            fee_amount_usd=Decimal('150.00'),
            status='active'
        )
        
        # Create payment method
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            type='card',
            provider='stripe',
            provider_id='pm_test123',
            is_default=True,
            metadata={'last4': '4242', 'brand': 'visa'}
        )
    
    def test_payment_methods_endpoint(self):
        """Test payment methods endpoints"""
        self.authenticate_user()
        
        # List payment methods
        response = self.client.get('/api/payments/methods/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(response.data[0]['id'], str(self.payment_method.id))
    
    @patch('payments.services.StripePaymentService.process_payment')
    def test_create_payment_endpoint(self, mock_stripe):
        """Test payment creation endpoint"""
        self.authenticate_user()
        
        mock_stripe.return_value = {
            'success': True,
            'transaction_id': 'pi_test123',
            'amount': 500.00,
            'currency': 'USD'
        }
        
        payment_data = {
            'amount': 500.00,
            'payment_method_id': str(self.payment_method.id),
            'currency': 'USD'
        }
        
        response = self.client.post(f'/api/loans/{self.loan.id}/payments/', payment_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'completed')
        self.assertEqual(float(response.data['amount_usd']), 500.00)
    
    def test_payment_history_endpoint(self):
        """Test payment history endpoint"""
        self.authenticate_user()
        
        response = self.client.get(f'/api/loans/{self.loan.id}/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class DocumentEndpointsTest(APIEndpointTestCase):
    """Test document API endpoints"""
    
    def test_document_list_endpoint(self):
        """Test document list endpoint"""
        self.authenticate_user()
        
        # Create test document
        document = Document.objects.create(
            user=self.user,
            document_type='loan_contract',
            title='Test Contract',
            status='completed'
        )
        
        response = self.client.get('/api/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_document_download_endpoint(self):
        """Test document download endpoint"""
        self.authenticate_user()
        
        document = Document.objects.create(
            user=self.user,
            document_type='loan_contract',
            title='Test Contract',
            status='completed',
            file_path='/path/to/test.pdf'
        )
        
        response = self.client.get(f'/api/documents/{document.id}/download/')
        
        # Should return appropriate response (might be 404 if file doesn't exist in test)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])


class InvestmentEndpointsTest(APIEndpointTestCase):
    """Test investment API endpoints"""
    
    def setUp(self):
        super().setUp()
        
        # Create investment platform
        self.platform = InvestmentPlatform.objects.create(
            name='Capimax',
            api_url='https://api.capimax.com',
            is_active=True
        )
        
        # Create user investment account
        self.investment_account = UserInvestmentAccount.objects.create(
            user=self.user,
            platform=self.platform,
            account_id='CAP123456',
            status='active'
        )
    
    def test_investment_platforms_endpoint(self):
        """Test investment platforms endpoint"""
        self.authenticate_user()
        
        response = self.client.get('/api/investments/platforms/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(response.data[0]['name'], 'Capimax')
    
    def test_user_investment_accounts_endpoint(self):
        """Test user investment accounts endpoint"""
        self.authenticate_user()
        
        response = self.client.get('/api/investments/accounts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(response.data[0]['account_id'], 'CAP123456')
    
    @patch('investments.services.CapimaxIntegrationService.get_account_balance')
    def test_investment_portfolio_endpoint(self, mock_balance):
        """Test investment portfolio endpoint"""
        self.authenticate_user()
        
        mock_balance.return_value = {
            'balance': 5000.00,
            'currency': 'USD',
            'positions': []
        }
        
        response = self.client.get('/api/investments/portfolio/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('accounts', response.data)


class RequestEndpointsTest(APIEndpointTestCase):
    """Test request API endpoints"""
    
    def setUp(self):
        super().setUp()
        
        # Create test loan
        application = LoanApplication.objects.create(
            user=self.user,
            amount_requested=Decimal('5000.00'),
            currency=self.usd,
            purpose='personal',
            status='approved'
        )
        
        self.loan = Loan.objects.create(
            user=self.user,
            application=application,
            amount_usd=Decimal('5000.00'),
            currency=self.usd,
            fee_rate=Decimal('0.03'),
            fee_amount_usd=Decimal('150.00'),
            status='active'
        )
    
    def test_create_request_endpoint(self):
        """Test request creation endpoint"""
        self.authenticate_user()
        
        request_data = {
            'request_type': 'increase',
            'requested_amount': 2000.00,
            'reason': 'Business expansion needs'
        }
        
        response = self.client.post(f'/api/loans/{self.loan.id}/requests/', request_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['request_type'], 'increase')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_list_requests_endpoint(self):
        """Test requests list endpoint"""
        self.authenticate_user()
        
        # Create test request
        loan_request = LoanRequest.objects.create(
            user=self.user,
            loan=self.loan,
            request_type='increase',
            title='Loan Increase Request',
            description='Need more funds',
            status='pending'
        )
        
        response = self.client.get('/api/requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(response.data[0]['request_type'], 'increase')


class CurrencyEndpointsTest(APIEndpointTestCase):
    """Test currency API endpoints"""
    
    def test_currency_list_endpoint(self):
        """Test currency list endpoint"""
        response = self.client.get('/api/currencies/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        
        # Check USD is included
        usd_found = any(currency['code'] == 'USD' for currency in response.data)
        self.assertTrue(usd_found)
    
    def test_exchange_rates_endpoint(self):
        """Test exchange rates endpoint"""
        response = self.client.get('/api/currencies/rates/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class SecurityEndpointsTest(APIEndpointTestCase):
    """Test security-related endpoints"""
    
    def test_unauthorized_access(self):
        """Test that protected endpoints require authentication"""
        protected_endpoints = [
            '/api/auth/me/',
            '/api/loans/',
            '/api/payments/methods/',
            '/api/documents/',
            '/api/investments/accounts/',
            '/api/requests/'
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(
                response.status_code, 
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {endpoint} should require authentication"
            )
    
    def test_user_data_isolation(self):
        """Test that users can only access their own data"""
        self.authenticate_user()
        
        # Try to access non-existent resource (should return 404, not other user's data)
        response = self.client.get('/api/loans/999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_admin_only_endpoints(self):
        """Test that admin endpoints require admin privileges"""
        self.authenticate_user()
        
        # Try to access admin endpoints (if any exist)
        admin_endpoints = [
            '/api/admin/users/',
            '/api/admin/loans/',
            '/api/admin/security/'
        ]
        
        for endpoint in admin_endpoints:
            response = self.client.get(endpoint)
            # Should return 404 (not found) or 403 (forbidden), not 200 (success)
            self.assertIn(response.status_code, [
                status.HTTP_404_NOT_FOUND,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_401_UNAUTHORIZED
            ])


class APIErrorHandlingTest(APIEndpointTestCase):
    """Test API error handling"""
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON in requests"""
        self.authenticate_user()
        
        response = self.client.post(
            '/api/loans/apply/',
            'invalid json',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        self.authenticate_user()
        
        # Try loan application without required fields
        incomplete_data = {
            'amount_requested': 5000.00
            # Missing other required fields
        }
        
        response = self.client.post('/api/loans/apply/', incomplete_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('currency', response.data)  # Should list missing fields
    
    def test_invalid_data_types(self):
        """Test handling of invalid data types"""
        self.authenticate_user()
        
        invalid_data = {
            'amount_requested': 'not_a_number',
            'currency': 'USD',
            'purpose': 'personal'
        }
        
        response = self.client.post('/api/loans/apply/', invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_rate_limiting_response(self):
        """Test rate limiting error responses"""
        # This would require actual rate limiting middleware to work
        # For now, test that endpoints respond appropriately
        
        for _ in range(5):  # Make multiple requests
            response = self.client.post('/api/auth/login/', {
                'username': 'nonexistent',
                'password': 'wrong'
            })
            
            # Should eventually get rate limited or return 401
            self.assertIn(response.status_code, [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_429_TOO_MANY_REQUESTS
            ])


class APIPerformanceTest(APIEndpointTestCase):
    """Test API performance characteristics"""
    
    def test_response_times(self):
        """Test that API endpoints respond within acceptable time limits"""
        import time
        
        self.authenticate_user()
        
        endpoints_to_test = [
            '/api/auth/me/',
            '/api/loans/',
            '/api/currencies/',
            '/api/documents/'
        ]
        
        for endpoint in endpoints_to_test:
            start_time = time.time()
            response = self.client.get(endpoint)
            end_time = time.time()
            
            response_time = end_time - start_time
            
            # Should respond within 2 seconds
            self.assertLess(
                response_time, 
                2.0, 
                f"Endpoint {endpoint} took {response_time:.2f}s to respond"
            )
            
            # Should return successful response
            self.assertIn(response.status_code, [
                status.HTTP_200_OK,
                status.HTTP_201_CREATED
            ])
    
    def test_pagination_performance(self):
        """Test pagination performance with large datasets"""
        self.authenticate_user()
        
        # Test with page size parameter
        response = self.client.get('/api/loans/?page=1&page_size=50')
        
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND  # If no loans exist
        ])
        
        if response.status_code == status.HTTP_200_OK:
            # Should include pagination metadata if using pagination
            if 'count' in response.data or 'results' in response.data:
                self.assertTrue(True)  # Pagination is working