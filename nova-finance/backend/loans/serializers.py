from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import LoanApplication, Loan, Payment, LoanRequest
from currencies.models import Currency, ExchangeRate

class LoanApplicationSerializer(serializers.ModelSerializer):
    # PRN Integration
    prn_display_name = serializers.SerializerMethodField()
    certificate_available = serializers.SerializerMethodField()
    
    # Keep legacy currency fields for backward compatibility
    currency_name = serializers.CharField(source='currency.name', read_only=True)
    currency_symbol = serializers.CharField(source='currency.symbol', read_only=True)
    
    class Meta:
        model = LoanApplication
        fields = [
            'id', 'prn_amount', 'loan_amount_usd', 'prn_display_name',
            'currency', 'currency_name', 'currency_symbol', 'loan_amount_currency', 
            'exchange_rate_at_application', 'duration_months', 'interest_rate', 
            'fee_percentage', 'fee_amount_usd', 'monthly_payment_usd', 'total_payment_usd', 
            'status', 'application_data', 'approval_notes', 'rejection_reason',
            'prn_issued', 'prn_pledged', 'certificate_generated', 'certificate_available',
            'submitted_at', 'processed_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'loan_amount_usd', 'exchange_rate_at_application', 'fee_amount_usd',
            'monthly_payment_usd', 'total_payment_usd', 'status', 'approval_notes',
            'rejection_reason', 'prn_issued', 'prn_pledged', 'certificate_generated',
            'submitted_at', 'processed_at', 'created_at'
        ]

    def get_prn_display_name(self, obj):
        return f"{obj.prn_amount} PRN (≈ ${obj.loan_amount_usd})"
    
    def get_certificate_available(self, obj):
        return hasattr(obj, 'certificate') and obj.certificate_generated

    def create(self, validated_data):
        user = self.context['request'].user
        
        # PRN System: Direct USD to PRN conversion (1:1)
        prn_amount = validated_data.get('prn_amount', Decimal('0'))
        
        # If legacy currency system is used, convert to PRN
        if 'currency' in validated_data and validated_data['currency']:
            currency = validated_data['currency']
            try:
                latest_rate = ExchangeRate.objects.filter(
                    currency=currency, 
                    is_active=True
                ).latest('timestamp')
                exchange_rate = latest_rate.usd_rate
                
                loan_amount_currency = validated_data.get('loan_amount_currency', Decimal('0'))
                loan_amount_usd = loan_amount_currency * exchange_rate
                prn_amount = loan_amount_usd  # PRN is 1:1 with USD
                
                validated_data.update({
                    'loan_amount_usd': loan_amount_usd,
                    'exchange_rate_at_application': exchange_rate,
                })
            except ExchangeRate.DoesNotExist:
                raise serializers.ValidationError(f"No exchange rate found for {currency.symbol}")
        else:
            # Direct PRN application
            loan_amount_usd = prn_amount  # 1:1 peg
            validated_data.update({
                'loan_amount_usd': loan_amount_usd,
            })
        
        fee_percentage = validated_data.get('fee_percentage', Decimal('2.50'))
        
        validated_data.update({
            'user': user,
            'prn_amount': prn_amount,
            'fee_percentage': fee_percentage,
            'status': 'submitted',
            'submitted_at': timezone.now()
        })
        
        return super().create(validated_data)

    def validate_prn_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("PRN amount must be greater than 0")
        if value > Decimal('1000000'):  # 1M PRN limit
            raise serializers.ValidationError("PRN amount exceeds maximum limit of 1,000,000 PRN")
        return value

    def validate_loan_amount_currency(self, value):
        if value and value <= 0:
            raise serializers.ValidationError("Loan amount must be greater than 0")
        if value and value > Decimal('1000000'):  # 1M limit
            raise serializers.ValidationError("Loan amount exceeds maximum limit")
        return value

    def validate_duration_months(self, value):
        if value < 6 or value > 60:  # 6-60 months
            raise serializers.ValidationError("Loan duration must be between 6 and 60 months")
        return value

class LoanSerializer(serializers.ModelSerializer):
    currency_name = serializers.CharField(source='currency.name', read_only=True)
    currency_symbol = serializers.CharField(source='currency.symbol', read_only=True)
    days_until_next_payment = serializers.SerializerMethodField()
    payment_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Loan
        fields = [
            'id', 'loan_number', 'currency', 'currency_name', 'currency_symbol',
            'principal_amount_currency', 'principal_amount_usd', 'fee_amount_usd',
            'monthly_payment_usd', 'total_amount_usd', 'paid_amount_usd', 'remaining_amount_usd',
            'duration_months', 'payments_made', 'next_payment_date', 'final_payment_date',
            'status', 'is_invested_capimax', 'capimax_investment_id', 'days_until_next_payment',
            'payment_progress', 'created_at'
        ]
        read_only_fields = ['id', 'loan_number', 'created_at']

    def get_days_until_next_payment(self, obj):
        if obj.status == 'active' and obj.next_payment_date:
            delta = obj.next_payment_date - timezone.now().date()
            return delta.days
        return None

    def get_payment_progress(self, obj):
        if obj.total_amount_usd > 0:
            return float((obj.paid_amount_usd / obj.total_amount_usd) * 100)
        return 0

