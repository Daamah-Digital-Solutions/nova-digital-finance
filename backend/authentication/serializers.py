from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, KYCDocument

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'phone_number', 'preferred_language', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password fields didn't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password.')

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = '__all__'
        read_only_fields = ('user', 'is_verified', 'verification_notes', 'uploaded_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['file_name'] = validated_data['file'].name
        validated_data['file_size'] = validated_data['file'].size
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    kyc_documents = KYCDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'phone_number', 'preferred_language', 
                 'is_kyc_verified', 'kyc_status', 'client_number', 'profile', 
                 'kyc_documents', 'created_at')
        read_only_fields = ('id', 'is_kyc_verified', 'kyc_status', 'client_number', 'created_at')

class KYCSubmissionSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    date_of_birth = serializers.DateField()
    nationality = serializers.CharField(max_length=100)
    address_line_1 = serializers.CharField(max_length=255)
    address_line_2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state_province = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)
    occupation = serializers.CharField(max_length=255)
    annual_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    employer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    investment_experience = serializers.CharField(required=False, allow_blank=True)
    risk_tolerance = serializers.ChoiceField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])

    def create(self, validated_data):
        user = self.context['request'].user
        profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults=validated_data
        )
        
        user.kyc_status = 'under_review'
        user.save()
        
        return profile