from django.contrib import admin
from .models import (
    PRNWallet, PRNTransaction, ElectronicCertificate,
    CapimaxInvestment, PRNSystemReserve
)

@admin.register(PRNWallet)
class PRNWalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'pledged_balance', 'available_balance', 'wallet_address', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'wallet_address']
    readonly_fields = ['wallet_address', 'available_balance']

@admin.register(PRNTransaction)
class PRNTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_hash', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['transaction_hash', 'reference_id']
    readonly_fields = ['transaction_hash']

@admin.register(ElectronicCertificate)
class ElectronicCertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'user', 'prn_amount', 'usd_value', 'status', 'issued_date']
    list_filter = ['status', 'issued_date', 'capimax_investment_active']
    search_fields = ['certificate_number', 'user__email']
    readonly_fields = ['certificate_number', 'usd_value']

@admin.register(CapimaxInvestment)
class CapimaxInvestmentAdmin(admin.ModelAdmin):
    list_display = ['capimax_investment_id', 'user', 'investment_amount_usd', 'current_profit_usd', 'status']
    list_filter = ['status', 'started_date', 'investment_type']
    search_fields = ['capimax_investment_id', 'user__email']

@admin.register(PRNSystemReserve)
class PRNSystemReserveAdmin(admin.ModelAdmin):
    list_display = ['total_prn_issued', 'total_usd_backing', 'backing_ratio', 'created_at']
    list_filter = ['created_at', 'last_audit_date']
    readonly_fields = ['backing_ratio']
