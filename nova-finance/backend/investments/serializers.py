from rest_framework import serializers
from decimal import Decimal
from .models import (
    InvestmentPlatform, UserInvestmentAccount, InvestmentPosition,
    InvestmentTransaction, CapimaxIntegration, InvestmentAlert
)
from authentication.serializers import UserSerializer


class InvestmentPlatformSerializer(serializers.ModelSerializer):
    platform_type_display = serializers.CharField(source='get_platform_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = InvestmentPlatform
        fields = [
            'id', 'name', 'slug', 'platform_type', 'platform_type_display',
            'description', 'website_url', 'logo_url', 'min_investment_usd',
            'max_investment_usd', 'commission_rate', 'status', 'status_display',
            'is_verified', 'supports_certificates', 'created_at'
        ]


class UserInvestmentAccountSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    platform = InvestmentPlatformSerializer(read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    
    class Meta:
        model = UserInvestmentAccount
        fields = [
            'id', 'user', 'platform', 'platform_user_id', 'platform_username',
            'verification_status', 'verification_status_display', 'verified_at',
            'balance_usd', 'available_balance_usd', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'platform_user_id', 'api_key', 'api_secret', 'balance_usd', 
            'available_balance_usd', 'verified_at'
        ]


class InvestmentPositionSerializer(serializers.ModelSerializer):
    account = UserInvestmentAccountSerializer(read_only=True)
    position_type_display = serializers.CharField(source='get_position_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    profit_loss_percentage = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    
    class Meta:
        model = InvestmentPosition
        fields = [
            'id', 'account', 'loan', 'position_id', 'asset_symbol', 'asset_name',
            'position_type', 'position_type_display', 'status', 'status_display',
            'investment_amount_usd', 'current_value_usd', 'entry_price', 'current_price',
            'quantity', 'unrealized_pnl_usd', 'realized_pnl_usd', 'profit_loss_percentage',
            'opened_at', 'closed_at', 'last_updated', 'created_at'
        ]
        read_only_fields = [
            'position_id', 'current_value_usd', 'current_price', 'unrealized_pnl_usd',
            'realized_pnl_usd', 'profit_loss_percentage', 'opened_at', 'closed_at', 'last_updated'
        ]


class InvestmentTransactionSerializer(serializers.ModelSerializer):
    account = UserInvestmentAccountSerializer(read_only=True)
    position = InvestmentPositionSerializer(read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = InvestmentTransaction
        fields = [
            'id', 'account', 'position', 'transaction_id', 'transaction_type',
            'transaction_type_display', 'status', 'status_display', 'asset_symbol',
            'quantity', 'price', 'amount_usd', 'fee_usd', 'description',
            'executed_at', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'executed_at']


class CapimaxIntegrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    preferred_strategy_display = serializers.CharField(source='get_preferred_strategy_display', read_only=True)
    
    class Meta:
        model = CapimaxIntegration
        fields = [
            'id', 'user', 'capimax_user_id', 'preferred_strategy', 'preferred_strategy_display',
            'max_investment_percentage', 'stop_loss_percentage', 'take_profit_percentage',
            'auto_invest_enabled', 'auto_invest_amount_usd', 'email_notifications',
            'sms_notifications', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['capimax_user_id', 'api_key', 'webhook_secret']

    def validate_max_investment_percentage(self, value):
        if value < Decimal('1.00') or value > Decimal('100.00'):
            raise serializers.ValidationError("Must be between 1% and 100%")
        return value

    def validate_stop_loss_percentage(self, value):
        if value < Decimal('1.00') or value > Decimal('50.00'):
            raise serializers.ValidationError("Must be between 1% and 50%")
        return value

    def validate_take_profit_percentage(self, value):
        if value < Decimal('5.00') or value > Decimal('100.00'):
            raise serializers.ValidationError("Must be between 5% and 100%")
        return value


class InvestmentAlertSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    account = UserInvestmentAccountSerializer(read_only=True)
    position = InvestmentPositionSerializer(read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = InvestmentAlert
        fields = [
            'id', 'user', 'account', 'position', 'alert_type', 'alert_type_display',
            'priority', 'priority_display', 'title', 'message', 'trigger_price',
            'trigger_percentage', 'is_read', 'is_dismissed', 'email_sent', 'sms_sent',
            'triggered_at', 'read_at', 'created_at'
        ]
        read_only_fields = [
            'trigger_price', 'trigger_percentage', 'email_sent', 'sms_sent', 'triggered_at'
        ]


class CreateInvestmentPositionSerializer(serializers.Serializer):
    loan_id = serializers.UUIDField()
    asset_symbol = serializers.CharField(max_length=20, default='BTC')
    investment_amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    strategy = serializers.ChoiceField(
        choices=CapimaxIntegration.INVESTMENT_STRATEGIES,
        default='balanced'
    )

    def validate_investment_amount_usd(self, value):
        if value < Decimal('10.00'):
            raise serializers.ValidationError("Minimum investment amount is $10.00")
        if value > Decimal('100000.00'):
            raise serializers.ValidationError("Maximum investment amount is $100,000.00")
        return value

    def validate_asset_symbol(self, value):
        # In production, validate against supported assets
        allowed_symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC']
        if value.upper() not in allowed_symbols:
            raise serializers.ValidationError(f"Unsupported asset symbol. Allowed: {', '.join(allowed_symbols)}")
        return value.upper()


class PortfolioSummarySerializer(serializers.Serializer):
    total_balance_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_invested_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pnl_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pnl_percentage = serializers.DecimalField(max_digits=8, decimal_places=2)
    active_positions_count = serializers.IntegerField()
    platforms = serializers.ListField(child=serializers.DictField())
    positions = serializers.ListField(child=serializers.DictField())


class MarketDataSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    price = serializers.DecimalField(max_digits=16, decimal_places=2)
    change_24h = serializers.DecimalField(max_digits=8, decimal_places=2)
    change_24h_percent = serializers.DecimalField(max_digits=8, decimal_places=2)
    volume_24h = serializers.DecimalField(max_digits=16, decimal_places=2)
    market_cap = serializers.DecimalField(max_digits=16, decimal_places=2, required=False)
    last_updated = serializers.DateTimeField()


class InvestmentOpportunitySerializer(serializers.Serializer):
    """
    Serializer for investment opportunities based on user's loans
    """
    loan_id = serializers.UUIDField()
    loan_number = serializers.CharField()
    currency_symbol = serializers.CharField()
    loan_amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    available_for_investment_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    max_investment_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    recommended_assets = serializers.ListField(child=serializers.DictField())
    risk_level = serializers.CharField()
    expected_return_range = serializers.DictField()


class ClosePositionSerializer(serializers.Serializer):
    position_id = serializers.UUIDField()
    close_reason = serializers.ChoiceField(
        choices=[
            ('manual', 'Manual Close'),
            ('stop_loss', 'Stop Loss Triggered'),
            ('take_profit', 'Take Profit Triggered'),
            ('margin_call', 'Margin Call'),
            ('system', 'System Close')
        ],
        default='manual'
    )