from rest_framework import serializers

from .models import Signature, SignatureRequest


class SignatureRequestSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True)
    document_type = serializers.CharField(source="document.document_type", read_only=True)
    document_number = serializers.CharField(source="document.document_number", read_only=True)

    class Meta:
        model = SignatureRequest
        fields = [
            "id", "document", "document_title", "document_type",
            "document_number", "status", "expires_at", "signed_at",
            "created_at",
        ]
        read_only_fields = ["id", "status", "signed_at", "created_at"]


class SignatureCreateSerializer(serializers.Serializer):
    signature_image = serializers.CharField()  # Base64 encoded image
    consent_text = serializers.CharField()
    signature_data = serializers.JSONField(required=False, default=dict)
