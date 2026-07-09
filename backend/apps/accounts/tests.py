import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.adapters import AccountAdapter

User = get_user_model()


class _Req:
    """Minimal stand-in for an HttpRequest carrying a user."""

    def __init__(self, user):
        self.user = user


@pytest.mark.django_db
def test_login_redirect_delivers_valid_jwt_to_frontend(settings):
    """After allauth login the account adapter must hand the SPA working tokens.

    This is the Google-OAuth regression: allauth calls the *account* adapter's
    get_login_redirect_url, so if it doesn't mint tokens the frontend lands on
    /dashboard unauthenticated and every /users/me/ call 401s.
    """
    settings.FRONTEND_URL = "https://novadf.com"
    user = User.objects.create_user(email="oauth@example.com", password="pw12345!")

    url = AccountAdapter().get_login_redirect_url(_Req(user))

    assert url.startswith("https://novadf.com/auth/callback?")
    from urllib.parse import parse_qs, urlparse

    qs = parse_qs(urlparse(url).query)
    assert "access" in qs and "refresh" in qs
    # The access token must actually validate and resolve back to this user.
    token = AccessToken(qs["access"][0])
    assert str(token["user_id"]) == str(user.id)


@pytest.mark.django_db
def test_login_redirect_falls_back_to_login_when_anonymous(settings):
    settings.FRONTEND_URL = "https://novadf.com"
    url = AccountAdapter().get_login_redirect_url(_Req(AnonymousUser()))
    assert url == "https://novadf.com/login?error=oauth_failed"
