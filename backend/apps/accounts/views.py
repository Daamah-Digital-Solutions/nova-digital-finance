import base64
import io
import urllib.parse

import pyotp
import qrcode
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.http import HttpResponseRedirect
from django.views import View
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from common.permissions import IsAdminUser

from .models import CustomUser, UserProfile
from .serializers import (
    AdminUserListSerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordChangeSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
)


class UserMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserDetailSerializer

    def get_object(self):
        return self.request.user


class MFASetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        user.save(update_fields=["mfa_secret"])

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="Nova Digital Finance")

        img = qrcode.make(uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_base64}",
        })


class MFAEnableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.mfa_secret:
            return Response(
                {"error": "MFA not set up. Call setup endpoint first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(serializer.validated_data["code"]):
            user.mfa_enabled = True
            user.save(update_fields=["mfa_enabled"])
            return Response({"message": "MFA enabled successfully."})

        return Response(
            {"error": "Invalid verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class MFAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Invalid credentials."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.mfa_enabled or not user.mfa_secret:
            return Response(
                {"error": "MFA is not enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(serializer.validated_data["code"]):
            return Response({"verified": True})

        return Response(
            {"error": "Invalid verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class MFADisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.mfa_enabled:
            return Response(
                {"error": "MFA is not enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(serializer.validated_data["code"]):
            user.mfa_enabled = False
            user.mfa_secret = ""
            user.save(update_fields=["mfa_enabled", "mfa_secret"])
            return Response({"message": "MFA disabled successfully."})

        return Response(
            {"error": "Invalid verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"message": "Password changed successfully."})


# Admin views
class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from apps.financing.models import FinancingApplication
        from apps.payments.models import Payment
        from apps.kyc.models import KYCApplication
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        data = {
            "total_clients": CustomUser.objects.filter(is_staff=False).count(),
            "new_clients_this_month": CustomUser.objects.filter(
                is_staff=False, created_at__gte=month_start
            ).count(),
            "pending_kyc": KYCApplication.objects.filter(status="submitted").count(),
            "active_financing": FinancingApplication.objects.filter(status="active").count(),
            "pending_applications": FinancingApplication.objects.filter(
                status__in=["pending_fee", "fee_paid", "pending_signature", "signed", "under_review"]
            ).count(),
            "total_disbursed": FinancingApplication.objects.filter(
                status__in=["active", "completed"]
            ).aggregate(total=Sum("bronova_amount"))["total"] or 0,
            "payments_this_month": Payment.objects.filter(
                status="completed", created_at__gte=month_start
            ).aggregate(total=Sum("amount"))["total"] or 0,
            "total_revenue": Payment.objects.filter(
                status="completed", payment_type="fee"
            ).aggregate(total=Sum("amount"))["total"] or 0,
        }
        return Response(data)


class AdminClientListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserListSerializer
    filterset_fields = ["is_active", "is_email_verified", "mfa_enabled"]
    search_fields = ["email", "first_name", "last_name", "client_id"]

    def get_queryset(self):
        return CustomUser.objects.filter(is_staff=False).select_related("profile")


class AdminClientDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserListSerializer
    queryset = CustomUser.objects.filter(is_staff=False).select_related("profile")


# Google OAuth Views
class GoogleLogin(SocialLoginView):
    """
    Google OAuth2 login endpoint.
    Frontend should redirect to /accounts/google/login/ for OAuth flow,
    or POST access_token here for token-based login.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.GOOGLE_OAUTH_CALLBACK_URL if hasattr(settings, 'GOOGLE_OAUTH_CALLBACK_URL') else "http://localhost:3001/auth/callback"
    client_class = OAuth2Client


class GoogleOAuthCallbackView(View):
    """
    Handle the OAuth callback from Google (via allauth).
    This view generates JWT tokens and redirects to the frontend.
    """
    def get(self, request):
        # After allauth handles the callback, the user should be authenticated
        user = request.user
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')

        if user.is_authenticated:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Redirect to frontend with tokens
            params = urllib.parse.urlencode({
                'access': access_token,
                'refresh': refresh_token,
            })
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?{params}")
        else:
            # Authentication failed
            return HttpResponseRedirect(f"{frontend_url}/login?error=oauth_failed")
