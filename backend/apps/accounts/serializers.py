from django.db import IntegrityError
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer

from .models import CustomUser, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "phone", "date_of_birth", "address_line_1", "address_line_2",
            "city", "state", "postal_code", "country", "nationality",
            "occupation", "employer", "income_source", "monthly_income",
            "investment_purpose", "profile_picture",
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    kyc_status = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "first_name", "last_name", "client_id",
            "account_number", "is_email_verified", "mfa_enabled",
            "auth_provider", "created_at", "profile", "kyc_status",
        ]
        read_only_fields = ["id", "email", "client_id", "account_number", "created_at"]

    def get_kyc_status(self, obj):
        if hasattr(obj, "kyc_application"):
            return obj.kyc_application.status
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "profile"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class CustomRegisterSerializer(RegisterSerializer):
    username = None  # Remove username field - we use email only
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    def validate_email(self, email):
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        return data

    def save(self, request):
        try:
            user = super().save(request)
        except IntegrityError:
            raise serializers.ValidationError(
                {"email": ["A user with this email already exists."]}
            )
        user.first_name = self.cleaned_data.get("first_name")
        user.last_name = self.cleaned_data.get("last_name")
        user.save(update_fields=["first_name", "last_name"])
        UserProfile.objects.get_or_create(user=user)
        return user


class MFASetupSerializer(serializers.Serializer):
    secret = serializers.CharField(read_only=True)
    qr_code = serializers.CharField(read_only=True)


class MFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class AdminUserListSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    kyc_status = serializers.SerializerMethodField()
    active_financing_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "first_name", "last_name", "client_id",
            "account_number", "is_active", "is_email_verified",
            "mfa_enabled", "auth_provider", "created_at",
            "profile", "kyc_status", "active_financing_count",
        ]

    def get_kyc_status(self, obj):
        if hasattr(obj, "kyc_application"):
            return obj.kyc_application.status
        return None

    def get_active_financing_count(self, obj):
        return obj.financing_applications.filter(status="active").count()
