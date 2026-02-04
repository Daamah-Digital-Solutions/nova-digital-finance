from rest_framework import serializers

from .models import Payment, ScheduledPayment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "financing", "installment", "payment_type",
            "payment_method", "amount", "currency", "status",
            "transaction_reference", "stripe_session_id",
            "nowpayments_payment_id", "crypto_address",
            "crypto_amount", "crypto_currency", "description",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "transaction_reference",
            "stripe_session_id", "stripe_payment_intent_id",
            "nowpayments_payment_id", "crypto_address",
            "crypto_amount", "crypto_currency",
            "created_at", "updated_at",
        ]


class StripeCheckoutSerializer(serializers.Serializer):
    financing_id = serializers.UUIDField()
    payment_type = serializers.ChoiceField(choices=Payment.PaymentType.choices)
    installment_id = serializers.UUIDField(required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()


class CryptoPaymentCreateSerializer(serializers.Serializer):
    financing_id = serializers.UUIDField()
    payment_type = serializers.ChoiceField(choices=Payment.PaymentType.choices)
    installment_id = serializers.UUIDField(required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    crypto_currency = serializers.CharField(max_length=20, default="btc")


class ScheduledPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledPayment
        fields = [
            "id", "installment", "scheduled_date", "payment_method",
            "is_processed", "processed_at", "created_at",
        ]
        read_only_fields = ["id", "is_processed", "processed_at", "created_at"]


class ScheduledPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledPayment
        fields = ["installment", "scheduled_date", "payment_method"]

    def validate_installment(self, value):
        if value.financing.user != self.context["request"].user:
            raise serializers.ValidationError("Installment not found.")
        return value


class AdminPaymentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_client_id = serializers.CharField(source="user.client_id", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "user", "user_email", "user_client_id", "financing",
            "installment", "payment_type", "payment_method", "amount",
            "currency", "status", "transaction_reference",
            "stripe_session_id", "stripe_payment_intent_id",
            "nowpayments_payment_id", "description", "metadata",
            "created_at", "updated_at",
        ]
