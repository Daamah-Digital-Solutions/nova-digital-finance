import os
from datetime import datetime
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from .models import ElectronicCertificate, PRNTransaction, PRNWallet
from wallets.models import WalletService

class CertificateGenerationService:
    """
    Service for generating electronic certificates (الصك الإلكتروني)
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for the certificate"""
        self.title_style = ParagraphStyle(
            'CertificateTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        self.subtitle_style = ParagraphStyle(
            'CertificateSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.blue,
            fontName='Helvetica-Bold'
        )
        
        self.header_style = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        self.normal_style = ParagraphStyle(
            'CertificateNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            fontName='Helvetica'
        )
        
        self.important_style = ParagraphStyle(
            'Important',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            textColor=colors.red,
            fontName='Helvetica-Bold'
        )

    def generate_certificate(self, certificate: ElectronicCertificate) -> str:
        """
        Generate PDF certificate and return file path
        """
        # Create media directory if it doesn't exist
        media_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generate filename
        filename = f"certificate_{certificate.certificate_number}.pdf"
        file_path = os.path.join(media_dir, filename)
        
        # Create PDF
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=18
        )
        
        story = []
        
        # Header
        self._add_header(story, certificate)
        
        # Certificate Details
        self._add_certificate_details(story, certificate)
        
        # PRN Details
        self._add_prn_details(story, certificate)
        
        # Pledge Information
        self._add_pledge_information(story, certificate)
        
        # Capimax Investment Information
        self._add_capimax_information(story, certificate)
        
        # Legal Terms
        self._add_legal_terms(story, certificate)
        
        # Footer
        self._add_footer(story, certificate)
        
        # Build PDF
        doc.build(story)
        
        # Update certificate record
        certificate.pdf_generated = True
        certificate.pdf_file_path = f'certificates/{filename}'
        certificate.save()
        
        return file_path
    
    def _add_header(self, story, certificate):
        """Add certificate header"""
        # Title
        title = Paragraph("NOVA DIGITAL FINANCING", self.title_style)
        story.append(title)
        
        subtitle = Paragraph("Electronic Certificate of Ownership<br/>(الصك الإلكتروني)", self.subtitle_style)
        story.append(subtitle)
        
        story.append(Spacer(1, 20))
        
        # Certificate number and date
        cert_info = [
            ['Certificate Number:', certificate.certificate_number],
            ['Issue Date:', certificate.issued_date.strftime('%B %d, %Y')],
            ['Expiry Date:', certificate.expiry_date.strftime('%B %d, %Y')],
            ['Status:', certificate.get_status_display()]
        ]
        
        cert_table = Table(cert_info, colWidths=[2*inch, 3*inch])
        cert_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(cert_table)
        story.append(Spacer(1, 20))
    
    def _add_certificate_details(self, story, certificate):
        """Add certificate holder details"""
        header = Paragraph("CERTIFICATE HOLDER INFORMATION", self.header_style)
        story.append(header)
        
        holder_info = [
            ['Full Name:', certificate.user.get_full_name() or certificate.user.email],
            ['Email Address:', certificate.user.email],
            ['User ID:', str(certificate.user.id)],
            ['KYC Status:', certificate.user.kyc_status.title() if hasattr(certificate.user, 'kyc_status') else 'Verified']
        ]
        
        holder_table = Table(holder_info, colWidths=[2*inch, 4*inch])
        holder_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(holder_table)
        story.append(Spacer(1, 20))
    
    def _add_prn_details(self, story, certificate):
        """Add PRN token details"""
        header = Paragraph("PRONOVA (PRN) TOKEN DETAILS", self.header_style)
        story.append(header)
        
        prn_info = [
            ['PRN Amount:', f"{certificate.prn_amount:,.2f} PRN"],
            ['USD Equivalent:', f"${certificate.usd_value:,.2f} USD"],
            ['Exchange Rate:', "1 PRN = 1.00000000 USD (Fixed Peg)"],
            ['Token Type:', "Pronova (PRN) - Digital Finance Token"],
            ['Blockchain:', "Nova Finance Private Blockchain"]
        ]
        
        prn_table = Table(prn_info, colWidths=[2*inch, 4*inch])
        prn_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightyellow),
        ]))
        
        story.append(prn_table)
        story.append(Spacer(1, 15))
        
        # Important note about PRN
        note = Paragraph(
            "<b>IMPORTANT:</b> This certificate represents ownership of Pronova (PRN) tokens "
            "valued at exactly 1:1 with USD. These tokens are backed by Nova Finance's USD reserves.",
            self.important_style
        )
        story.append(note)
        story.append(Spacer(1, 20))
    
    def _add_pledge_information(self, story, certificate):
        """Add pledge information"""
        header = Paragraph("PLEDGE INFORMATION", self.header_style)
        story.append(header)
        
        pledge_text = f"""
        The PRN tokens represented by this certificate are pledged as collateral to Nova Digital Financing 
        for loan application #{certificate.loan_application.id}. The tokens remain pledged until full 
        repayment of the loan amount of ${certificate.usd_value:,.2f} USD.
        
        <b>Pledge Status:</b> {certificate.get_status_display()}
        <b>Loan Application ID:</b> {certificate.loan_application.id}
        <b>Pledge Release Date:</b> {certificate.pledge_release_date.strftime('%B %d, %Y') if certificate.pledge_release_date else 'Upon full loan repayment'}
        """
        
        pledge_para = Paragraph(pledge_text, self.normal_style)
        story.append(pledge_para)
        story.append(Spacer(1, 20))
    
    def _add_capimax_information(self, story, certificate):
        """Add Capimax investment information"""
        header = Paragraph("CAPIMAX INVESTMENT PLATFORM", self.header_style)
        story.append(header)
        
        capimax_text = f"""
        This certificate may be used for investment opportunities on the Capimax platform. 
        The certificate holder is authorized to invest up to the full PRN amount 
        ({certificate.prn_amount:,.2f} PRN ≈ ${certificate.usd_value:,.2f} USD) while the tokens remain pledged.
        
        <b>Capimax Certificate ID:</b> {certificate.capimax_certificate_id or 'Not yet assigned'}
        <b>Investment Status:</b> {'Active' if certificate.capimax_investment_active else 'Not Active'}
        
        All profits generated from Capimax investments belong entirely to the certificate holder. 
        Nova Finance does not claim any portion of investment returns.
        """
        
        capimax_para = Paragraph(capimax_text, self.normal_style)
        story.append(capimax_para)
        story.append(Spacer(1, 20))
    
    def _add_legal_terms(self, story, certificate):
        """Add legal terms and conditions"""
        header = Paragraph("TERMS AND CONDITIONS", self.header_style)
        story.append(header)
        
        terms_text = """
        1. This certificate is issued by Nova Digital Financing as proof of PRN token ownership.
        
        2. The PRN tokens are pledged as collateral and cannot be transferred until loan repayment.
        
        3. The certificate holder may use this document for investment on approved platforms.
        
        4. Nova Finance maintains 1:1 USD backing for all issued PRN tokens.
        
        5. Upon full loan repayment, the pledge will be released and tokens transferred to holder's wallet.
        
        6. This certificate is valid until the expiry date or pledge release, whichever comes first.
        
        7. Any disputes shall be resolved according to Nova Finance terms of service.
        """
        
        terms_para = Paragraph(terms_text, self.normal_style)
        story.append(terms_para)
        story.append(Spacer(1, 30))
    
    def _add_footer(self, story, certificate):
        """Add certificate footer"""
        # Signature section
        signature_data = [
            ['', '', ''],
            ['_' * 30, '_' * 30, '_' * 30],
            ['Certificate Holder', 'Nova Finance', 'Date'],
            ['', f'Generated: {datetime.now().strftime("%B %d, %Y")}', '']
        ]
        
        signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(signature_table)
        story.append(Spacer(1, 20))
        
        # Footer text
        footer_text = f"""
        <b>Nova Digital Financing</b><br/>
        Certificate #{certificate.certificate_number}<br/>
        Generated electronically - No physical signature required<br/>
        For verification, contact: support@novafinance.com
        """
        
        footer_para = Paragraph(footer_text, ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.grey
        ))
        story.append(footer_para)

