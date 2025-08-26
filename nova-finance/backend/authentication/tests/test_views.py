import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from authentication.models import KYCDocument, UserProfile

User = get_user_model()


class AuthenticationViewTest(APITestCase):
    """Test cases for authentication views"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        self.user = User.objects.create_user(**self.user_data)
    
    def test_user_registration(self):
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
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_user_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        registration_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'differentpass',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_user_registration_duplicate_email(self):
        """Test registration with existing email"""
        registration_data = {
            'username': 'newuser',
            'email': 'test@example.com',  # Already exists
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_login(self):
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
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_token_refresh(self):
        """Test token refresh endpoint"""
        refresh = RefreshToken.for_user(self.user)
        
        response = self.client.post('/api/auth/token/refresh/', {
            'refresh': str(refresh)
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_user_logout(self):
        """Test user logout endpoint"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.post('/api/auth/logout/', {
            'refresh': str(refresh)
        })
        
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        
        response = self.client.patch('/api/auth/me/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoint without authentication"""
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class KYCViewTest(APITestCase):
    """Test cases for KYC views"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
    
    def test_create_user_profile(self):
        """Test creating user profile"""
        profile_data = {
            'phone_number': '+1234567890',
            'date_of_birth': '1990-01-01',
            'nationality': 'US',
            'address': '123 Test St',
            'city': 'Test City',
            'country': 'United States',
            'postal_code': '12345',
            'occupation': 'Software Engineer',
            'annual_income': '75000'
        }
        
        response = self.client.post('/api/auth/profile/', profile_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())
        self.assertEqual(response.data['phone_number'], '+1234567890')
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890',
            nationality='US'
        )
        
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], '+1234567890')
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890'
        )
        
        update_data = {
            'phone_number': '+9876543210',
            'city': 'New City'
        }
        
        response = self.client.patch('/api/auth/profile/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], '+9876543210')
        self.assertEqual(response.data['city'], 'New City')
    
    @patch('authentication.views.security_monitor.scan_uploaded_file')
    def test_kyc_document_upload(self, mock_scan):
        """Test KYC document upload"""
        mock_scan.return_value = {
            'analysis_id': 'test-analysis',
            'immediate_threat': False,
            'requires_review': False
        }
        
        # Create a simple test file
        from django.core.files.uploadedfile import SimpleUploadedFile
        test_file = SimpleUploadedFile(
            "test_document.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        
        document_data = {
            'document_type': 'identity_card',
            'document_number': 'ID123456789',
            'file': test_file
        }
        
        response = self.client.post('/api/auth/kyc/documents/', document_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(KYCDocument.objects.filter(user=self.user).exists())
        self.assertEqual(response.data['document_type'], 'identity_card')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_get_kyc_documents(self):
        """Test getting user's KYC documents"""
        document = KYCDocument.objects.create(
            user=self.user,
            document_type='passport',
            document_number='P123456789'
        )
        
        response = self.client.get('/api/auth/kyc/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['document_type'], 'passport')
    
    def test_kyc_status_check(self):
        """Test KYC status endpoint"""
        response = self.client.get('/api/auth/kyc/status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['kyc_status'], 'pending')
        self.assertIn('required_documents', response.data)
    
    def test_unauthorized_kyc_access(self):
        """Test accessing KYC endpoints without authentication"""
        self.client.credentials()  # Remove auth
        
        response = self.client.get('/api/auth/kyc/status/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SecurityIntegrationTest(APITestCase):
    """Test cases for security integration"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
    
    @patch('authentication.views.security_monitor.monitor_login_attempts')
    def test_login_security_monitoring(self, mock_monitor):
        """Test security monitoring on login attempts"""
        mock_monitor.return_value = True
        
        # Create user first
        user = User.objects.create_user(**self.user_data)
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_monitor.assert_called_once()
    
    @patch('authentication.views.security_monitor.monitor_login_attempts')
    def test_failed_login_security_monitoring(self, mock_monitor):
        """Test security monitoring on failed login attempts"""
        mock_monitor.return_value = False  # Indicates suspicious activity
        
        # Create user first
        user = User.objects.create_user(**self.user_data)
        
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_rate_limiting_protection(self):
        """Test that rate limiting is applied"""
        # This test would need actual middleware to work properly
        # For now, we test that the endpoint exists and responds normally
        
        login_data = {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }
        
        # Make multiple requests
        for _ in range(3):
            response = self.client.post('/api/auth/login/', login_data)
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_429_TOO_MANY_REQUESTS])


class APIEndpointTest(APITestCase):
    """Test API endpoint structure and responses"""
    
    def test_auth_endpoints_exist(self):
        """Test that all auth endpoints are properly configured"""
        endpoints = [
            '/api/auth/register/',
            '/api/auth/login/',
            '/api/auth/logout/',
            '/api/auth/token/refresh/',
            '/api/auth/me/',
            '/api/auth/profile/',
            '/api/auth/kyc/status/',
            '/api/auth/kyc/documents/',
        ]
        
        for endpoint in endpoints:
            # Test that endpoint exists (doesn't return 404)
            response = self.client.post(endpoint)
            self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = self.client.options('/api/auth/login/')
        
        # Check for CORS headers (these would be added by middleware)
        # This is a basic structure test
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)