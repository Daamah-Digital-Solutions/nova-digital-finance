import os
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.conf import settings
from django.db import models
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    TripartiteContract, ElectronicSignature, ContractAmendment,
    ContractNotification, ContractTemplate
)
from .serializers import (
    TripartiteContractSerializer, ElectronicSignatureSerializer,
    ContractAmendmentSerializer, ContractNotificationSerializer,
    SignatureRequestSerializer, SignatureCompletionSerializer,
    ContractSummarySerializer
)
from .services import ContractGenerationService, ElectronicSignatureService

class UserContractsView(generics.ListAPIView):
    """List user's contracts"""
    serializer_class = ContractSummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TripartiteContract.objects.filter(client=self.request.user)

class ContractDetailView(generics.RetrieveAPIView):
    """Get contract details"""
    serializer_class = TripartiteContractSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TripartiteContract.objects.filter(client=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_contract_for_certificate(request, certificate_id):
    """Generate tripartite contract for a certificate"""
    try:
        from pronova.models import ElectronicCertificate
        
        certificate = get_object_or_404(
            ElectronicCertificate,
            id=certificate_id,
            user=request.user
        )
        
        # Check if contract already exists
        if hasattr(certificate, 'tripartite_contract'):
            return Response({
                'message': 'Contract already exists',
                'contract_id': certificate.tripartite_contract.id,
                'contract_number': certificate.tripartite_contract.contract_number
            })
        
        # Generate new contract
        service = ContractGenerationService()
        contract = service.create_tripartite_contract(certificate)
        
        return Response({
            'message': 'Tripartite contract generated successfully',
            'contract_id': contract.id,
            'contract_number': contract.contract_number,
            'status': contract.status,
            'pdf_generated': contract.pdf_generated
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate contract: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_contract(request, contract_id):
    """Download contract PDF"""
    try:
        contract = get_object_or_404(
            TripartiteContract,
            id=contract_id,
            client=request.user
        )
        
        if not contract.pdf_generated or not contract.pdf_file_path:
            # Generate PDF if not exists
            service = ContractGenerationService()
            service.generate_contract_pdf(contract)
            contract.refresh_from_db()
        
        # Construct full file path
        file_path = os.path.join(settings.MEDIA_ROOT, contract.pdf_file_path)
        
        if not os.path.exists(file_path):
            raise Http404("Contract file not found")
        
        # Return file response
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="contract_{contract.contract_number}.pdf"'
        
        return response
        
    except Http404:
        raise
    except Exception as e:
        return Response({
            'error': f'Failed to download contract: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_signature(request, contract_id):
    """Initiate electronic signature process"""
    try:
        contract = get_object_or_404(
            TripartiteContract,
            id=contract_id,
            client=request.user
        )
        
        if contract.status not in ['pending_signatures', 'nova_signed']:
            return Response({
                'error': 'Contract is not ready for signature'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SignatureRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get client info
        ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Initiate signature
        signature_service = ElectronicSignatureService()
        signature = signature_service.initiate_signature(
            contract=contract,
            signer_user=request.user,
            signature_type=serializer.validated_data['signature_type'],
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return Response({
            'message': 'Signature process initiated',
            'signature_id': signature.id,
            'signature_type': signature.signature_type,
            'contract_status': contract.status
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to initiate signature: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_signature(request, signature_id):
    """Complete electronic signature"""
    try:
        signature = get_object_or_404(
            ElectronicSignature,
            id=signature_id,
            signer=request.user
        )
        
        if signature.is_verified:
            return Response({
                'error': 'Signature already completed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SignatureCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Complete signature
        signature_service = ElectronicSignatureService()
        signature_service.complete_signature(
            signature=signature,
            signature_data=serializer.validated_data['signature_data'],
            verification_method=serializer.validated_data['verification_method']
        )
        
        # Get updated contract status
        contract = signature.contract
        
        return Response({
            'message': 'Signature completed successfully',
            'signature_verified': signature.is_verified,
            'contract_status': contract.status,
            'contract_fully_executed': contract.status == 'fully_executed',
            'capimax_authorized': contract.capimax_authorized
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to complete signature: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserNotificationsView(generics.ListAPIView):
    """List user's contract notifications"""
    serializer_class = ContractNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ContractNotification.objects.filter(
            recipient=self.request.user
        ).order_by('-sent_at')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    try:
        notification = get_object_or_404(
            ContractNotification,
            id=notification_id,
            recipient=request.user
        )
        
        from django.utils import timezone
        notification.read_at = timezone.now()
        notification.save()
        
        return Response({
            'message': 'Notification marked as read',
            'notification_id': notification_id
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to mark notification: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contract_status(request, contract_id):
    """Get contract status and next actions"""
    try:
        contract = get_object_or_404(
            TripartiteContract,
            id=contract_id,
            client=request.user
        )
        
        # Determine next actions
        next_actions = []
        
        if contract.status == 'pending_signatures':
            next_actions.append({
                'action': 'sign_contract',
                'title': 'Sign Contract',
                'description': 'Your electronic signature is required to activate the contract'
            })
        
        elif contract.status == 'fully_executed' and contract.capimax_authorized:
            next_actions.append({
                'action': 'start_investing',
                'title': 'Start Investing',
                'description': 'Your Capimax investment authorization is active'
            })
        
        # Check for pending notifications
        pending_notifications = contract.notifications.filter(
            recipient=request.user,
            read_at__isnull=True,
            action_required=True
        ).count()
        
        return Response({
            'contract_id': contract.id,
            'contract_number': contract.contract_number,
            'status': contract.status,
            'status_display': contract.get_status_display(),
            'capimax_authorized': contract.capimax_authorized,
            'effective_date': contract.effective_date,
            'expiry_date': contract.expiry_date,
            'next_actions': next_actions,
            'pending_notifications': pending_notifications,
            'signatures_completed': {
                'client': bool(contract.client_signature_date),
                'nova': bool(contract.nova_signature_date)
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to get contract status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin views (would require admin permissions in production)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_contracts_list(request):
    """List all contracts (Admin only)"""
    # TODO: Add admin permission check
    
    contracts = TripartiteContract.objects.all().order_by('-created_at')
    serializer = ContractSummarySerializer(contracts, many=True)
    
    return Response({
        'contracts': serializer.data,
        'total_count': contracts.count(),
        'status_breakdown': {
            'pending_signatures': contracts.filter(status='pending_signatures').count(),
            'fully_executed': contracts.filter(status='fully_executed').count(),
            'expired': contracts.filter(status='expired').count(),
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_sign_contract(request, contract_id):
    """Admin signature for contracts (Nova side)"""
    # TODO: Add admin permission check
    
    try:
        contract = get_object_or_404(TripartiteContract, id=contract_id)
        
        if contract.nova_signature_date:
            return Response({
                'error': 'Nova has already signed this contract'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get admin info
        ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create Nova signature
        signature_service = ElectronicSignatureService()
        signature = signature_service.initiate_signature(
            contract=contract,
            signer_user=request.user,
            signature_type='click_to_sign',
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Complete immediately for admin
        signature_service.complete_signature(
            signature=signature,
            signature_data=f'Nova Admin Signature - {request.user.email}',
            verification_method='admin_authorization'
        )
        
        return Response({
            'message': 'Nova signature completed',
            'contract_status': contract.status,
            'nova_signed': bool(contract.nova_signature_date)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to sign contract: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
