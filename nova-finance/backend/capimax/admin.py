from django.contrib import admin
from .models import (
    CapimaxPlatform, CapimaxAccount, CapimaxInvestment,
    CapimaxTransaction, CapimaxAPILog
)

@admin.register(CapimaxPlatform)
class CapimaxPlatformAdmin(admin.ModelAdmin):
    list_display = ['platform_name', 'is_active', 'accepts_nova_certificates', 'minimum_investment_usd', 'last_sync_at']
    list_filter = ['is_active', 'accepts_nova_certificates', 'auto_sync_enabled']
    search_fields = ['platform_name', 'api_base_url']
    readonly_fields = ['last_sync_at', 'created_at', 'updated_at']

@admin.register(CapimaxAccount)
class CapimaxAccountAdmin(admin.ModelAdmin):
    list_display = ['capimax_account_id', 'user', 'account_status', 'total_capacity_usd', 'invested_amount_usd', 'net_profit_usd']
    list_filter = ['account_status', 'platform', 'activated_at']
    search_fields = ['capimax_account_id', 'user__email', 'capimax_user_id']
    readonly_fields = ['capimax_account_id', 'net_profit_usd', 'created_at', 'updated_at']

@admin.register(CapimaxInvestment)
class CapimaxInvestmentAdmin(admin.ModelAdmin):
    list_display = ['investment_id', 'account', 'investment_type', 'investment_name', 'invested_amount_usd', 'profit_loss_usd', 'status']
    list_filter = ['investment_type', 'status', 'risk_level', 'started_at']
    search_fields = ['investment_id', 'capimax_investment_id', 'investment_name', 'account__user__email']
    readonly_fields = ['investment_id', 'profit_loss_usd', 'profit_loss_percentage', 'created_at', 'updated_at']

@admin.register(CapimaxTransaction)
class CapimaxTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'account', 'transaction_type', 'amount_usd', 'net_amount_usd', 'status', 'processed_at']
    list_filter = ['transaction_type', 'status', 'processed_at']
    search_fields = ['transaction_id', 'capimax_transaction_id', 'account__user__email']
    readonly_fields = ['transaction_id', 'net_amount_usd', 'created_at', 'updated_at']

@admin.register(CapimaxAPILog)
class CapimaxAPILogAdmin(admin.ModelAdmin):
    list_display = ['log_type', 'endpoint', 'http_method', 'status_code', 'success', 'request_at', 'response_time_ms']
    list_filter = ['log_type', 'http_method', 'success', 'status_code', 'request_at']
    search_fields = ['endpoint', 'error_message']
    readonly_fields = ['request_at', 'response_time_ms']
    
    def has_add_permission(self, request):
        return False  # API logs should only be created programmatically