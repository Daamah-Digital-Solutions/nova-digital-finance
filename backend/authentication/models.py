from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import uuid
import secrets

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$')],
        blank=True
    )
    is_kyc_verified = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('under_review', 'Under Review'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    preferred_language = models.CharField(
        max_length=10,
        choices=[
            ('en', 'English'),
            ('ar', 'Arabic'),
            ('es', 'Spanish'),
            ('fr', 'French'),
        ],
        default='en'
    )
    client_number = models.CharField(max_length=20, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.client_number:
            self.client_number = f"NF{str(self.id)[:8].upper()}"
        super().save(*args, **kwargs)

class KYCDocument(models.Model):
    DOCUMENT_TYPES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID'),
        ('bank_statement', 'Bank Statement'),
        ('proof_of_address', 'Proof of Address'),
        ('income_proof', 'Income Proof'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='kyc_documents/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    is_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class PasswordResetToken(models.Model):
    """
    Model for storing password reset tokens with expiry
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()

    @classmethod
    def create_for_user(cls, user):
        # Invalidate any existing tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        # Create new token
        return cls.objects.create(user=user)

    @classmethod
    def get_valid_token(cls, token):
        try:
            reset_token = cls.objects.get(token=token, is_used=False)
            if reset_token.is_valid:
                return reset_token
        except cls.DoesNotExist:
            pass
        return None


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    occupation = models.CharField(max_length=255)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    employer_name = models.CharField(max_length=255, blank=True)
    investment_experience = models.TextField(blank=True)
    risk_tolerance = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
        ],
        default='medium'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# Signal handlers for automatic document generation
@receiver(post_save, sender=User)
def auto_generate_kyc_report(sender, instance, **kwargs):
    """
    Automatically generate KYC report when user's KYC status is approved
    """
    if instance.kyc_status == 'approved' and instance.is_kyc_verified:
        # Check if KYC report already exists
        from documents.models import Document
        existing_report = Document.objects.filter(
            user=instance,
            document_type='kyc_report'
        ).first()
        
        if not existing_report:
            try:
                from documents.services import DocumentGenerationService
                doc_service = DocumentGenerationService()
                doc_service._current_user = instance
                doc_service.generate_kyc_report(instance)
                print(f"Auto-generated KYC report for user {instance.username}")
            except Exception as e:
                print(f"Failed to auto-generate KYC report: {e}")
