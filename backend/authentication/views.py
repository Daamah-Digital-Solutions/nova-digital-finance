from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.contrib.auth.hashers import make_password
from .models import User, UserProfile, KYCDocument, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserProfileSerializer, KYCDocumentSerializer, KYCSubmissionSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        
        # Send welcome email
        try:
            send_mail(
                subject='Welcome to Nova Finance',
                message=f'Welcome {user.username}! Your account has been created successfully.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class KYCSubmissionView(generics.CreateAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.kyc_status in ['approved', 'under_review']:
            return Response({
                'error': 'KYC already submitted or approved'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Send KYC submission confirmation email
        try:
            send_mail(
                subject='KYC Submission Received - Nova Finance',
                message=f'Hello {profile.full_name}, we have received your KYC submission and it is under review.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            'message': 'KYC information submitted successfully',
            'profile': UserProfileSerializer(profile).data
        }, status=status.HTTP_201_CREATED)

class KYCDocumentUploadView(generics.CreateAPIView):
    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()

        return Response({
            'message': 'Document uploaded successfully',
            'document': KYCDocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)

class KYCDocumentListView(generics.ListAPIView):
    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KYCDocument.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def kyc_status(request):
    user = request.user
    return Response({
        'kyc_status': user.kyc_status,
        'is_kyc_verified': user.is_kyc_verified,
        'documents_count': user.kyc_documents.count(),
        'verified_documents_count': user.kyc_documents.filter(is_verified=True).count()
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """
    Request a password reset. Sends email with reset link.
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        # Generate password reset token
        reset_token = PasswordResetToken.create_for_user(user)

        # Build reset URL (frontend URL)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?token={reset_token.token}"

        # Send password reset email
        email_message = f"""
Hello {user.username},

You have requested to reset your password for your Nova Finance account.

Click the link below to reset your password:
{reset_url}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
Nova Finance Team
        """

        send_mail(
            subject='Password Reset Request - Nova Finance',
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass  # Don't reveal if user exists

    # Always return success to prevent email enumeration
    return Response({'message': 'If an account with this email exists, a password reset link has been sent.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_verify(request):
    """
    Verify if a password reset token is valid.
    """
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    reset_token = PasswordResetToken.get_valid_token(token)
    if reset_token:
        return Response({
            'valid': True,
            'email': reset_token.user.email,
            'message': 'Token is valid'
        })

    return Response({
        'valid': False,
        'message': 'Token is invalid or expired'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset with new password.
    """
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not all([token, new_password, confirm_password]):
        return Response({
            'error': 'Token, new_password, and confirm_password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({
            'error': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({
            'error': 'Password must be at least 8 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    reset_token = PasswordResetToken.get_valid_token(token)
    if not reset_token:
        return Response({
            'error': 'Token is invalid or expired'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update user password
    user = reset_token.user
    user.password = make_password(new_password)
    user.save()

    # Mark token as used
    reset_token.is_used = True
    reset_token.save()

    # Send confirmation email
    send_mail(
        subject='Password Changed Successfully - Nova Finance',
        message=f'Hello {user.username}, your password has been successfully changed. If you did not make this change, please contact support immediately.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )

    return Response({'message': 'Password has been reset successfully'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard_data(request):
    user = request.user
    return Response({
        'user': UserSerializer(user).data,
        'total_loans': user.loans.count(),
        'active_loans': user.loans.filter(status='active').count(),
        'total_borrowed': sum(loan.principal_amount_usd for loan in user.loans.all()),
        'total_paid': sum(loan.paid_amount_usd for loan in user.loans.all()),
        'next_payment_due': user.loans.filter(status='active').first().next_payment_date if user.loans.filter(status='active').exists() else None
    })
