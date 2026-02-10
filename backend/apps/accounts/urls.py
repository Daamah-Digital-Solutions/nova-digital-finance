from django.urls import path
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("mfa/setup/", views.MFASetupView.as_view(), name="mfa-setup"),
    path("mfa/enable/", views.MFAEnableView.as_view(), name="mfa-enable"),
    path("mfa/verify/", views.MFAVerifyView.as_view(), name="mfa-verify"),
    path("mfa/disable/", views.MFADisableView.as_view(), name="mfa-disable"),
    # Google OAuth
    path("google/", views.GoogleLogin.as_view(), name="google-login"),
    path("google/callback/", views.GoogleOAuthCallbackView.as_view(), name="google-callback"),
]
