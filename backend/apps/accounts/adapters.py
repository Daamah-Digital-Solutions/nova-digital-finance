import urllib.parse

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken


class AccountAdapter(DefaultAccountAdapter):
    """Custom account adapter for allauth."""

    def get_login_redirect_url(self, request):
        """Redirect to frontend after login."""
        return getattr(settings, 'FRONTEND_URL', 'http://localhost:3001') + '/dashboard'

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Generate email confirmation URL that goes through backend API,
        which will verify the token and redirect to frontend.
        """
        # Use the backend URL for confirmation (keeps allauth's flow intact)
        # The backend will redirect to frontend after verification
        from django.urls import reverse
        url = reverse('account_confirm_email', args=[emailconfirmation.key])
        return request.build_absolute_uri(url) if request else f"https://novadf.com/api/v1/auth{url}"

    def send_mail(self, template_prefix, email, context):
        """
        Override to add custom context variables to emails.
        """
        # Add frontend URL to context
        context['frontend_url'] = getattr(settings, 'FRONTEND_URL', 'https://novadf.com')
        context['site_name'] = 'Nova Digital Finance'
        super().send_mail(template_prefix, email, context)


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom social account adapter for OAuth login."""

    def get_login_redirect_url(self, request):
        """
        After social login, redirect to frontend with JWT tokens.
        """
        user = request.user
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')

        if user.is_authenticated:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Mark user as coming from social auth
            user.auth_provider = 'google'
            user.is_email_verified = True
            user.save(update_fields=['auth_provider', 'is_email_verified'])

            # Redirect to frontend with tokens
            params = urllib.parse.urlencode({
                'access': access_token,
                'refresh': refresh_token,
            })
            return f"{frontend_url}/auth/callback?{params}"

        return f"{frontend_url}/login?error=oauth_failed"

    def pre_social_login(self, request, sociallogin):
        """
        Called after a social account is authenticated but before login.
        Link social account to existing user with same email if exists.
        """
        # If user is already logged in, just return
        if sociallogin.is_existing:
            return

        # Check if user with this email already exists
        email = sociallogin.account.extra_data.get('email')
        if email:
            from .models import CustomUser
            try:
                user = CustomUser.objects.get(email=email)
                # Connect the social account to existing user
                sociallogin.connect(request, user)
            except CustomUser.DoesNotExist:
                pass

    def populate_user(self, request, sociallogin, data):
        """
        Populate user data from social account.
        """
        user = super().populate_user(request, sociallogin, data)
        user.is_email_verified = True
        user.auth_provider = 'google'
        return user