class PaymentSerializer(serializers.ModelSerializer):
    loan_number = serializers.CharField(source='loan.loan_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'loan', 'loan_number', 'payment_type', 'amount_usd', 'payment_method',
            'transaction_id', 'installment_number', 'due_date', 'paid_date', 'status',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'transaction_id', 'paid_date', 'status', 'created_at']

class LoanRequestSerializer(serializers.ModelSerializer):
    loan_number = serializers.CharField(source='loan.loan_number', read_only=True)
    
    class Meta:
        model = LoanRequest
        fields = [
            'id', 'loan', 'loan_number', 'request_type', 'description', 'request_data',
            'status', 'admin_notes', 'processed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'processed_at', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class LoanCalculatorSerializer(serializers.Serializer):
    # Updated for PRN system
    prn_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False)
    amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    duration_months = serializers.IntegerField(min_value=6, max_value=60)
    fee_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.50'))
    
    # Legacy support
    currency_id = serializers.UUIDField(required=False)
    loan_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False)

    def validate(self, data):
        prn_amount = data.get('prn_amount')
        amount_usd = data.get('amount_usd')
        loan_amount = data.get('loan_amount')
        
        if not any([prn_amount, amount_usd, loan_amount]):
            raise serializers.ValidationError("Either prn_amount, amount_usd, or loan_amount must be provided")
        
        return data

    def validate_currency_id(self, value):
        if value:
            try:
                currency = Currency.objects.get(id=value, is_active=True)
                return value
            except Currency.DoesNotExist:
                raise serializers.ValidationError("Invalid or inactive currency")
        return value

    def calculate(self):
        duration_months = self.validated_data['duration_months']
        fee_percentage = self.validated_data['fee_percentage']
        
        # Determine loan amount in USD
        prn_amount = self.validated_data.get('prn_amount')
        amount_usd = self.validated_data.get('amount_usd')
        loan_amount = self.validated_data.get('loan_amount')
        currency_id = self.validated_data.get('currency_id')
        
        if prn_amount:
            # Direct PRN calculation (1:1 with USD)
            loan_amount_usd = prn_amount
            final_prn_amount = prn_amount
            currency_info = {
                'id': 'prn',
                'name': 'Pronova',
                'symbol': 'PRN'
            }
            exchange_rate = Decimal('1.0000')
        elif amount_usd:
            # Direct USD to PRN conversion
            loan_amount_usd = amount_usd
            final_prn_amount = amount_usd  # 1:1 peg
            currency_info = {
                'id': 'prn',
                'name': 'Pronova',
                'symbol': 'PRN'
            }
            exchange_rate = Decimal('1.0000')
        elif currency_id and loan_amount:
            # Legacy currency system
            currency = Currency.objects.get(id=currency_id)
            try:
                latest_rate = ExchangeRate.objects.filter(
                    currency=currency,
                    is_active=True
                ).latest('timestamp')
                exchange_rate = latest_rate.usd_rate
            except ExchangeRate.DoesNotExist:
                raise serializers.ValidationError(f"No exchange rate found for {currency.symbol}")

            loan_amount_usd = loan_amount * exchange_rate
            final_prn_amount = loan_amount_usd  # Convert to PRN
            currency_info = {
                'id': str(currency.id),
                'name': currency.name,
                'symbol': currency.symbol
            }
        else:
            raise serializers.ValidationError("Insufficient data for calculation")

        # Calculate fees and payments
        fee_amount_usd = loan_amount_usd * (fee_percentage / 100)
        total_amount_usd = loan_amount_usd + fee_amount_usd
        monthly_payment_usd = loan_amount_usd / duration_months  # Interest-free

        return {
            'currency': currency_info,
            'prn_amount': final_prn_amount,
            'loan_amount_currency': loan_amount if loan_amount else final_prn_amount,
            'loan_amount_usd': loan_amount_usd,
            'exchange_rate': exchange_rate,
            'duration_months': duration_months,
            'fee_percentage': fee_percentage,
            'fee_amount_usd': fee_amount_usd,
            'total_amount_usd': total_amount_usd,
            'monthly_payment_usd': monthly_payment_usd,
            'interest_rate': Decimal('0.00'),
            'prn_display': f"{final_prn_amount} PRN ≈ ${loan_amount_usd}"
        }