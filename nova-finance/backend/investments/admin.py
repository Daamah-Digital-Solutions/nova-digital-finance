from django.contrib import admin
from .models import (
    InvestmentPlatform, UserInvestmentAccount, InvestmentPosition,
    InvestmentTransaction, CapimaxIntegration, InvestmentAlert
)

@admin.register(InvestmentPlatform)
class InvestmentPlatformAdmin(admin.ModelAdmin):
    list_display = ['name', 'platform_type', 'status', 'is_verified', 'created_at']
    list_filter = ['platform_type', 'status', 'is_verified']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserInvestmentAccount)
class UserInvestmentAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'verification_status', 'balance_usd', 'is_active', 'created_at']
    list_filter = ['platform', 'verification_status', 'is_active']
    search_fields = ['user__username', 'platform__name', 'platform_user_id']

@admin.register(InvestmentPosition)
class InvestmentPositionAdmin(admin.ModelAdmin):
    list_display = ['account', 'asset_symbol', 'position_type', 'status', 'investment_amount_usd', 'current_value_usd', 'opened_at']
    list_filter = ['position_type', 'status', 'account__platform']
    search_fields = ['asset_symbol', 'asset_name', 'position_id']
    date_hierarchy = 'opened_at'

@admin.register(InvestmentTransaction)
class InvestmentTransactionAdmin(admin.ModelAdmin):
    list_display = ['account', 'transaction_type', 'status', 'amount_usd', 'asset_symbol', 'executed_at']
    list_filter = ['transaction_type', 'status', 'account__platform']
    search_fields = ['transaction_id', 'asset_symbol', 'account__user__username']
    date_hierarchy = 'executed_at'

@admin.register(CapimaxIntegration)
class CapimaxIntegrationAdmin(admin.ModelAdmin):
    list_display = ['user', 'capimax_user_id', 'preferred_strategy', 'auto_invest_enabled', 'is_active', 'created_at']
    list_filter = ['preferred_strategy', 'auto_invest_enabled', 'is_active']
    search_fields = ['user__username', 'capimax_user_id']

@admin.register(InvestmentAlert)
class InvestmentAlertAdmin(admin.ModelAdmin):
    list_display = ['user', 'alert_type', 'priority', 'title', 'is_read', 'triggered_at']
    list_filter = ['alert_type', 'priority', 'is_read', 'is_dismissed']
    search_fields = ['user__username', 'title', 'message']
    date_hierarchy = 'triggered_at'