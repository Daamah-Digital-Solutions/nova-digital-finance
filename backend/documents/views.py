from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid
import hashlib

from .models import Document, DocumentTemplate, ElectronicSignature, DocumentAccess, DocumentShare
from .serializers import (
    DocumentSerializer, DocumentCreateSerializer, DocumentTemplateSerializer,
    ElectronicSignatureSerializer, SignDocumentSerializer, DocumentAccessSerializer,
    DocumentShareSerializer, CreateDocumentShareSerializer
)
from .services import DocumentGenerationService, ElectronicSignatureService, DocumentDeliveryService
from loans.models import LoanApplication, Loan, Payment

User = get_user_model()


class DocumentTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for document templates
    """
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        return queryset


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for document management
    """
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        """
        Create and generate a new document
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create document instance
        document_data = serializer.validated_data
        document_data['user'] = request.user
        
        # Generate document based on type
        doc_service = DocumentGenerationService()
        user_language = request.user.profile.language if hasattr(request.user, 'profile') else 'en'
        
        if document_data['document_type'] == 'loan_certificate' and document_data.get('loan'):
            document = doc_service.generate_loan_certificate(
                document_data['loan'],
                user_language=user_language
            )
        elif document_data['document_type'] == 'financing_contract' and document_data.get('loan_application'):
            document = doc_service.generate_financing_contract(
                document_data['loan_application'],
                user_language=user_language
            )
        elif document_data['document_type'] == 'kyc_report':
            document = doc_service.generate_kyc_report(
                request.user,
                user_language=user_language
            )
        elif document_data['document_type'] == 'payment_receipt' and document_data.get('payment'):
            document = doc_service.generate_payment_receipt(
                document_data['payment'],
                user_language=user_language
            )
        elif document_data['document_type'] == 'investment_certificate':
            # For now, create a mock investment object
            from types import SimpleNamespace
            investment = SimpleNamespace(
                id=str(uuid.uuid4())[:8],
                user=request.user,
                amount_usd=document_data.get('amount', 1000)
            )
            document = doc_service.generate_investment_certificate(
                investment,
                user_language=user_language
            )
        else:
            return Response(
                {'error': 'Unsupported document type or missing required reference'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            DocumentSerializer(document, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """
        Sign a document electronically
        """
        document = self.get_object()
        
        if document.status == 'signed':
            return Response(
                {'error': 'Document is already signed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SignDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create electronic signature
        sig_service = ElectronicSignatureService()
        signature = sig_service.create_signature(
            document=document,
            user=request.user,
            signature_data=serializer.validated_data['signature_data'],
            method=serializer.validated_data['signature_method'],
            ip_address=serializer.validated_data.get('ip_address', self.get_client_ip(request)),
            user_agent=serializer.validated_data.get('user_agent', request.META.get('HTTP_USER_AGENT', ''))
        )
        
        return Response(
            ElectronicSignatureSerializer(signature, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """
        Send document via email
        """
        document = self.get_object()
        recipient_email = request.data.get('email', document.user.email)
        
        delivery_service = DocumentDeliveryService()
        success = delivery_service.send_document_email(document, recipient_email)
        
        if success:
            return Response({'message': 'Document sent successfully'})
        else:
            return Response(
                {'error': 'Failed to send document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download document PDF - generates on-demand if not exists
        """
        document = self.get_object()
        
        # Log access
        DocumentAccess.objects.create(
            document=document,
            user=request.user,
            access_type='download',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session_id=request.session.session_key or '',
            referrer=request.META.get('HTTP_REFERER', '')
        )
        
        # Generate PDF on-demand if not exists
        if not document.pdf_file:
            try:
                from .services import DocumentGenerationService
                from django.core.files.base import ContentFile
                from datetime import datetime
                
                doc_service = DocumentGenerationService()
                
                if document.status == 'signed' and hasattr(document, 'signatures') and document.signatures.exists():
                    # For signed documents, use signature embedding
                    signature = document.signatures.first()
                    pdf_content = doc_service.embed_signature_in_pdf(document, signature)
                else:
                    # For unsigned documents, generate basic PDF
                    if document.document_type == 'loan_certificate':
                        pdf_content = doc_service._regenerate_certificate_with_signature(document, None)
                    elif document.document_type == 'financing_contract':
                        pdf_content = doc_service._regenerate_contract_with_signature(document, None)
                    elif document.document_type == 'kyc_report':
                        # Generate KYC report on-demand
                        template_data = doc_service.get_kyc_report_data(document.user)
                        pdf_content = doc_service.create_kyc_report_pdf(template_data)
                    elif document.document_type == 'payment_receipt':
                        # Generate payment receipt on-demand
                        if document.payment:
                            template_data = doc_service.get_payment_receipt_data(document.payment)
                        else:
                            # Create mock data if no payment linked
                            template_data = {
                                'company_name': 'Nova Financial Digital',
                                'receipt_number': document.document_number,
                                'payment_date': document.created_at.strftime('%B %d, %Y'),
                                'client_name': document.user.username,
                                'client_id': document.user.client_number,
                                'loan_number': 'N/A',
                                'payment_amount': '$0.00',
                                'payment_method': 'N/A',
                                'transaction_id': 'N/A',
                                'status': 'Generated',
                                'remaining_balance': '$0.00'
                            }
                        pdf_content = doc_service.create_payment_receipt_pdf(template_data)
                    elif document.document_type == 'investment_certificate':
                        # Generate investment certificate on-demand
                        from types import SimpleNamespace
                        
                        # Get investment data from document's generated_data
                        generated_data = document.generated_data if document.generated_data else {}
                        
                        # Handle both old template_data format and new investment_data format
                        if 'certificate_number' in generated_data:
                            # Old format: template data was stored directly
                            pdf_content = doc_service.create_investment_certificate_pdf(generated_data)
                        else:
                            # New format: investment data is stored
                            investment = SimpleNamespace(
                                id=generated_data.get('id', str(document.id)),
                                user=document.user,
                                amount_usd=generated_data.get('amount_usd', 1000),
                                asset_allocation=generated_data.get('asset_allocation', {'symbol': 'MIXED', 'name': 'Mixed Assets', 'percentage': 100}),
                                expected_return_percentage=generated_data.get('expected_return_percentage', 10),
                                term_months=generated_data.get('term_months', 12),
                                platform_name=generated_data.get('platform_name', 'Capimax'),
                                position_type=generated_data.get('position_type', 'long'),
                                opened_at=generated_data.get('opened_at', document.created_at)
                            )
                            template_data = doc_service.get_investment_certificate_data(investment)
                            pdf_content = doc_service.create_investment_certificate_pdf(template_data)
                    else:
                        raise Http404("Unable to generate PDF for this document type")
                
                if pdf_content:
                    # Save the generated PDF
                    pdf_filename = f"generated_{document.document_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    document.pdf_file.save(
                        pdf_filename,
                        ContentFile(pdf_content),
                        save=True
                    )
            except Exception as e:
                return Response(
                    {'error': f'Failed to generate PDF: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        if not document.pdf_file:
            raise Http404("PDF file not available")
        
        # Serve the file
        response = HttpResponse(
            document.pdf_file.read(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{document.document_number}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Create a shareable link for document
        """
        document = self.get_object()
        
        serializer = CreateDocumentShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Generate share token
        share_token = hashlib.sha256(
            f"{document.id}_{request.user.id}_{timezone.now().isoformat()}".encode()
        ).hexdigest()[:32]
        
        share = DocumentShare.objects.create(
            document=document,
            shared_by=request.user,
            share_token=share_token,
            **serializer.validated_data
        )
        
        return Response(
            DocumentShareSerializer(share, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def get_client_ip(self, request):
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'


class SharedDocumentView(APIView):
    """
    View for accessing shared documents via token
    """
    permission_classes = []  # Allow anonymous access

    def get(self, request, token):
        """
        Access shared document
        """
        try:
            share = DocumentShare.objects.get(
                share_token=token,
                is_active=True,
                expires_at__gt=timezone.now()
            )
        except DocumentShare.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired share link'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check access limits
        if share.max_access_count and share.access_count >= share.max_access_count:
            return Response(
                {'error': 'Access limit exceeded'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Log access
        DocumentAccess.objects.create(
            document=share.document,
            user=None,  # Anonymous access
            access_type='view',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            referrer=request.META.get('HTTP_REFERER', '')
        )

        # Increment access count
        share.access_count += 1
        share.save()

        # Return document info
        document_data = DocumentSerializer(share.document, context={'request': request}).data
        
        return Response({
            'document': document_data,
            'share_info': {
                'shared_by': share.shared_by.username,
                'can_download': share.can_download,
                'access_count': share.access_count,
                'max_access_count': share.max_access_count,
                'expires_at': share.expires_at
            }
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'


class DocumentAccessViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing document access logs
    """
    serializer_class = DocumentAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show access logs for user's documents
        user_documents = Document.objects.filter(user=self.request.user)
        return DocumentAccess.objects.filter(document__in=user_documents).order_by('-accessed_at')


class GenerateDocumentView(APIView):
    """
    Specialized view for generating documents after loan approval
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, loan_id=None, application_id=None, payment_id=None, **kwargs):
        """
        Generate documents for various purposes
        """
        doc_service = DocumentGenerationService()
        user_language = getattr(request.user.profile, 'language', 'en') if hasattr(request.user, 'profile') else 'en'
        doc_type = kwargs.get('doc_type', None)
        
        documents = []
        
        # Continue with existing loan/application document generation
        if loan_id:
            # Generate loan certificate
            try:
                loan = Loan.objects.get(id=loan_id, user=request.user)
                certificate = doc_service.generate_loan_certificate(loan, user_language)
                documents.append(certificate)
            except Loan.DoesNotExist:
                return Response(
                    {'error': 'Loan not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        elif application_id:
            # Generate financing contract
            try:
                application = LoanApplication.objects.get(id=application_id, user=request.user)
                contract = doc_service.generate_financing_contract(application, user_language)
                documents.append(contract)
            except LoanApplication.DoesNotExist:
                return Response(
                    {'error': 'Loan application not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if not documents:
            return Response(
                {'error': 'No valid loan or application ID provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize and return documents
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
