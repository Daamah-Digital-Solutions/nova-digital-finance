import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"
        FACEBOOK = "facebook", "Facebook"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True)
    client_id = models.CharField(max_length=20, unique=True, blank=True)
    account_number = models.CharField(max_length=30, unique=True, blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=AuthProvider.choices,
        default=AuthProvider.EMAIL,
    )
    is_email_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = self._generate_client_id()
        if not self.account_number:
            self.account_number = self._generate_account_number()
        super().save(*args, **kwargs)

    def _generate_client_id(self):
        last = CustomUser.objects.order_by("-created_at").values_list("client_id", flat=True).first()
        if last and last.startswith("NDF-"):
            try:
                num = int(last.split("-")[1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1
        return f"NDF-{num:06d}"

    def _generate_account_number(self):
        import secrets
        return f"NDF{secrets.token_hex(6).upper()}"


class UserProfile(models.Model):
    class IncomeSource(models.TextChoices):
        EMPLOYMENT = "employment", "Employment"
        BUSINESS = "business", "Business"
        INVESTMENT = "investment", "Investment"
        OTHER = "other", "Other"

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    employer = models.CharField(max_length=200, blank=True)
    income_source = models.CharField(
        max_length=20,
        choices=IncomeSource.choices,
        blank=True,
    )
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    investment_purpose = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"
