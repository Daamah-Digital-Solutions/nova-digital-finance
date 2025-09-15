from rest_framework import serializers
from .models import Document, DocumentTemplate, ElectronicSignature, DocumentAccess, DocumentShare
from authentication.serializers import UserSerializer


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'name', 'template_type', 'version', 'is_active', 'created_at']


class DocumentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    template_used = DocumentTemplateSerializer(read_only=True)
    download_url = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'user', 'loan_application', 'loan', 'payment',
            'document_type', 'document_type_display', 'title', 'document_number',
            'template_used', 'generated_data', 'status', 'status_display',
            'is_public', 'download_url', 'digital_signature', 'signature_timestamp',
            'email_sent', 'email_sent_at', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'document_number', 'generated_data', 'digital_signature',
            'signature_timestamp', 'email_sent', 'email_sent_at', 'created_at', 'updated_at'
        ]

    def get_download_url(self, obj):
        return obj.get_download_url()


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['document_type', 'title', 'loan_application', 'loan', 'payment']

    def validate(self, data):
        # Ensure at least one reference is provided
        references = [data.get('loan_application'), data.get('loan'), data.get('payment')]
        if not any(references):
            raise serializers.ValidationError(
                "At least one of loan_application, loan, or payment must be specified."
            )
        return data


class ElectronicSignatureSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)
    signature_type_display = serializers.CharField(source='get_signature_type_display', read_only=True)
    
    class Meta:
        model = ElectronicSignature
        fields = [
            'id', 'document', 'user', 'signature_type', 'signature_type_display',
            'signature_method', 'ip_address', 'user_agent', 'geolocation',
            'signed_at', 'is_valid'
        ]
        read_only_fields = [
            'id', 'verification_hash', 'certificate_data', 'signed_at', 'is_valid'
        ]


class SignDocumentSerializer(serializers.Serializer):
    signature_data = serializers.CharField()
    signature_method = serializers.ChoiceField(
        choices=['canvas', 'typed', 'uploaded'],
        default='canvas'
    )
    ip_address = serializers.IPAddressField(required=False)
    user_agent = serializers.CharField(required=False, allow_blank=True)


class DocumentAccessSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)
    access_type_display = serializers.CharField(source='get_access_type_display', read_only=True)
    
    class Meta:
        model = DocumentAccess
        fields = [
            'id', 'document', 'user', 'access_type', 'access_type_display',
            'ip_address', 'user_agent', 'session_id', 'referrer', 'accessed_at'
        ]


class DocumentShareSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    shared_by = UserSerializer(read_only=True)
    share_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentShare
        fields = [
            'id', 'document', 'shared_by', 'share_token', 'shared_with_email',
            'can_download', 'password_protected', 'access_count', 'max_access_count',
            'share_url', 'expires_at', 'created_at', 'is_active'
        ]
        read_only_fields = ['id', 'share_token', 'access_count', 'created_at']

    def get_share_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/documents/shared/{obj.share_token}/')
        return f'/api/documents/shared/{obj.share_token}/'


class CreateDocumentShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentShare
        fields = [
            'shared_with_email', 'can_download', 'password_protected',
            'max_access_count', 'expires_at'
        ]

    def validate_expires_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value