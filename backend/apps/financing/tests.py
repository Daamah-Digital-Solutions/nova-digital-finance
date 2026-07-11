import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.financing.models import FinancingApplication, Installment
from apps.kyc.models import KYCApplication

User = get_user_model()


@pytest.fixture
def approved_user(db):
    user = User.objects.create_user(email="borrower@example.com", password="pw12345!")
    user.first_name = "Test"
    user.last_name = "Borrower"
    user.save()
    # Financing requires an approved KYC application.
    KYCApplication.objects.create(user=user, status=KYCApplication.Status.APPROVED)
    return user


@pytest.fixture
def client_for(approved_user):
    c = APIClient()
    c.force_authenticate(user=approved_user)
    return c


def test_calculator_math():
    """Public calculator returns correct 1:1 USD + fee + monthly split."""
    from apps.financing.services import FinancingService

    result = FinancingService.calculate(12000, 12, 4)
    assert result["usd_equivalent"] == "12000"
    assert result["fee_amount"] == "480.00"          # 4% of 12000
    assert result["monthly_installment"] == "1000.00"  # 12000 / 12


def test_financing_requires_approved_kyc(db):
    """A user without approved KYC cannot create a financing application."""
    u = User.objects.create_user(email="nokyc@example.com", password="pw12345!")
    c = APIClient()
    c.force_authenticate(user=u)
    resp = c.post(
        "/api/v1/financing/",
        {
            "bronova_amount": 10000,
            "repayment_period_months": 12,
            "ack_terms": True,
            "ack_fee_non_refundable": True,
            "ack_repayment_schedule": True,
            "ack_risk_disclosure": True,
        },
        format="json",
    )
    assert resp.status_code == 403


def test_full_financing_flow_to_active(client_for, approved_user):
    """Drive the whole lifecycle: create -> submit -> sign -> pay fee -> ACTIVE."""
    # 1. Create draft application.
    resp = client_for.post(
        "/api/v1/financing/",
        {
            "bronova_amount": 10000,
            "repayment_period_months": 12,
            "ack_terms": True,
            "ack_fee_non_refundable": True,
            "ack_repayment_schedule": True,
            "ack_risk_disclosure": True,
        },
        format="json",
    )
    assert resp.status_code == 201, resp.data
    app_id = resp.data["id"]

    # 2. Submit -> generates contract + certificate PDFs, creates signature
    #    requests, and moves to PENDING_SIGNATURE.
    resp = client_for.post(f"/api/v1/financing/{app_id}/submit/")
    assert resp.status_code == 200, resp.data
    assert resp.data["status"] == "pending_signature"

    # 3. Fetch and sign every pending signature request.
    resp = client_for.get("/api/v1/signatures/pending/")
    assert resp.status_code == 200
    # The list endpoint may be paginated ({"results": [...]}) or a bare list.
    rows = resp.data["results"] if isinstance(resp.data, dict) else resp.data
    sig_ids = [s["id"] for s in rows]
    assert len(sig_ids) >= 1, "submit should have created at least one signature request"

    for sig_id in sig_ids:
        # Mirror the frontend payload exactly: it sends only the typed name and
        # consent text and omits signature_image (a blank string would 400).
        r = client_for.post(
            f"/api/v1/signatures/{sig_id}/sign/",
            {
                "signature_text": "Test Borrower",
                "consent_text": "I agree and consent to sign this document.",
            },
            format="json",
        )
        assert r.status_code == 200, r.data

    # 4. All docs signed -> application auto-advances to PENDING_FEE.
    resp = client_for.get(f"/api/v1/financing/{app_id}/")
    assert resp.data["status"] == "pending_fee", resp.data

    # 5. Pay the fee (mock) -> ACTIVE.
    resp = client_for.post(f"/api/v1/financing/{app_id}/mock-pay-fee/")
    assert resp.status_code == 200, resp.data
    assert resp.data["status"] == "active"

    # 6. Installment schedule generated (one per month).
    app = FinancingApplication.objects.get(pk=app_id)
    assert app.status == FinancingApplication.Status.ACTIVE
    installments = Installment.objects.filter(financing=app)
    assert installments.count() == 12
    # Each installment is amount / months.
    assert str(installments.first().amount) == "833.33"  # 10000 / 12
