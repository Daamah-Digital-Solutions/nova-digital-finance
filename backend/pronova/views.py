import os
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, FileResponse, Http404
from django.conf import settings
from django.db import models
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import (
    PRNWallet, PRNTransaction, ElectronicCertificate,
    CapimaxInvestment, PRNSystemReserve
)
from .serializers import (
    PRNWalletSerializer, PRNTransactionSerializer, ElectronicCertificateSerializer,
    CapimaxInvestmentSerializer, PRNSystemReserveSerializer
)
from .services import CertificateGenerationService, PRNManagementService
from loans.models import LoanApplication

class PRNWalletView(generics.RetrieveAPIView):
    """Get user's PRN wallet"""
    serializer_class = PRNWalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        wallet, created = PRNWallet.objects.get_or_create(user=self.request.user)
        return wallet

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prn_wallet_balance(request):
    """Get user's PRN wallet balance"""
    wallet, created = PRNWallet.objects.get_or_create(user=request.user)
    return Response({
        'balance': str(wallet.balance),
        'pledged_balance': str(wallet.pledged_balance),
        'available_balance': str(wallet.available_balance),
        'wallet_address': wallet.wallet_address
    })

class PRNTransactionListView(generics.ListAPIView):
    """List user's PRN transactions"""
    serializer_class = PRNTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user_wallet = PRNWallet.objects.get_or_create(user=self.request.user)[0]
        return PRNTransaction.objects.filter(
            models.Q(from_wallet=user_wallet) | models.Q(to_wallet=user_wallet)
        ).order_by('-created_at')

class UserCertificatesView(generics.ListAPIView):
    """List user's electronic certificates"""
    serializer_class = ElectronicCertificateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ElectronicCertificate.objects.filter(user=self.request.user)

class CertificateDetailView(generics.RetrieveAPIView):
    """Get certificate details"""
    serializer_class = ElectronicCertificateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ElectronicCertificate.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_certificate_pdf(request, certificate_id):
    """Generate PDF for a certificate"""
    try:
        certificate = get_object_or_404(
            ElectronicCertificate, 
            id=certificate_id, 
            user=request.user
        )
        
        service = CertificateGenerationService()
        pdf_path = service.generate_certificate(certificate)
        
        return Response({
            'message': 'Certificate PDF generated successfully',
            'certificate_id': certificate_id,
            'pdf_generated': True,
            'download_url': f'/api/pronova/certificates/{certificate_id}/download/'
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate certificate: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_certificate(request, certificate_id):
    """Download certificate PDF"""
    try:
        certificate = get_object_or_404(
            ElectronicCertificate,
            id=certificate_id,
            user=request.user
        )
        
        if not certificate.pdf_generated or not certificate.pdf_file_path:
            # Generate PDF if not exists
            service = CertificateGenerationService()
            service.generate_certificate(certificate)
            certificate.refresh_from_db()
        
        # Construct full file path
        file_path = os.path.join(settings.MEDIA_ROOT, certificate.pdf_file_path)
        
        if not os.path.exists(file_path):
            raise Http404("Certificate file not found")
        
        # Return file response
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="certificate_{certificate.certificate_number}.pdf"'
        
        return response
        
    except Http404:
        raise
    except Exception as e:
        return Response({
            'error': f'Failed to download certificate: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CapimaxInvestmentListView(generics.ListAPIView):
    """List user's Capimax investments"""
    serializer_class = CapimaxInvestmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CapimaxInvestment.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def process_loan_approval(request, loan_id):
    """Process PRN issuance after loan approval (Admin only)"""
    try:
        loan_application = get_object_or_404(LoanApplication, id=loan_id)
        
        if loan_application.status != 'approved':
            return Response({
                'error': 'Loan must be approved before PRN processing'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = PRNManagementService()
        certificate = service.process_approved_loan(loan_application)
        
        if certificate:
            return Response({
                'message': 'PRN issued and certificate generated successfully',
                'certificate_id': certificate.id,
                'certificate_number': certificate.certificate_number,
                'prn_amount': certificate.prn_amount,
                'usd_value': certificate.usd_value
            })
        else:
            return Response({
                'error': 'Failed to process loan approval'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Processing failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def prn_system_stats(request):
    """Get PRN system statistics (Admin only)"""
    try:
        # Get latest system reserve data
        latest_reserve = PRNSystemReserve.objects.first()
        
        # Calculate current stats
        total_wallets = PRNWallet.objects.count()
        total_certificates = ElectronicCertificate.objects.count()
        active_certificates = ElectronicCertificate.objects.filter(status='pledged').count()
        total_transactions = PRNTransaction.objects.count()
        
        # PRN circulation stats
        total_prn_issued = PRNWallet.objects.aggregate(
            total=models.Sum('balance')
        )['total'] or 0
        
        total_prn_pledged = PRNWallet.objects.aggregate(
            total=models.Sum('pledged_balance')
        )['total'] or 0
        
        return Response({
            'system_stats': {
                'total_wallets': total_wallets,
                'total_certificates': total_certificates,
                'active_certificates': active_certificates,
                'total_transactions': total_transactions,
                'total_prn_issued': total_prn_issued,
                'total_prn_pledged': total_prn_pledged,
                'prn_available': total_prn_issued - total_prn_pledged,
                'backing_ratio': '1.0000'  # Always 1:1
            },
            'latest_reserve': PRNSystemReserveSerializer(latest_reserve).data if latest_reserve else None
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to get system stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
