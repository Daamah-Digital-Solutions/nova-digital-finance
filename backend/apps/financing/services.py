from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

from .models import FinancingApplication, Installment


class FinancingService:
    @staticmethod
    def calculate(amount, period_months, fee_percentage=None):
        if fee_percentage is None:
            fee_percentage = Decimal(str(settings.FINANCING_DEFAULT_FEE_PERCENTAGE))

        amount = Decimal(str(amount))
        fee_percentage = Decimal(str(fee_percentage))
        period_months = int(period_months)

        fee_amount = (amount * fee_percentage) / 100
        monthly_installment = amount / period_months

        return {
            "bronova_amount": str(amount),
            "usd_equivalent": str(amount),  # 1:1 with USD
            "fee_percentage": str(fee_percentage),
            "fee_amount": str(fee_amount.quantize(Decimal("0.01"))),
            "repayment_period_months": period_months,
            "monthly_installment": str(monthly_installment.quantize(Decimal("0.01"))),
            "total_repayment": str(amount),
            "total_cost": str((amount + fee_amount).quantize(Decimal("0.01"))),
        }

    @staticmethod
    def create_application(user, validated_data):
        amount = Decimal(str(validated_data["bronova_amount"]))
        period = int(validated_data["repayment_period_months"])
        fee_pct = Decimal(str(validated_data.get(
            "fee_percentage", settings.FINANCING_DEFAULT_FEE_PERCENTAGE
        )))

        fee_amount = (amount * fee_pct) / 100
        monthly_installment = amount / period

        application = FinancingApplication.objects.create(
            user=user,
            bronova_amount=amount,
            usd_equivalent=amount,
            fee_percentage=fee_pct,
            fee_amount=fee_amount.quantize(Decimal("0.01")),
            repayment_period_months=period,
            monthly_installment=monthly_installment.quantize(Decimal("0.01")),
            ack_terms=validated_data.get("ack_terms", False),
            ack_fee_non_refundable=validated_data.get("ack_fee_non_refundable", False),
            ack_repayment_schedule=validated_data.get("ack_repayment_schedule", False),
            ack_risk_disclosure=validated_data.get("ack_risk_disclosure", False),
        )

        return application

    @staticmethod
    def generate_installments(financing):
        """Generate installment schedule after approval."""
        Installment.objects.filter(financing=financing).delete()

        today = timezone.now().date()
        installments = []

        for i in range(1, financing.repayment_period_months + 1):
            due_date = today + timedelta(days=30 * i)
            installments.append(
                Installment(
                    financing=financing,
                    installment_number=i,
                    due_date=due_date,
                    amount=financing.monthly_installment,
                )
            )

        Installment.objects.bulk_create(installments)
        return installments

    @staticmethod
    def approve_application(financing, admin_user):
        allowed_statuses = [
            FinancingApplication.Status.SIGNED,
            FinancingApplication.Status.UNDER_REVIEW,
        ]
        if financing.status not in allowed_statuses:
            raise ValueError(
                f"Application cannot be approved in {financing.status} status."
            )

        financing.status = FinancingApplication.Status.APPROVED
        financing.approved_by = admin_user
        financing.approved_at = timezone.now()
        financing.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        # Generate installment schedule
        FinancingService.generate_installments(financing)

        # Activate the financing
        financing.status = FinancingApplication.Status.ACTIVE
        financing.save(update_fields=["status", "updated_at"])

        # Generate certificate and contract
        from apps.documents.services import DocumentService
        DocumentService.generate_certificate(financing)
        DocumentService.generate_contract(financing)

        # Send notification
        from apps.notifications.services import NotificationService
        NotificationService.notify(
            user=financing.user,
            title="Financing Approved",
            message=f"Your financing application {financing.application_number} has been approved. "
                    f"Your Pronova tokens ({financing.bronova_amount} PRN) are now available.",
            category="financing",
            action_url="/dashboard/financing",
        )

        return financing
