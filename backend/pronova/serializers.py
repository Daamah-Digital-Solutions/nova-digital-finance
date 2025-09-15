from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    PRNWallet, PRNTransaction, ElectronicCertificate, 
    CapimaxInvestment, PRNSystemReserve
)

class PRNWalletSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = PRNWallet
        fields = [
            'id', 'user_email', 'balance', 'pledged_balance', 
            'available_balance', 'wallet_address', 'created_at'
        ]
        read_only_fields = ['id', 'wallet_address', 'created_at']

class PRNTransactionSerializer(serializers.ModelSerializer):
    from_wallet_address = serializers.CharField(source='from_wallet.wallet_address', read_only=True)
    to_wallet_address = serializers.CharField(source='to_wallet.wallet_address', read_only=True)
    
    class Meta:
        model = PRNTransaction
        fields = [
            'id', 'transaction_hash', 'from_wallet_address', 'to_wallet_address',
            'amount', 'transaction_type', 'status', 'reference_id', 'notes',
            'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'transaction_hash', 'created_at', 'processed_at']

class ElectronicCertificateSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    loan_application_id = serializers.CharField(source='loan_application.id', read_only=True)
    
    class Meta:
        model = ElectronicCertificate
        fields = [
            'id', 'certificate_number', 'user_email', 'loan_application_id',
            'prn_amount', 'usd_value', 'status', 'issued_date', 'expiry_date',
            'pledge_release_date', 'capimax_certificate_id', 'capimax_investment_active',
            'pdf_generated', 'pdf_file_path', 'created_at'
        ]
        read_only_fields = [
            'id', 'certificate_number', 'issued_date', 'pdf_generated', 
            'pdf_file_path', 'created_at'
        ]

class CapimaxInvestmentSerializer(serializers.ModelSerializer):
    certificate_number = serializers.CharField(source='certificate.certificate_number', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = CapimaxInvestment
        fields = [
            'id', 'certificate_number', 'user_email', 'capimax_investment_id',
            'capimax_profile_id', 'investment_amount_usd', 'investment_type',
            'current_profit_usd', 'total_profit_usd', 'last_profit_update',
            'status', 'started_date', 'ended_date', 'created_at'
        ]
        read_only_fields = [
            'id', 'started_date', 'ended_date', 'created_at', 'last_profit_update'
        ]

class PRNSystemReserveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PRNSystemReserve
        fields = [
            'id', 'total_prn_issued', 'total_usd_backing', 'prn_in_circulation',
            'prn_pledged_total', 'backing_ratio', 'last_audit_date', 'created_at'
        ]
        read_only_fields = ['id', 'backing_ratio', 'created_at']

class PRNLoanApplicationSerializer(serializers.Serializer):
    """
    Updated loan application serializer for PRN system
    """
    amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    duration_months = serializers.IntegerField(min_value=6, max_value=60)
    fee_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.50'))
    
    def validate_amount_usd(self, value):
        if value <= 0:
            raise serializers.ValidationError("Loan amount must be greater than 0")
        if value > Decimal('1000000'):  # 1M USD limit
            raise serializers.ValidationError("Loan amount exceeds maximum limit")
        return value
    
    def calculate_prn_terms(self):
        """
        Calculate PRN loan terms
        """
        amount_usd = self.validated_data['amount_usd']
        duration_months = self.validated_data['duration_months']
        fee_percentage = self.validated_data['fee_percentage']
        
        # PRN is always 1:1 with USD
        prn_amount = amount_usd
        fee_amount_usd = amount_usd * (fee_percentage / 100)
        total_amount_usd = amount_usd + fee_amount_usd
        monthly_payment_usd = amount_usd / duration_months  # Interest-free
        
        return {
            'prn_amount': prn_amount,
            'loan_amount_usd': amount_usd,
            'fee_percentage': fee_percentage,
            'fee_amount_usd': fee_amount_usd,
            'total_amount_usd': total_amount_usd,
            'monthly_payment_usd': monthly_payment_usd,
            'duration_months': duration_months,
            'exchange_rate': Decimal('1.0000'),  # PRN:USD is always 1:1
            'currency': {
                'name': 'Pronova',
                'symbol': 'PRN',
                'full_name': 'Pronova (PRN) - Digital Finance Token'
            }
        }