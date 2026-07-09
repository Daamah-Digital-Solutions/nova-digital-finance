import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.kyc.models import KYCApplication, KYCDocument

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="applicant@example.com", password="pw12345!")


@pytest.fixture
def admin(db):
    return User.objects.create_superuser(email="admin@example.com", password="pw12345!")


@pytest.fixture
def client_for(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _upload(client, doc_type, content_type="image/jpeg", name="id.jpg"):
    file = SimpleUploadedFile(name, b"fake-bytes", content_type=content_type)
    return client.post(
        "/api/v1/kyc/documents/",
        {"file": file, "document_type": doc_type},
        format="multipart",
    )


def test_upload_with_generic_mime_is_accepted(client_for):
    """A valid file that arrives as application/octet-stream is accepted by extension."""
    resp = _upload(client_for, "passport", content_type="application/octet-stream", name="passport.jpg")
    assert resp.status_code == 201, resp.data


def test_unsupported_extension_is_rejected(client_for):
    resp = _upload(client_for, "passport", content_type="application/octet-stream", name="passport.exe")
    assert resp.status_code == 400


def test_reupload_same_type_replaces_previous(client_for, user):
    _upload(client_for, "passport", name="first.jpg")
    _upload(client_for, "passport", name="second.jpg")
    docs = KYCDocument.objects.filter(
        kyc_application__user=user, document_type="passport"
    )
    assert docs.count() == 1
    assert docs.first().file_name == "second.jpg"


def test_submit_requires_id_and_selfie(client_for):
    _upload(client_for, "passport")
    # No selfie yet -> submission blocked.
    resp = client_for.post("/api/v1/kyc/submit/")
    assert resp.status_code == 400

    _upload(client_for, "selfie", name="selfie.jpg")
    resp = client_for.post("/api/v1/kyc/submit/")
    assert resp.status_code == 200
    assert resp.data["status"] == "submitted"


def test_admin_approve_flow(client_for, user):
    _upload(client_for, "passport")
    _upload(client_for, "selfie", name="selfie.jpg")
    client_for.post("/api/v1/kyc/submit/")

    admin_client = APIClient()
    admin_client.force_authenticate(user=User.objects.create_superuser(email="a@a.com", password="x"))
    app = KYCApplication.objects.get(user=user)
    resp = admin_client.post(f"/api/v1/admin/kyc/{app.id}/approve/")
    assert resp.status_code == 200, resp.data
    app.refresh_from_db()
    assert app.status == "approved"
    assert app.reviewed_by is not None


def test_reject_then_resubmit(client_for, user):
    _upload(client_for, "passport")
    _upload(client_for, "selfie", name="selfie.jpg")
    client_for.post("/api/v1/kyc/submit/")

    admin_client = APIClient()
    admin_client.force_authenticate(user=User.objects.create_superuser(email="a@a.com", password="x"))
    app = KYCApplication.objects.get(user=user)
    resp = admin_client.post(f"/api/v1/admin/kyc/{app.id}/reject/", {"reason": "Blurry ID"})
    assert resp.status_code == 200, resp.data
    app.refresh_from_db()
    assert app.status == "rejected"

    # Rejected applicant may replace a document and resubmit.
    _upload(client_for, "passport", name="clearer.jpg")
    resp = client_for.post("/api/v1/kyc/submit/")
    assert resp.status_code == 200, resp.data
    app.refresh_from_db()
    assert app.status == "submitted"
    assert app.rejection_reason == ""


def test_reject_requires_reason(client_for, user):
    _upload(client_for, "passport")
    _upload(client_for, "selfie", name="selfie.jpg")
    client_for.post("/api/v1/kyc/submit/")

    admin_client = APIClient()
    admin_client.force_authenticate(user=User.objects.create_superuser(email="a@a.com", password="x"))
    app = KYCApplication.objects.get(user=user)
    resp = admin_client.post(f"/api/v1/admin/kyc/{app.id}/reject/", {})
    assert resp.status_code == 400
