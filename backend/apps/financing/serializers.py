from rest_framework import serializers

from .models import FinancingApplication, Installment


class InstallmentSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Installment
        fields = [
            "id", "installment_number", "due_date", "amount",
            "paid_amount", "remaining_amount", "status", "paid_at",
            "deferred_to", "created_at",
        ]
        read_only_fields = ["id", "paid_amount", "paid_at", "created_at"]


class FinancingApplicationSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    total_repayment = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_with_fee = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = FinancingApplication
        fields = [
            "id", "application_number", "user_email", "user_name",
            "bronova_amount", "usd_equivalent", "fee_percentage",
            "fee_amount", "repayment_period_months", "monthly_installment",
            "status", "total_repayment", "total_with_fee",
            "ack_terms", "ack_fee_non_refundable", "ack_repayment_schedule",
            "ack_risk_disclosure", "notes", "created_at", "updated_at",
            "approved_at", "installments",
        ]
        read_only_fields = [
            "id", "application_number", "fee_amount", "monthly_installment",
            "status", "approved_at", "created_at", "updated_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class FinancingApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancingApplication
        fields = [
            "bronova_amount", "usd_equivalent", "fee_percentage",
            "repayment_period_months", "ack_terms", "ack_fee_non_refundable",
            "ack_repayment_schedule", "ack_risk_disclosure",
        ]

    def validate_bronova_amount(self, value):
        from django.conf import settings
        if value < settings.FINANCING_MIN_AMOUNT:
            raise serializers.ValidationError(
                f"Minimum amount is {settings.FINANCING_MIN_AMOUNT} PRN."
            )
        if value > settings.FINANCING_MAX_AMOUNT:
            raise serializers.ValidationError(
                f"Maximum amount is {settings.FINANCING_MAX_AMOUNT} PRN."
            )
        return value

    def validate_repayment_period_months(self, value):
        from django.conf import settings
        if value < settings.FINANCING_MIN_PERIOD_MONTHS:
            raise serializers.ValidationError(
                f"Minimum period is {settings.FINANCING_MIN_PERIOD_MONTHS} months."
            )
        if value > settings.FINANCING_MAX_PERIOD_MONTHS:
            raise serializers.ValidationError(
                f"Maximum period is {settings.FINANCING_MAX_PERIOD_MONTHS} months."
            )
        return value

    def validate_fee_percentage(self, value):
        from django.conf import settings
        if value < settings.FINANCING_FEE_PERCENTAGE_MIN:
            raise serializers.ValidationError(
                f"Minimum fee is {settings.FINANCING_FEE_PERCENTAGE_MIN}%."
            )
        if value > settings.FINANCING_FEE_PERCENTAGE_MAX:
            raise serializers.ValidationError(
                f"Maximum fee is {settings.FINANCING_FEE_PERCENTAGE_MAX}%."
            )
        return value

    def create(self, validated_data):
        from apps.financing.services import FinancingService
        user = self.context["request"].user
        return FinancingService.create_application(user, validated_data)


class FinancingCalculatorSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    period = serializers.IntegerField(min_value=6, max_value=36)
    fee_percentage = serializers.DecimalField(
        max_digits=4, decimal_places=2, required=False
    )


class FinancingSubmitSerializer(serializers.Serializer):
    def validate(self, attrs):
        financing = self.context["financing"]
        if financing.status != FinancingApplication.Status.DRAFT:
            raise serializers.ValidationError("Application is not in draft status.")
        if not all([
            financing.ack_terms,
            financing.ack_fee_non_refundable,
            financing.ack_repayment_schedule,
            financing.ack_risk_disclosure,
        ]):
            raise serializers.ValidationError("All acknowledgments must be accepted.")
        return attrs


class AdminFinancingSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    user_client_id = serializers.CharField(source="user.client_id", read_only=True)

    class Meta:
        model = FinancingApplication
        fields = [
            "id", "application_number", "user", "user_email", "user_name",
            "user_client_id", "bronova_amount", "usd_equivalent",
            "fee_percentage", "fee_amount", "repayment_period_months",
            "monthly_installment", "status", "ack_terms",
            "ack_fee_non_refundable", "ack_repayment_schedule",
            "ack_risk_disclosure", "approved_by", "approved_at",
            "rejection_reason", "notes", "created_at", "updated_at",
            "installments",
        ]
        read_only_fields = [
            "id", "application_number", "user", "bronova_amount",
            "usd_equivalent", "fee_percentage", "fee_amount",
            "repayment_period_months", "monthly_installment",
            "created_at", "updated_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
