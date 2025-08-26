from rest_framework import serializers
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone

from .models import (
    LoanRequest, LoanIncreaseRequest, SettlementRequest, DeferralRequest,
    RequestStatusHistory, RequestComment, RequestApprovalWorkflow
)
from authentication.serializers import UserSerializer
from loans.serializers import LoanSerializer


class LoanRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    loan = LoanSerializer(read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = LoanRequest
        fields = [
            'id', 'user', 'loan', 'request_type', 'request_type_display', 
            'request_number', 'title', 'description', 'reason', 'request_data',
            'requested_amount_usd', 'current_balance_usd', 'status', 'status_display',
            'priority', 'priority_display', 'approved_by', 'approved_at',
            'rejection_reason', 'fee_amount_usd', 'new_monthly_payment_usd',
            'new_final_payment_date', 'requested_at', 'updated_at', 'completed_at',
            'customer_notes'
        ]
        read_only_fields = [
            'request_number', 'approved_by', 'approved_at', 'fee_amount_usd',
            'new_monthly_payment_usd', 'new_final_payment_date', 'requested_at',
            'updated_at', 'completed_at'
        ]


class LoanIncreaseRequestSerializer(serializers.ModelSerializer):
    loan_request = LoanRequestSerializer(read_only=True)
    increase_reason_display = serializers.CharField(source='get_increase_reason_display', read_only=True)
    
    class Meta:
        model = LoanIncreaseRequest
        fields = [
            'loan_request', 'current_amount_usd', 'current_monthly_payment',
            'increase_amount_usd', 'increase_reason', 'increase_reason_display',
            'new_total_amount_usd', 'new_monthly_payment_usd', 'new_duration_months',
            'processing_fee_usd', 'income_verification_required',
            'additional_documents_required', 'credit_check_required'
        ]


class SettlementRequestSerializer(serializers.ModelSerializer):
    loan_request = LoanRequestSerializer(read_only=True)
    settlement_type_display = serializers.CharField(source='get_settlement_type_display', read_only=True)
    
    class Meta:
        model = SettlementRequest
        fields = [
            'loan_request', 'settlement_type', 'settlement_type_display',
            'current_outstanding_balance', 'current_monthly_payment', 'remaining_payments',
            'settlement_amount_usd', 'discount_amount_usd', 'settlement_fee_usd',
            'settlement_deadline', 'payment_method', 'total_savings_usd', 'interest_savings_usd'
        ]


class DeferralRequestSerializer(serializers.ModelSerializer):
    loan_request = LoanRequestSerializer(read_only=True)
    deferral_reason_display = serializers.CharField(source='get_deferral_reason_display', read_only=True)
    
    class Meta:
        model = DeferralRequest
        fields = [
            'loan_request', 'deferral_reason', 'deferral_reason_display', 'requested_months',
            'next_payment_due', 'monthly_payment_amount', 'new_payment_start_date',
            'new_final_payment_date', 'deferral_fee_usd', 'expected_income_recovery_date',
            'proposed_catch_up_plan', 'hardship_documentation_provided', 'alternative_payment_plan'
        ]


class RequestStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)
    old_status_display = serializers.SerializerMethodField()
    new_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RequestStatusHistory
        fields = [
            'id', 'old_status', 'old_status_display', 'new_status', 'new_status_display',
            'changed_by', 'change_reason', 'changed_at'
        ]
    
    def get_old_status_display(self, obj):
        return dict(LoanRequest.STATUS_CHOICES).get(obj.old_status, obj.old_status)
    
    def get_new_status_display(self, obj):
        return dict(LoanRequest.STATUS_CHOICES).get(obj.new_status, obj.new_status)


class RequestCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment_type_display = serializers.CharField(source='get_comment_type_display', read_only=True)
    
    class Meta:
        model = RequestComment
        fields = [
            'id', 'author', 'comment_type', 'comment_type_display', 'content',
            'is_internal', 'is_important', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']


class RequestApprovalWorkflowSerializer(serializers.ModelSerializer):
    step_name_display = serializers.CharField(source='get_step_name_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to = UserSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = RequestApprovalWorkflow
        fields = [
            'id', 'step_name', 'step_name_display', 'step_order', 'status', 'status_display',
            'assigned_to', 'completed_by', 'notes', 'decision', 'created_at', 'completed_at'
        ]


# Create Request Serializers
class CreateLoanIncreaseRequestSerializer(serializers.Serializer):
    loan_id = serializers.UUIDField()
    increase_amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    increase_reason = serializers.ChoiceField(choices=LoanIncreaseRequest.INCREASE_REASONS)
    description = serializers.CharField(max_length=1000)
    reason = serializers.CharField(max_length=1000)
    
    def validate_increase_amount_usd(self, value):
        if value < Decimal('100.00'):
            raise serializers.ValidationError("Minimum increase amount is $100")
        if value > Decimal('500000.00'):
            raise serializers.ValidationError("Maximum increase amount is $500,000")
        return value


class CreateSettlementRequestSerializer(serializers.Serializer):
    loan_id = serializers.UUIDField()
    settlement_type = serializers.ChoiceField(
        choices=SettlementRequest.SETTLEMENT_TYPES,
        default='full'
    )
    description = serializers.CharField(max_length=1000, required=False)
    reason = serializers.CharField(max_length=1000, required=False)


class CreateDeferralRequestSerializer(serializers.Serializer):
    loan_id = serializers.UUIDField()
    requested_months = serializers.IntegerField(min_value=1, max_value=12)
    deferral_reason = serializers.ChoiceField(choices=DeferralRequest.DEFERRAL_REASONS)
    description = serializers.CharField(max_length=1000)
    reason = serializers.CharField(max_length=1000)
    expected_recovery_date = serializers.DateField(required=False)
    catch_up_plan = serializers.CharField(max_length=2000, required=False)
    
    def validate_expected_recovery_date(self, value):
        if value and value <= date.today():
            raise serializers.ValidationError("Expected recovery date must be in the future")
        return value


class RequestEligibilitySerializer(serializers.Serializer):
    loan_id = serializers.UUIDField()
    request_type = serializers.ChoiceField(choices=LoanRequest.REQUEST_TYPES)


class RequestEligibilityResponseSerializer(serializers.Serializer):
    eligible = serializers.BooleanField()
    reason = serializers.CharField()
    requirements = serializers.ListField(child=serializers.CharField(), required=False)


class RequestStatisticsSerializer(serializers.Serializer):
    total_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    approved_requests = serializers.IntegerField()
    rejected_requests = serializers.IntegerField()
    completed_requests = serializers.IntegerField()
    request_types = serializers.DictField()


class DetailedLoanRequestSerializer(LoanRequestSerializer):
    """
    Extended serializer with related objects for detailed view
    """
    increase_details = LoanIncreaseRequestSerializer(read_only=True)
    settlement_details = SettlementRequestSerializer(read_only=True)
    deferral_details = DeferralRequestSerializer(read_only=True)
    status_history = RequestStatusHistorySerializer(many=True, read_only=True)
    comments = RequestCommentSerializer(many=True, read_only=True)
    approval_steps = RequestApprovalWorkflowSerializer(many=True, read_only=True)
    
    class Meta(LoanRequestSerializer.Meta):
        fields = LoanRequestSerializer.Meta.fields + [
            'increase_details', 'settlement_details', 'deferral_details',
            'status_history', 'comments', 'approval_steps'
        ]


class ApproveRequestSerializer(serializers.Serializer):
    approval_notes = serializers.CharField(max_length=2000, required=False)


class RejectRequestSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(max_length=2000)


class AddCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestComment
        fields = ['content', 'is_important']
        
    def create(self, validated_data):
        # Author will be set in the view
        return super().create(validated_data)