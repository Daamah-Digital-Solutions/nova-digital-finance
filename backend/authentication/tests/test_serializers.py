from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from authentication.serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    KYCDocumentSerializer,
    UserDetailSerializer
)
from authentication.models import UserProfile, KYCDocument

User = get_user_model()


class UserRegistrationSerializerTest(TestCase):
    """Test cases for UserRegistrationSerializer"""
    
    def setUp(self):
        self.factory = APIRequestFactory()
        self.valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    def test_valid_registration_data(self):
        """Test serializer with valid registration data"""
        serializer = UserRegistrationSerializer(data=self.valid_data)
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_password_mismatch(self):
        """Test validation with mismatched passwords"""
        data = self.valid_data.copy()
        data['password_confirm'] = 'differentpassword'
        
        serializer = UserRegistrationSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_weak_password(self):
        """Test validation with weak password"""
        data = self.valid_data.copy()
        data['password'] = '123'
        data['password_confirm'] = '123'
        
        serializer = UserRegistrationSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_duplicate_username(self):
        """Test validation with existing username"""
        User.objects.create_user(
            username='testuser',
            email='existing@example.com',
            password='existingpass123'
        )
        
        serializer = UserRegistrationSerializer(data=self.valid_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
    
    def test_duplicate_email(self):
        """Test validation with existing email"""
        User.objects.create_user(
            username='existinguser',
            email='test@example.com',
            password='existingpass123'
        )
        
        serializer = UserRegistrationSerializer(data=self.valid_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_missing_required_fields(self):
        """Test validation with missing required fields"""
        incomplete_data = {
            'username': 'testuser',
            # Missing email and passwords
        }
        
        serializer = UserRegistrationSerializer(data=incomplete_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertIn('password', serializer.errors)
    
    def test_invalid_email_format(self):
        """Test validation with invalid email format"""
        data = self.valid_data.copy()
        data['email'] = 'invalid-email'
        
        serializer = UserRegistrationSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class UserLoginSerializerTest(TestCase):
    """Test cases for UserLoginSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_valid_login_data(self):
        """Test serializer with valid login credentials"""
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        serializer = UserLoginSerializer(data=login_data)
        
        self.assertTrue(serializer.is_valid())
        validated_data = serializer.validated_data
        self.assertEqual(validated_data['user'], self.user)
    
    def test_invalid_credentials(self):
        """Test serializer with invalid credentials"""
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        serializer = UserLoginSerializer(data=login_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_nonexistent_user(self):
        """Test serializer with non-existent user"""
        login_data = {
            'username': 'nonexistentuser',
            'password': 'somepassword'
        }
        
        serializer = UserLoginSerializer(data=login_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_inactive_user(self):
        """Test serializer with inactive user"""
        self.user.is_active = False
        self.user.save()
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        serializer = UserLoginSerializer(data=login_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_missing_fields(self):
        """Test serializer with missing required fields"""
        incomplete_data = {
            'username': 'testuser'
            # Missing password
        }
        
        serializer = UserLoginSerializer(data=incomplete_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class UserProfileSerializerTest(TestCase):
    """Test cases for UserProfileSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.valid_profile_data = {
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
    
    def test_valid_profile_creation(self):
        """Test creating profile with valid data"""
        serializer = UserProfileSerializer(data=self.valid_profile_data)
        
        self.assertTrue(serializer.is_valid())
        profile = serializer.save(user=self.user)
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.phone_number, '+1234567890')
        self.assertEqual(str(profile.date_of_birth), '1990-01-01')
        self.assertEqual(profile.nationality, 'US')
    
    def test_profile_update(self):
        """Test updating existing profile"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1111111111',
            nationality='US'
        )
        
        update_data = {
            'phone_number': '+2222222222',
            'city': 'Updated City'
        }
        
        serializer = UserProfileSerializer(profile, data=update_data, partial=True)
        
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()
        
        self.assertEqual(updated_profile.phone_number, '+2222222222')
        self.assertEqual(updated_profile.city, 'Updated City')
        self.assertEqual(updated_profile.nationality, 'US')  # Unchanged
    
    def test_invalid_phone_number(self):
        """Test validation with invalid phone number format"""
        data = self.valid_profile_data.copy()
        data['phone_number'] = '123'  # Too short
        
        serializer = UserProfileSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone_number', serializer.errors)
    
    def test_future_birth_date(self):
        """Test validation with future birth date"""
        data = self.valid_profile_data.copy()
        data['date_of_birth'] = '2030-01-01'
        
        serializer = UserProfileSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('date_of_birth', serializer.errors)
    
    def test_underage_user(self):
        """Test validation with underage user"""
        data = self.valid_profile_data.copy()
        data['date_of_birth'] = '2020-01-01'  # Too young
        
        serializer = UserProfileSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('date_of_birth', serializer.errors)
    
    def test_optional_fields(self):
        """Test that optional fields can be omitted"""
        minimal_data = {
            'phone_number': '+1234567890'
        }
        
        serializer = UserProfileSerializer(data=minimal_data)
        
        self.assertTrue(serializer.is_valid())
        profile = serializer.save(user=self.user)
        
        self.assertEqual(profile.phone_number, '+1234567890')
        self.assertEqual(profile.occupation, '')  # Default empty


class KYCDocumentSerializerTest(TestCase):
    """Test cases for KYCDocumentSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_valid_kyc_document_data(self):
        """Test serializer with valid KYC document data"""
        document_data = {
            'document_type': 'identity_card',
            'document_number': 'ID123456789',
            'expiry_date': '2025-12-31'
        }
        
        serializer = KYCDocumentSerializer(data=document_data)
        
        self.assertTrue(serializer.is_valid())
        document = serializer.save(user=self.user)
        
        self.assertEqual(document.user, self.user)
        self.assertEqual(document.document_type, 'identity_card')
        self.assertEqual(document.document_number, 'ID123456789')
        self.assertEqual(document.status, 'pending')
    
    def test_invalid_document_type(self):
        """Test validation with invalid document type"""
        document_data = {
            'document_type': 'invalid_type',
            'document_number': 'ID123456789'
        }
        
        serializer = KYCDocumentSerializer(data=document_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('document_type', serializer.errors)
    
    def test_missing_document_number(self):
        """Test validation with missing document number"""
        document_data = {
            'document_type': 'passport'
            # Missing document_number
        }
        
        serializer = KYCDocumentSerializer(data=document_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('document_number', serializer.errors)
    
    def test_expired_document(self):
        """Test validation with expired document"""
        document_data = {
            'document_type': 'passport',
            'document_number': 'P123456789',
            'expiry_date': '2020-01-01'  # Expired
        }
        
        serializer = KYCDocumentSerializer(data=document_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('expiry_date', serializer.errors)
    
    def test_document_update(self):
        """Test updating existing document"""
        document = KYCDocument.objects.create(
            user=self.user,
            document_type='identity_card',
            document_number='ID123456789'
        )
        
        update_data = {
            'status': 'approved',
            'notes': 'Document verified successfully'
        }
        
        serializer = KYCDocumentSerializer(document, data=update_data, partial=True)
        
        self.assertTrue(serializer.is_valid())
        updated_document = serializer.save()
        
        self.assertEqual(updated_document.status, 'approved')
        self.assertEqual(updated_document.notes, 'Document verified successfully')


class UserDetailSerializerTest(TestCase):
    """Test cases for UserDetailSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890',
            nationality='US'
        )
    
    def test_user_detail_serialization(self):
        """Test complete user detail serialization"""
        serializer = UserDetailSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertEqual(data['kyc_status'], 'pending')
        
        # Check profile data is included
        self.assertIn('profile', data)
        self.assertEqual(data['profile']['phone_number'], '+1234567890')
        self.assertEqual(data['profile']['nationality'], 'US')
    
    def test_user_without_profile(self):
        """Test serialization of user without profile"""
        user_without_profile = User.objects.create_user(
            username='noprofileuser',
            email='noprofile@example.com',
            password='testpass123'
        )
        
        serializer = UserDetailSerializer(user_without_profile)
        data = serializer.data
        
        self.assertEqual(data['username'], 'noprofileuser')
        self.assertIsNone(data['profile'])
    
    def test_sensitive_data_excluded(self):
        """Test that sensitive data is not included in serialization"""
        serializer = UserDetailSerializer(self.user)
        data = serializer.data
        
        # Password should not be included
        self.assertNotIn('password', data)
        
        # Check that expected fields are present
        expected_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'kyc_status', 'profile']
        for field in expected_fields:
            self.assertIn(field, data)