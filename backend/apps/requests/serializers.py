from rest_framework import serializers

from .models import ClientRequest


class ClientRequestSerializer(serializers.ModelSerializer):
    # Make details optional - it's a JSONField with a default
    details = serializers.JSONField(required=False, default=dict)
    # Also return financing application number for display
    financing_application_number = serializers.CharField(
        source="financing.application_number", read_only=True, allow_null=True
    )

    class Meta:
        model = ClientRequest
        fields = [
            "id", "financing", "financing_application_number", "request_type",
            "status", "subject", "details", "description", "admin_response",
            "reviewed_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "admin_response", "reviewed_at",
            "created_at", "updated_at",
        ]

    def validate_financing(self, value):
        user = self.context["request"].user
        if value and value.user != user:
            raise serializers.ValidationError("Financing application not found.")
        return value


class AdminClientRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_client_id = serializers.CharField(source="user.client_id", read_only=True)

    class Meta:
        model = ClientRequest
        fields = [
            "id", "user", "user_email", "user_client_id", "financing",
            "request_type", "status", "subject", "details", "description",
            "admin_response", "reviewed_by", "reviewed_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
