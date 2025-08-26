from rest_framework import serializers
from decimal import Decimal
import stripe
from django.conf import settings
from .models import PaymentMethod, PaymentIntent, PaymentTransaction, RefundRequest

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else None

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'payment_type', 'card_last_four', 'card_brand', 
            'card_exp_month', 'card_exp_year', 'is_default', 'is_active', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CreatePaymentMethodSerializer(serializers.Serializer):
    stripe_payment_method_id = serializers.CharField()
    is_default = serializers.BooleanField(default=False)

    def create(self, validated_data):
        user = self.context['request'].user
        stripe_pm_id = validated_data['stripe_payment_method_id']
        
        try:
            # Retrieve payment method from Stripe
            stripe_pm = stripe.PaymentMethod.retrieve(stripe_pm_id)
            
            # Attach to customer if not already attached
            if not stripe_pm.customer:
                customer_id = self.get_or_create_stripe_customer(user)
                stripe.PaymentMethod.attach(stripe_pm_id, customer=customer_id)
            
            # Create local payment method record
            payment_method = PaymentMethod.objects.create(
                user=user,
                payment_type='credit_card' if stripe_pm.card else 'other',
                card_last_four=stripe_pm.card.last4 if stripe_pm.card else '',
                card_brand=stripe_pm.card.brand if stripe_pm.card else '',
                card_exp_month=stripe_pm.card.exp_month if stripe_pm.card else None,
                card_exp_year=stripe_pm.card.exp_year if stripe_pm.card else None,
                stripe_payment_method_id=stripe_pm_id,
                is_default=validated_data['is_default']
            )
            
            return payment_method
            
        except stripe.error.StripeError as e:
            raise serializers.ValidationError(f"Stripe error: {str(e)}")

    def get_or_create_stripe_customer(self, user):
        # Check if user has a Stripe customer ID
        if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
            return user.stripe_customer_id
        
        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user.email,
            name=user.username,
            metadata={'user_id': str(user.id)}
        )
        
        # Save customer ID (would need to add this field to User model)
        # user.stripe_customer_id = customer.id
        # user.save()
        
        return customer.id

class PaymentIntentSerializer(serializers.ModelSerializer):
    test_mode = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentIntent
        fields = [
            'id', 'amount_usd', 'fee_amount', 'currency', 'purpose', 
            'status', 'client_secret', 'created_at', 'test_mode'
        ]
        read_only_fields = ['id', 'client_secret', 'created_at']
    
    def get_test_mode(self, obj):
        return not getattr(settings, 'STRIPE_ENABLED', False)

class CreatePaymentIntentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    purpose = serializers.ChoiceField(choices=PaymentIntent.PAYMENT_PURPOSE)
    loan_application_id = serializers.UUIDField(required=False)
    loan_id = serializers.UUIDField(required=False)
    payment_method_id = serializers.UUIDField(required=False)

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']
        
        # Calculate Stripe fee (2.9% + 30¢ for cards)
        stripe_fee = (amount * Decimal('0.029')) + Decimal('0.30')
        total_amount = amount + stripe_fee
        
        try:
            # Get or create Stripe customer
            customer_id = self.get_or_create_stripe_customer(user)
            
            # Create Stripe PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=int(total_amount * 100),  # Convert to cents
                currency='usd',
                customer=customer_id,
                metadata={
                    'user_id': str(user.id),
                    'purpose': validated_data['purpose'],
                    'loan_application_id': str(validated_data.get('loan_application_id', '')),
                    'loan_id': str(validated_data.get('loan_id', '')),
                },
                description=f"Nova Finance - {validated_data['purpose']}"
            )
            
            # Create local PaymentIntent record
            payment_intent = PaymentIntent.objects.create(
                user=user,
                stripe_payment_intent_id=intent.id,
                amount_usd=amount,
                fee_amount=stripe_fee,
                purpose=validated_data['purpose'],
                client_secret=intent.client_secret,
                stripe_response=intent,
                loan_application_id=validated_data.get('loan_application_id'),
                loan_id=validated_data.get('loan_id')
            )
            
            return payment_intent
            
        except stripe.error.StripeError as e:
            raise serializers.ValidationError(f"Payment creation failed: {str(e)}")

    def get_or_create_stripe_customer(self, user):
        # This would need to be implemented with proper customer management
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.username,
                metadata={'user_id': str(user.id)}
            )
            return customer.id
        except stripe.error.StripeError:
            raise serializers.ValidationError("Failed to create customer")

class PaymentTransactionSerializer(serializers.ModelSerializer):
    payment_intent_id = serializers.CharField(source='payment_intent.id', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'payment_intent_id', 'amount_charged', 'amount_received',
            'processing_fee', 'status', 'receipt_url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ConfirmPaymentSerializer(serializers.Serializer):
    payment_intent_id = serializers.UUIDField()
    stripe_payment_method_id = serializers.CharField(required=False)

    def validate_payment_intent_id(self, value):
        user = self.context['request'].user
        try:
            intent = PaymentIntent.objects.get(id=value, user=user, status='pending')
            return value
        except PaymentIntent.DoesNotExist:
            raise serializers.ValidationError("Payment intent not found or already processed")

    def confirm_payment(self):
        user = self.context['request'].user
        payment_intent = PaymentIntent.objects.get(
            id=self.validated_data['payment_intent_id'],
            user=user
        )
        
        try:
            # Confirm the payment with Stripe
            stripe_intent = stripe.PaymentIntent.confirm(
                payment_intent.stripe_payment_intent_id,
                payment_method=self.validated_data.get('stripe_payment_method_id')
            )
            
            # Update local payment intent
            payment_intent.status = stripe_intent.status
            payment_intent.stripe_response = stripe_intent
            payment_intent.save()
            
            # Create transaction record if successful
            if stripe_intent.status == 'succeeded':
                self.create_transaction_record(payment_intent, stripe_intent)
            
            return {
                'status': stripe_intent.status,
                'payment_intent': payment_intent,
                'requires_action': stripe_intent.status == 'requires_action',
                'client_secret': stripe_intent.client_secret if stripe_intent.status == 'requires_action' else None
            }
            
        except stripe.error.StripeError as e:
            payment_intent.status = 'failed'
            payment_intent.save()
            raise serializers.ValidationError(f"Payment failed: {str(e)}")

    def create_transaction_record(self, payment_intent, stripe_intent):
        # Get charge information
        if stripe_intent.charges and stripe_intent.charges.data:
            charge = stripe_intent.charges.data[0]
            
            transaction = PaymentTransaction.objects.create(
                payment_intent=payment_intent,
                user=payment_intent.user,
                stripe_charge_id=charge.id,
                amount_charged=Decimal(stripe_intent.amount) / 100,
                amount_received=Decimal(charge.amount_captured) / 100,
                processing_fee=payment_intent.fee_amount,
                status='completed',
                receipt_url=charge.receipt_url
            )
            
            return transaction

class RefundRequestSerializer(serializers.ModelSerializer):
    transaction_id = serializers.CharField(source='transaction.id', read_only=True)
    
    class Meta:
        model = RefundRequest
        fields = [
            'id', 'transaction_id', 'reason', 'amount_requested', 
            'amount_approved', 'status', 'admin_notes', 'created_at'
        ]
        read_only_fields = ['id', 'amount_approved', 'status', 'admin_notes', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)