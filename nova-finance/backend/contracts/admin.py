from django.contrib import admin
from .models import (
    ContractTemplate, TripartiteContract, ElectronicSignature,
    ContractAmendment, ContractNotification
)

@admin.register(ContractTemplate)
class ContractTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'contract_type', 'language', 'version', 'is_active']
    list_filter = ['contract_type', 'language', 'is_active', 'requires_signature']
    search_fields = ['name', 'contract_type']

@admin.register(TripartiteContract)
class TripartiteContractAdmin(admin.ModelAdmin):
    list_display = ['contract_number', 'client', 'usd_value', 'status', 'capimax_authorized', 'created_at']
    list_filter = ['status', 'capimax_authorized', 'created_at']
    search_fields = ['contract_number', 'client__email']
    readonly_fields = ['contract_number', 'created_at']

@admin.register(ElectronicSignature)
class ElectronicSignatureAdmin(admin.ModelAdmin):
    list_display = ['contract', 'signer', 'signer_role', 'signature_type', 'is_verified', 'signed_at']
    list_filter = ['signature_type', 'is_verified', 'signer_role', 'signed_at']
    search_fields = ['contract__contract_number', 'signer__email']

@admin.register(ContractAmendment)
class ContractAmendmentAdmin(admin.ModelAdmin):
    list_display = ['amendment_number', 'original_contract', 'amendment_type', 'approved_by_nova', 'approved_by_client']
    list_filter = ['amendment_type', 'approved_by_nova', 'approved_by_client', 'requested_date']
    search_fields = ['amendment_number', 'original_contract__contract_number']

@admin.register(ContractNotification)
class ContractNotificationAdmin(admin.ModelAdmin):
    list_display = ['contract', 'recipient', 'notification_type', 'action_required', 'sent_at', 'read_at']
    list_filter = ['notification_type', 'action_required', 'email_sent', 'action_completed']
    search_fields = ['contract__contract_number', 'recipient__email', 'title']
