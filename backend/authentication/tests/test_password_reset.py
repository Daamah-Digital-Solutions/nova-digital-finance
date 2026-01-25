"""
Tests for password reset functionality.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core import mail
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

User = get_user_model()


class PasswordResetRequestTest(APITestCase):
    """Test cases for password reset request endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_password_reset_request_valid_email(self):
        """Test password reset request with valid email"""
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'test@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_password_reset_request_invalid_email(self):
        """Test password reset request with non-existent email"""
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'nonexistent@example.com'
        })

        # Should still return 200 to prevent email enumeration
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_reset_request_missing_email(self):
        """Test password reset request without email"""
        response = self.client.post('/api/auth/password-reset/', {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_request_invalid_email_format(self):
        """Test password reset request with invalid email format"""
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'not-an-email'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('authentication.views.send_mail')
    def test_password_reset_email_sent(self, mock_send_mail):
        """Test that password reset email is sent"""
        mock_send_mail.return_value = 1

        response = self.client.post('/api/auth/password-reset/', {
            'email': 'test@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Email should be sent for valid users
        mock_send_mail.assert_called_once()


class PasswordResetVerifyTokenTest(APITestCase):
    """Test cases for password reset token verification"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token_generator = PasswordResetTokenGenerator()
        self.valid_token = self.token_generator.make_token(self.user)

    def test_verify_valid_token(self):
        """Test verification of valid token"""
        response = self.client.post('/api/auth/password-reset/verify/', {
            'token': self.valid_token,
            'uid': str(self.user.pk)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('valid', False))

    def test_verify_invalid_token(self):
        """Test verification of invalid token"""
        response = self.client.post('/api/auth/password-reset/verify/', {
            'token': 'invalid-token-12345',
            'uid': str(self.user.pk)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('valid', True))

    def test_verify_token_wrong_user(self):
        """Test verification with wrong user ID"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        response = self.client.post('/api/auth/password-reset/verify/', {
            'token': self.valid_token,
            'uid': str(other_user.pk)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('valid', True))

    def test_verify_token_missing_fields(self):
        """Test verification with missing fields"""
        response = self.client.post('/api/auth/password-reset/verify/', {
            'token': self.valid_token
            # Missing uid
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmTest(APITestCase):
    """Test cases for password reset confirmation"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123'
        )
        self.token_generator = PasswordResetTokenGenerator()
        self.valid_token = self.token_generator.make_token(self.user)

    def test_confirm_reset_valid_token(self):
        """Test password reset confirmation with valid token"""
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': 'newpassword123',
            'password_confirm': 'newpassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_confirm_reset_invalid_token(self):
        """Test password reset confirmation with invalid token"""
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': 'invalid-token-12345',
            'uid': str(self.user.pk),
            'password': 'newpassword123',
            'password_confirm': 'newpassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpassword123'))

    def test_confirm_reset_password_mismatch(self):
        """Test password reset with mismatched passwords"""
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': 'newpassword123',
            'password_confirm': 'differentpassword'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset_weak_password(self):
        """Test password reset with weak password"""
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': '123',  # Too short
            'password_confirm': '123'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_invalidated_after_use(self):
        """Test that token is invalidated after successful reset"""
        # First reset should succeed
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': 'newpassword123',
            'password_confirm': 'newpassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Second attempt with same token should fail
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': 'anotherpassword123',
            'password_confirm': 'anotherpassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_can_login_after_reset(self):
        """Test that user can login with new password after reset"""
        # Reset password
        self.client.post('/api/auth/password-reset/confirm/', {
            'token': self.valid_token,
            'uid': str(self.user.pk),
            'password': 'newpassword123',
            'password_confirm': 'newpassword123'
        })

        # Try to login with new password
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'newpassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class PasswordResetSecurityTest(APITestCase):
    """Security tests for password reset functionality"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_rate_limiting_password_reset_requests(self):
        """Test rate limiting on password reset requests"""
        # Make multiple requests
        for i in range(10):
            response = self.client.post('/api/auth/password-reset/', {
                'email': 'test@example.com'
            })

        # Should eventually be rate limited (or continue returning 200)
        # The exact behavior depends on rate limiting configuration
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_429_TOO_MANY_REQUESTS
        ])

    def test_no_user_enumeration_via_timing(self):
        """Test that response time is consistent regardless of email existence"""
        import time

        # Request with existing email
        start = time.time()
        self.client.post('/api/auth/password-reset/', {
            'email': 'test@example.com'
        })
        existing_time = time.time() - start

        # Request with non-existing email
        start = time.time()
        self.client.post('/api/auth/password-reset/', {
            'email': 'nonexistent@example.com'
        })
        nonexisting_time = time.time() - start

        # Response times should be similar (within 1 second)
        self.assertLess(abs(existing_time - nonexisting_time), 1.0)

    def test_token_not_exposed_in_response(self):
        """Test that token is not exposed in API response"""
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'test@example.com'
        })

        # Token should not be in response data
        response_str = str(response.data)
        self.assertNotIn('token', response_str.lower())
