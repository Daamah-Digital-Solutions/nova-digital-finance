from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import LoanRequest, RequestComment, RequestStatusHistory
from .serializers import (
    LoanRequestSerializer, DetailedLoanRequestSerializer, RequestCommentSerializer,
    RequestStatusHistorySerializer, CreateLoanIncreaseRequestSerializer,
    CreateSettlementRequestSerializer, CreateDeferralRequestSerializer,
    RequestEligibilitySerializer, RequestEligibilityResponseSerializer,
    RequestStatisticsSerializer, ApproveRequestSerializer, RejectRequestSerializer,
    AddCommentSerializer
)
from .services import LoanRequestService
from loans.models import Loan


class LoanRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for loan modification requests
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanRequest.objects.filter(user=self.request.user).order_by('-requested_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DetailedLoanRequestSerializer
        elif self.action == 'create_increase':
            return CreateLoanIncreaseRequestSerializer
        elif self.action == 'create_settlement':
            return CreateSettlementRequestSerializer
        elif self.action == 'create_deferral':
            return CreateDeferralRequestSerializer
        elif self.action == 'approve':
            return ApproveRequestSerializer
        elif self.action == 'reject':
            return RejectRequestSerializer
        elif self.action == 'add_comment':
            return AddCommentSerializer
        return LoanRequestSerializer

    @action(detail=False, methods=['post'])
    def create_increase(self, request):
        """
        Create a loan increase request
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get loan
            loan = get_object_or_404(Loan, id=serializer.validated_data['loan_id'], user=request.user)
            
            # Check eligibility
            service = LoanRequestService()
            can_create, reason = service.can_user_create_request(request.user, loan, 'increase')
            if not can_create:
                return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create request
            loan_request = service.create_increase_request(
                user=request.user,
                loan=loan,
                data=serializer.validated_data
            )
            
            # Return created request
            response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_settlement(self, request):
        """
        Create a settlement request
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get loan
            loan = get_object_or_404(Loan, id=serializer.validated_data['loan_id'], user=request.user)
            
            # Check eligibility
            service = LoanRequestService()
            can_create, reason = service.can_user_create_request(request.user, loan, 'settlement')
            if not can_create:
                return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create request
            loan_request = service.create_settlement_request(
                user=request.user,
                loan=loan,
                data=serializer.validated_data
            )
            
            # Return created request
            response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_deferral(self, request):
        """
        Create a payment deferral request
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get loan
            loan = get_object_or_404(Loan, id=serializer.validated_data['loan_id'], user=request.user)
            
            # Check eligibility
            service = LoanRequestService()
            can_create, reason = service.can_user_create_request(request.user, loan, 'deferral')
            if not can_create:
                return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create request
            loan_request = service.create_deferral_request(
                user=request.user,
                loan=loan,
                data=serializer.validated_data
            )
            
            # Return created request
            response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a loan request (admin only)
        """
        loan_request = self.get_object()
        
        # Check permissions (only staff can approve)
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff members can approve requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            service = LoanRequestService()
            success = service.approve_request(
                loan_request,
                request.user,
                serializer.validated_data.get('approval_notes', '')
            )
            
            if success:
                loan_request.refresh_from_db()
                response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
                return Response(response_serializer.data)
            else:
                return Response(
                    {'error': 'Failed to approve request'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a loan request (admin only)
        """
        loan_request = self.get_object()
        
        # Check permissions
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff members can reject requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            service = LoanRequestService()
            service.reject_request(
                loan_request,
                request.user,
                serializer.validated_data['rejection_reason']
            )
            
            loan_request.refresh_from_db()
            response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a pending request
        """
        loan_request = self.get_object()
        
        if loan_request.status not in ['pending', 'under_review']:
            return Response(
                {'error': 'Only pending or under review requests can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        loan_request.status = 'cancelled'
        loan_request.save()
        
        # Add status history
        RequestStatusHistory.objects.create(
            loan_request=loan_request,
            old_status=loan_request.status,
            new_status='cancelled',
            changed_by=request.user
        )
        
        response_serializer = DetailedLoanRequestSerializer(loan_request, context={'request': request})
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        Add a comment to the request
        """
        loan_request = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comment = serializer.save(
            loan_request=loan_request,
            author=request.user,
            comment_type='customer'
        )
        
        response_serializer = RequestCommentSerializer(comment, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get request statistics for the user
        """
        service = LoanRequestService()
        stats = service.get_request_statistics(request.user)
        
        serializer = RequestStatisticsSerializer(stats)
        return Response(serializer.data)


class RequestEligibilityView(APIView):
    """
    View to check if user is eligible to create specific request types
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Check eligibility for creating a request
        """
        serializer = RequestEligibilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get loan
            loan = get_object_or_404(
                Loan, 
                id=serializer.validated_data['loan_id'], 
                user=request.user
            )
            
            # Check eligibility
            service = LoanRequestService()
            eligible, reason = service.can_user_create_request(
                request.user, 
                loan, 
                serializer.validated_data['request_type']
            )
            
            # Get additional requirements based on request type
            requirements = self._get_requirements(
                serializer.validated_data['request_type'], 
                loan
            )
            
            response_data = {
                'eligible': eligible,
                'reason': reason,
                'requirements': requirements
            }
            
            response_serializer = RequestEligibilityResponseSerializer(response_data)
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _get_requirements(self, request_type: str, loan: Loan) -> list:
        """
        Get requirements for specific request types
        """
        requirements = []
        
        if request_type == 'increase':
            requirements = [
                "At least 3 successful payments completed",
                "Current loan must be in good standing",
                "Income verification may be required",
                "Processing fee applies (1% of increase amount)"
            ]
        elif request_type == 'settlement':
            requirements = [
                "At least 1 payment completed",
                "Settlement amount must be paid in full",
                "Early settlement discount may apply"
            ]
        elif request_type == 'deferral':
            requirements = [
                "Maximum 2 deferrals per year",
                "Valid reason for hardship required",
                "Deferral fee applies (2% per month)",
                "Documentation may be required"
            ]
        
        return requirements


class RequestCommentsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for request comments
    """
    serializer_class = RequestCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show comments for user's requests
        user_requests = LoanRequest.objects.filter(user=self.request.user)
        return RequestComment.objects.filter(
            loan_request__in=user_requests,
            is_internal=False  # Hide internal staff notes
        ).order_by('-created_at')


class RequestHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for request status history
    """
    serializer_class = RequestStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show history for user's requests
        user_requests = LoanRequest.objects.filter(user=self.request.user)
        return RequestStatusHistory.objects.filter(
            loan_request__in=user_requests
        ).order_by('-changed_at')