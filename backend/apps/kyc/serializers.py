from rest_framework import serializers

from apps.accounts.serializers import UserDetailSerializer
from apps.kyc.models import KYCApplication, KYCDocument


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = [
            "id",
            "kyc_application",
            "document_type",
            "file",
            "file_name",
            "file_size",
            "is_verified",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "kyc_application", "is_verified", "notes", "created_at", "updated_at"]

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 10 MB.")
        allowed_types = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        ]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: PDF, JPEG, PNG, WebP."
            )
        return value


class KYCApplicationSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "user",
            "status",
            "submitted_at",
            "reviewed_at",
            "pdf_summary",
            "created_at",
            "updated_at",
            "documents",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "submitted_at",
            "reviewed_at",
            "pdf_summary",
            "created_at",
            "updated_at",
        ]


class KYCApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating a KYC application (user-writable fields)."""

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "user",
            "status",
            "submitted_at",
            "pdf_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "submitted_at",
            "created_at",
            "updated_at",
        ]


class KYCSubmitSerializer(serializers.Serializer):
    """Validates that the KYC application has the minimum required documents before submission."""

    REQUIRED_DOCUMENT_TYPES = [
        KYCDocument.DocumentType.PASSPORT,
        KYCDocument.DocumentType.ADDRESS_PROOF,
        KYCDocument.DocumentType.SELFIE,
    ]

    def validate(self, attrs):
        kyc_application = self.context.get("kyc_application")
        if not kyc_application:
            raise serializers.ValidationError("KYC application not found.")

        if kyc_application.status != KYCApplication.Status.DRAFT:
            raise serializers.ValidationError(
                f"KYC application cannot be submitted. Current status: {kyc_application.status}."
            )

        uploaded_types = set(
            kyc_application.documents.values_list("document_type", flat=True)
        )
        missing = []
        for doc_type in self.REQUIRED_DOCUMENT_TYPES:
            if doc_type not in uploaded_types:
                missing.append(doc_type.label)

        if missing:
            raise serializers.ValidationError(
                f"Missing required documents: {', '.join(missing)}."
            )

        return attrs


class AdminKYCSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)
    user = UserDetailSerializer(read_only=True)
    reviewed_by_email = serializers.EmailField(source="reviewed_by.email", read_only=True)

    class Meta:
        model = KYCApplication
        fields = [
            "id",
            "user",
            "status",
            "rejection_reason",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "submitted_at",
            "pdf_summary",
            "created_at",
            "updated_at",
            "documents",
        ]
        read_only_fields = [
            "id",
            "user",
            "submitted_at",
            "reviewed_by_email",
            "created_at",
            "updated_at",
        ]

    def validate_status(self, value):
        allowed_transitions = {
            KYCApplication.Status.SUBMITTED: [
                KYCApplication.Status.UNDER_REVIEW,
                KYCApplication.Status.REJECTED,
            ],
            KYCApplication.Status.UNDER_REVIEW: [
                KYCApplication.Status.APPROVED,
                KYCApplication.Status.REJECTED,
            ],
        }
        current_status = self.instance.status if self.instance else None
        valid_next = allowed_transitions.get(current_status, [])
        if value not in valid_next:
            raise serializers.ValidationError(
                f"Cannot transition from '{current_status}' to '{value}'."
            )
        return value

    def validate(self, attrs):
        status = attrs.get("status")
        if status == KYCApplication.Status.REJECTED and not attrs.get("rejection_reason"):
            if self.instance and not self.instance.rejection_reason:
                raise serializers.ValidationError(
                    {"rejection_reason": "A rejection reason is required when rejecting a KYC application."}
                )
        return attrs