class PRNManagementService:
    """
    Service for managing PRN operations after loan approval
    """
    
    def __init__(self):
        self.certificate_service = CertificateGenerationService()
    
    def process_approved_loan(self, loan_application):
        """
        Complete PRN issuance and certificate generation for approved loan
        """
        if loan_application.status != 'approved':
            raise ValueError("Loan must be approved before PRN processing")
        
        # Issue PRN and generate certificate
        transaction, certificate = loan_application.issue_prn_and_certificate()
        
        if certificate:
            # Generate PDF certificate
            pdf_path = self.certificate_service.generate_certificate(certificate)
            
            # Generate tripartite contract
            self._generate_tripartite_contract(certificate)
            
            # Send certificate via email (placeholder for email service)
            self._send_certificate_email(certificate, pdf_path)
            
            return certificate
        
        return None
    
    def _generate_tripartite_contract(self, certificate):
        """
        Generate tripartite contract for the certificate
        """
        try:
            from contracts.services import ContractGenerationService
            
            contract_service = ContractGenerationService()
            contract = contract_service.create_tripartite_contract(certificate)
            
            print(f"Tripartite contract {contract.contract_number} generated for certificate {certificate.certificate_number}")
            return contract
            
        except Exception as e:
            print(f"Failed to generate tripartite contract: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _send_certificate_email(self, certificate, pdf_path):
        """
        Send certificate via email with PDF attachment
        """
        try:
            from notifications.email_service import email_service
            
            # Get user's preferred language (default to English)
            user_language = getattr(certificate.user, 'language', 'en')
            
            success = email_service.send_prn_certificate_email(
                certificate=certificate,
                pdf_path=pdf_path,
                language=user_language
            )
            
            if success:
                print(f"Certificate email sent successfully to {certificate.user.email}")
            else:
                print(f"Failed to send certificate email to {certificate.user.email}")
                
        except Exception as e:
            print(f"Error sending certificate email: {e}")
            # Fallback to simple print
            print(f"Certificate {certificate.certificate_number} generated at {pdf_path}")
            print(f"Email would be sent to {certificate.user.email}")
    
    def release_pledge(self, loan_application):
        """
        Release PRN pledge after loan repayment
        """
        try:
            certificate = loan_application.certificate
            
            # Get wallet service
            wallet_service = WalletService.objects.get(service_name='Nova PRN Service')
            
            # Unpledge PRN
            wallet_service.unpledge_prn(
                certificate.prn_amount,
                certificate.user,
                loan_application.id
            )
            
            # Update certificate status
            certificate.status = 'released'
            certificate.pledge_release_date = datetime.now()
            certificate.save()
            
            # Update loan application
            loan_application.prn_pledged = False
            loan_application.save()
            
            return True
            
        except Exception as e:
            print(f"Error releasing pledge: {e}")
            return False