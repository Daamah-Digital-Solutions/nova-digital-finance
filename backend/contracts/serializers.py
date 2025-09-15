from rest_framework import serializers
from django.utils import timezone
from .models import (
    ContractTemplate, TripartiteContract, ElectronicSignature,
    ContractAmendment, ContractNotification
)

class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractTemplate
        fields = [
            'id', 'name', 'contract_type', 'language', 'version',
            'template_content', 'legal_text', 'is_active', 'requires_signature',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

class ElectronicSignatureSerializer(serializers.ModelSerializer):
    signer_email = serializers.CharField(source='signer.email', read_only=True)
    signer_name = serializers.CharField(source='signer.get_full_name', read_only=True)
    
    class Meta:
        model = ElectronicSignature
        fields = [
            'id', 'signer_email', 'signer_name', 'signer_role', 'signature_type',
            'is_verified', 'verification_method', 'signed_at', 'verified_at'
        ]
        read_only_fields = ['id', 'signed_at', 'verified_at']

class TripartiteContractSerializer(serializers.ModelSerializer):
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    certificate_number = serializers.CharField(source='certificate.certificate_number', read_only=True)
    loan_id = serializers.CharField(source='loan_application.id', read_only=True)
    signatures = ElectronicSignatureSerializer(many=True, read_only=True)
    
    # Status display fields
    is_ready_for_client_signature = serializers.SerializerMethodField()
    is_fully_executed = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = TripartiteContract
        fields = [
            'id', 'contract_number', 'client_email', 'client_name',
            'certificate_number', 'loan_id', 'prn_amount', 'usd_value',
            'loan_duration_months', 'monthly_payment_usd', 'status',
            'nova_signature_date', 'client_signature_date', 'effective_date',
            'expiry_date', 'pdf_generated', 'pdf_file_path',
            'capimax_authorized', 'capimax_authorization_date',
            'is_ready_for_client_signature', 'is_fully_executed',
            'days_until_expiry', 'signatures', 'created_at'
        ]
        read_only_fields = [
            'id', 'contract_number', 'nova_signature_date', 'client_signature_date',
            'effective_date', 'pdf_generated', 'pdf_file_path', 'created_at'
        ]
    
    def get_is_ready_for_client_signature(self, obj):
        return obj.status in ['pending_signatures', 'nova_signed']
    
    def get_is_fully_executed(self, obj):
        return obj.status == 'fully_executed'
    
    def get_days_until_expiry(self, obj):
        if obj.expiry_date:
            delta = obj.expiry_date.date() - timezone.now().date()
            return delta.days
        return None

class ContractAmendmentSerializer(serializers.ModelSerializer):
    contract_number = serializers.CharField(source='original_contract.contract_number', read_only=True)
    requested_by_email = serializers.CharField(source='requested_by.email', read_only=True)
    
    class Meta:
        model = ContractAmendment
        fields = [
            'id', 'amendment_number', 'contract_number', 'amendment_type',
            'description', 'changes_summary', 'legal_justification',
            'requested_by_email', 'approved_by_nova', 'approved_by_client',
            'requested_date', 'approved_date', 'effective_date',
            'pdf_generated', 'pdf_file_path'
        ]
        read_only_fields = [
            'id', 'amendment_number', 'requested_by_email', 'requested_date',
            'approved_date', 'effective_date', 'pdf_generated', 'pdf_file_path'
        ]

class ContractNotificationSerializer(serializers.ModelSerializer):
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True)
    recipient_email = serializers.CharField(source='recipient.email', read_only=True)
    
    class Meta:
        model = ContractNotification
        fields = [
            'id', 'contract_number', 'recipient_email', 'notification_type',
            'title', 'message', 'sent_at', 'read_at', 'email_sent',
            'action_required', 'action_url', 'action_completed'
        ]
        read_only_fields = ['id', 'sent_at']

class SignatureRequestSerializer(serializers.Serializer):
    """
    Serializer for initiating signature requests
    """
    signature_type = serializers.ChoiceField(
        choices=ElectronicSignature.SIGNATURE_TYPES,
        default='click_to_sign'
    )
    
class SignatureCompletionSerializer(serializers.Serializer):
    """
    Serializer for completing signatures
    """
    signature_data = serializers.CharField(max_length=10000)  # Base64 signature or confirmation
    verification_method = serializers.CharField(max_length=50, default='email')
    
    def validate_signature_data(self, value):
        if not value or value.strip() == '':
            raise serializers.ValidationError("Signature data is required")
        return value

class ContractSummarySerializer(serializers.ModelSerializer):
    """
    Simplified serializer for contract listings
    """
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TripartiteContract
        fields = [
            'id', 'contract_number', 'client_name', 'usd_value',
            'status', 'status_display', 'effective_date', 'expiry_date',
            'capimax_authorized', 'created_at'
        ]