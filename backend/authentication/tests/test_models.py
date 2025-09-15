import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from authentication.models import KYCDocument, UserProfile

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    def test_user_creation(self):
        """Test user creation with valid data"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertIsInstance(user.id, uuid.UUID)
    
    def test_user_string_representation(self):
        """Test user __str__ method"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'testuser')
    
    def test_unique_email_constraint(self):
        """Test that email must be unique"""
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='testuser2',
                email='test@example.com',  # Same email
                password='testpass123'
            )
    
    def test_unique_username_constraint(self):
        """Test that username must be unique"""
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='testuser',  # Same username
                email='test2@example.com',
                password='testpass123'
            )
    
    def test_user_full_name_property(self):
        """Test full_name property"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.full_name, 'Test User')
        
        # Test with empty names
        user.first_name = ''
        user.last_name = ''
        self.assertEqual(user.full_name, 'testuser')
    
    def test_kyc_status_default(self):
        """Test default KYC status"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.kyc_status, 'pending')
    
    def test_client_number_generation(self):
        """Test client number is generated"""
        user = User.objects.create_user(**self.user_data)
        self.assertTrue(user.client_number)
        self.assertTrue(user.client_number.startswith('NF'))
    
    def test_superuser_creation(self):
        """Test superuser creation"""
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)


class KYCDocumentModelTest(TestCase):
    """Test cases for KYCDocument model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_kyc_document_creation(self):
        """Test KYC document creation"""
        document = KYCDocument.objects.create(
            user=self.user,
            document_type='identity_card',
            document_number='ID123456789',
            file_path='/path/to/document.pdf'
        )
        
        self.assertEqual(document.user, self.user)
        self.assertEqual(document.document_type, 'identity_card')
        self.assertEqual(document.document_number, 'ID123456789')
        self.assertEqual(document.status, 'pending')
        self.assertIsInstance(document.id, uuid.UUID)
    
    def test_kyc_document_string_representation(self):
        """Test KYC document __str__ method"""
        document = KYCDocument.objects.create(
            user=self.user,
            document_type='passport',
            document_number='P123456789'
        )
        
        expected_str = f"testuser - passport - pending"
        self.assertEqual(str(document), expected_str)
    
    def test_kyc_document_choices(self):
        """Test valid document type choices"""
        valid_types = [
            'identity_card', 'passport', 'driver_license', 
            'utility_bill', 'bank_statement', 'other'
        ]
        
        for doc_type in valid_types:
            document = KYCDocument.objects.create(
                user=self.user,
                document_type=doc_type,
                document_number=f'DOC{doc_type}'
            )
            self.assertEqual(document.document_type, doc_type)
    
    def test_kyc_status_choices(self):
        """Test valid status choices"""
        valid_statuses = ['pending', 'approved', 'rejected', 'expired']
        
        document = KYCDocument.objects.create(
            user=self.user,
            document_type='identity_card',
            document_number='ID123456789'
        )
        
        for status in valid_statuses:
            document.status = status
            document.save()
            document.refresh_from_db()
            self.assertEqual(document.status, status)


class UserProfileModelTest(TestCase):
    """Test cases for UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_profile_creation(self):
        """Test user profile creation"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890',
            date_of_birth='1990-01-01',
            nationality='US',
            address='123 Test St',
            city='Test City',
            country='United States',
            postal_code='12345'
        )
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.phone_number, '+1234567890')
        self.assertEqual(str(profile.date_of_birth), '1990-01-01')
        self.assertEqual(profile.nationality, 'US')
        self.assertEqual(profile.address, '123 Test St')
        self.assertEqual(profile.city, 'Test City')
        self.assertEqual(profile.country, 'United States')
        self.assertEqual(profile.postal_code, '12345')
    
    def test_user_profile_string_representation(self):
        """Test user profile __str__ method"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890'
        )
        
        expected_str = f"Profile for testuser"
        self.assertEqual(str(profile), expected_str)
    
    def test_one_to_one_relationship(self):
        """Test one-to-one relationship with User"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890'
        )
        
        # Test accessing profile from user
        self.assertEqual(self.user.userprofile, profile)
        
        # Test that creating another profile for same user fails
        with self.assertRaises(IntegrityError):
            UserProfile.objects.create(
                user=self.user,
                phone_number='+9876543210'
            )
    
    def test_optional_fields(self):
        """Test that optional fields can be blank"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890'
            # All other fields are optional
        )
        
        self.assertTrue(profile.id)
        self.assertEqual(profile.occupation, '')
        self.assertEqual(profile.annual_income, '')
    
    def test_profile_complete_property(self):
        """Test is_complete property"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+1234567890'
        )
        
        # Profile should not be complete with minimal data
        self.assertFalse(profile.is_complete)
        
        # Complete the profile
        profile.date_of_birth = '1990-01-01'
        profile.nationality = 'US'
        profile.address = '123 Test St'
        profile.city = 'Test City'
        profile.country = 'United States'
        profile.save()
        
        # Now profile should be complete
        self.assertTrue(profile.is_complete)