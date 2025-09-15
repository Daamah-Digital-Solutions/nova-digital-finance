import os
from datetime import timedelta
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.template import Template, Context
from django.utils import timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

from .models import (
    ContractTemplate, TripartiteContract, ElectronicSignature,
    ContractAmendment, ContractNotification
)
from pronova.models import ElectronicCertificate

class ContractGenerationService:
    """
    Service for generating tripartite contracts and legal documents
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for contracts"""
        self.title_style = ParagraphStyle(
            'ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        self.section_style = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=15,
            spaceBefore=20,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        self.clause_style = ParagraphStyle(
            'ClauseStyle',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        )
        
        self.important_style = ParagraphStyle(
            'Important',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            textColor=colors.red,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        )

    def create_tripartite_contract(self, certificate: ElectronicCertificate) -> TripartiteContract:
        """
        Create a tripartite contract for a certificate
        """
        loan_application = certificate.loan_application
        
        contract = TripartiteContract.objects.create(
            loan_application=loan_application,
            certificate=certificate,
            client=certificate.user,
            prn_amount=certificate.prn_amount,
            usd_value=certificate.usd_value,
            loan_duration_months=loan_application.duration_months,
            monthly_payment_usd=loan_application.monthly_payment_usd,
            status='pending_signatures'
        )
        
        # Generate contract PDF
        self.generate_contract_pdf(contract)
        
        # Create a Document record for the frontend Documents page
        from documents.models import Document
        Document.objects.create(
            user=certificate.user,
            loan_application=loan_application,
            document_type='financing_contract',
            title=f"Tripartite Contract - {contract.contract_number}",
            document_number=contract.contract_number,
            generated_data={
                'contract_id': str(contract.id),
                'contract_number': contract.contract_number,
                'prn_amount': str(contract.prn_amount),
                'usd_value': str(contract.usd_value),
                'status': contract.status
            },
            status='generated'
        )
        
        # Create notification for client signature
        self.create_signature_notification(contract)
        
        return contract

    def generate_contract_pdf(self, contract: TripartiteContract) -> str:
        """
        Generate PDF for tripartite contract
        """
        # Create directory
        media_dir = os.path.join(settings.MEDIA_ROOT, 'contracts')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generate filename
        filename = f"contract_{contract.contract_number}.pdf"
        file_path = os.path.join(media_dir, filename)
        
        # Create PDF
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=72
        )
        
        story = []
        
        # Header
        self._add_contract_header(story, contract)
        
        # Parties section
        self._add_parties_section(story, contract)
        
        # Recitals
        self._add_recitals(story, contract)
        
        # Terms and conditions
        self._add_terms_and_conditions(story, contract)
        
        # PRN and Certificate details
        self._add_prn_details(story, contract)
        
        # Capimax investment provisions
        self._add_capimax_provisions(story, contract)
        
        # Payment terms
        self._add_payment_terms(story, contract)
        
        # Default and remedies
        self._add_default_provisions(story, contract)
        
        # General provisions
        self._add_general_provisions(story, contract)
        
        # Signature page
        self._add_signature_page(story, contract)
        
        # Build PDF
        doc.build(story)
        
        # Update contract record
        contract.pdf_generated = True
        contract.pdf_file_path = f'contracts/{filename}'
        contract.save()
        
        return file_path

    def _add_contract_header(self, story, contract):
        """Add contract header"""
        title = Paragraph("TRIPARTITE FINANCING AND INVESTMENT AGREEMENT", self.title_style)
        story.append(title)
        
        subtitle = Paragraph("Between Nova Digital Financing, Client, and Capimax Platform", 
                            ParagraphStyle('Subtitle', parent=self.styles['Normal'], 
                                         fontSize=12, alignment=TA_CENTER, spaceAfter=20))
        story.append(subtitle)
        
        # Contract details table
        contract_info = [
            ['Contract Number:', contract.contract_number],
            ['Effective Date:', contract.effective_date.strftime('%B %d, %Y') if contract.effective_date else 'Upon Full Execution'],
            ['Expiry Date:', contract.expiry_date.strftime('%B %d, %Y')],
            ['Certificate Reference:', contract.certificate.certificate_number],
            ['Loan Application:', str(contract.loan_application.id)]
        ]
        
        contract_table = Table(contract_info, colWidths=[2.5*inch, 3.5*inch])
        contract_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(contract_table)
        story.append(Spacer(1, 20))

    def _add_parties_section(self, story, contract):
        """Add parties section"""
        header = Paragraph("PARTIES TO THIS AGREEMENT", self.section_style)
        story.append(header)
        
        parties_text = f"""
        This Tripartite Financing and Investment Agreement ("Agreement") is entered into on 
        {timezone.now().strftime('%B %d, %Y')} by and between:
        
        <b>PARTY A - NOVA DIGITAL FINANCING</b> ("Nova")
        A digital financing company specializing in cryptocurrency-backed loans
        Address: [Nova Finance Business Address]
        
        <b>PARTY B - CLIENT</b> ("Client")
        Name: {contract.client.get_full_name() or 'Not Provided'}
        Email: {contract.client.email}
        User ID: {contract.client.id}
        
        <b>PARTY C - CAPIMAX INVESTMENT PLATFORM</b> ("Capimax")
        An investment platform accepting Nova's electronic certificates
        Platform: www.capimax.com (Representative platform)
        
        <b>CERTIFICATE REFERENCE</b>
        Electronic Certificate: {contract.certificate.certificate_number}
        PRN Amount: {contract.prn_amount:,.2f} PRN
        USD Equivalent: ${contract.usd_value:,.2f} USD
        """
        
        parties_para = Paragraph(parties_text, self.clause_style)
        story.append(parties_para)
        story.append(Spacer(1, 15))

    def _add_recitals(self, story, contract):
        """Add recitals section"""
        header = Paragraph("RECITALS", self.section_style)
        story.append(header)
        
        recitals_text = f"""
        WHEREAS, Client has applied for and received approval for a loan from Nova in the amount of 
        ${contract.usd_value:,.2f} USD;
        
        WHEREAS, Nova operates a digital financing system using Pronova (PRN) tokens, which are 
        cryptocurrency tokens pegged 1:1 with the United States Dollar;
        
        WHEREAS, as collateral for the loan, Nova has issued {contract.prn_amount:,.2f} PRN tokens 
        to Client, which tokens are pledged to Nova until full repayment of the loan;
        
        WHEREAS, Nova has issued Electronic Certificate {contract.certificate.certificate_number} 
        to Client as evidence of ownership of the PRN tokens;
        
        WHEREAS, Client desires to use said Electronic Certificate for investment purposes on the 
        Capimax platform while the PRN tokens remain pledged to Nova;
        
        WHEREAS, Capimax agrees to accept Nova's Electronic Certificates as valid investment 
        instruments and to treat Certificate holders as legitimate investors;
        
        WHEREAS, the parties desire to establish the terms and conditions governing this tripartite 
        relationship;
        
        NOW THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:
        """
        
        recitals_para = Paragraph(recitals_text, self.clause_style)
        story.append(recitals_para)
        story.append(Spacer(1, 15))

    def _add_terms_and_conditions(self, story, contract):
        """Add main terms and conditions"""
        header = Paragraph("TERMS AND CONDITIONS", self.section_style)
        story.append(header)
        
        terms = [
            ("1. LOAN TERMS", f"""
            Nova has provided Client with a loan of ${contract.usd_value:,.2f} USD, disbursed in the 
            form of {contract.prn_amount:,.2f} PRN tokens. The loan term is {contract.loan_duration_months} 
            months with monthly payments of ${contract.monthly_payment_usd:,.2f} USD. The loan is 
            interest-free with only processing fees as disclosed in the loan agreement.
            """),
            
            ("2. PRN TOKEN PLEDGE", f"""
            As collateral for the loan, the {contract.prn_amount:,.2f} PRN tokens are pledged to Nova 
            and may not be transferred, sold, or otherwise disposed of by Client until full repayment 
            of the loan. Nova maintains a security interest in the PRN tokens.
            """),
            
            ("3. ELECTRONIC CERTIFICATE", f"""
            Electronic Certificate {contract.certificate.certificate_number} serves as evidence of 
            Client's ownership of the PRN tokens and authorization to use said tokens for investment 
            purposes on approved platforms, subject to the pledge restrictions herein.
            """),
            
            ("4. INVESTMENT AUTHORIZATION", """
            Client is hereby authorized to use the Electronic Certificate for investment purposes on 
            the Capimax platform. All investment decisions are made solely by Client. Nova does not 
            provide investment advice and is not responsible for investment outcomes.
            """),
            
            ("5. PROFIT RETENTION", """
            All profits, returns, and benefits derived from investments made using the Electronic 
            Certificate belong entirely to Client. Nova makes no claim to any portion of investment 
            returns. Client bears all investment risks.
            """)
        ]
        
        for term_title, term_text in terms:
            term_header = Paragraph(term_title, 
                                  ParagraphStyle('TermHeader', parent=self.styles['Normal'],
                                               fontSize=12, fontName='Helvetica-Bold', 
                                               spaceAfter=5, spaceBefore=10))
            story.append(term_header)
            
            term_para = Paragraph(term_text, self.clause_style)
            story.append(term_para)
        
        story.append(Spacer(1, 15))

    def _add_prn_details(self, story, contract):
        """Add PRN token details"""
        header = Paragraph("PRN TOKEN SPECIFICATIONS", self.section_style)
        story.append(header)
        
        prn_details = [
            ['Token Name:', 'Pronova (PRN)'],
            ['Token Amount:', f'{contract.prn_amount:,.2f} PRN'],
            ['USD Equivalent:', f'${contract.usd_value:,.2f} USD'],
            ['Exchange Rate:', '1 PRN = 1.00000000 USD (Fixed Peg)'],
            ['Blockchain:', 'Nova Finance Private Blockchain'],
            ['Token Standard:', 'Nova PRN Protocol'],
            ['Pledge Status:', 'Pledged to Nova Finance until loan repayment'],
            ['Certificate Link:', contract.certificate.certificate_number]
        ]
        
        prn_table = Table(prn_details, colWidths=[2*inch, 4*inch])
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

    def _add_capimax_provisions(self, story, contract):
        """Add Capimax-specific provisions"""
        header = Paragraph("CAPIMAX PLATFORM PROVISIONS", self.section_style)
        story.append(header)
        
        capimax_text = f"""
        <b>6. CAPIMAX RECOGNITION</b>
        Capimax acknowledges and agrees to accept Electronic Certificate {contract.certificate.certificate_number} 
        as a valid investment instrument representing ${contract.usd_value:,.2f} USD in investment capacity.
        
        <b>7. INVESTMENT PROCESSING</b>
        Capimax shall treat Client as a regular investor with full access to platform features and 
        investment opportunities. Client's certificate-based investments shall be processed identically 
        to direct cash investments.
        
        <b>8. PROFIT DISTRIBUTION</b>
        Capimax shall distribute all profits, returns, and benefits directly to Client without any 
        deduction or claim by Nova. Nova waives any right to investment returns.
        
        <b>9. PLATFORM ACCESS</b>
        Client's access to Capimax platform features is contingent upon certificate validity and 
        compliance with both Nova and Capimax terms of service.
        
        <b>10. REPORTING</b>
        Capimax may provide investment reports and statements directly to Client. Nova may request 
        general portfolio status for risk management purposes but shall not access detailed trading information.
        """
        
        capimax_para = Paragraph(capimax_text, self.clause_style)
        story.append(capimax_para)
        story.append(Spacer(1, 15))

    def _add_payment_terms(self, story, contract):
        """Add payment terms"""
        header = Paragraph("PAYMENT AND REPAYMENT TERMS", self.section_style)
        story.append(header)
        
        payment_text = f"""
        <b>11. PAYMENT SCHEDULE</b>
        Client shall make monthly payments of ${contract.monthly_payment_usd:,.2f} USD for 
        {contract.loan_duration_months} consecutive months, commencing 30 days from the effective date.
        
        <b>12. PAYMENT METHOD</b>
        Payments shall be made through Nova's designated payment processing system. Late payments 
        may incur fees as specified in the loan agreement.
        
        <b>13. EARLY REPAYMENT</b>
        Client may repay the loan in full at any time without penalty. Upon full repayment, the 
        PRN token pledge shall be immediately released.
        
        <b>14. DEFAULT</b>
        In case of payment default exceeding 30 days, Nova may exercise its rights over the pledged 
        PRN tokens, including but not limited to liquidation to satisfy the outstanding debt.
        """
        
        payment_para = Paragraph(payment_text, self.clause_style)
        story.append(payment_para)
        story.append(Spacer(1, 15))

    def _add_default_provisions(self, story, contract):
        """Add default and remedies provisions"""
        header = Paragraph("DEFAULT AND REMEDIES", self.section_style)
        story.append(header)
        
        default_text = """
        <b>15. EVENTS OF DEFAULT</b>
        The following shall constitute events of default: (a) failure to make required payments when due; 
        (b) breach of any material term of this Agreement; (c) insolvency or bankruptcy of Client.
        
        <b>16. REMEDIES</b>
        Upon default, Nova may: (a) declare the entire outstanding balance immediately due; 
        (b) liquidate pledged PRN tokens; (c) terminate Client's investment authorization.
        
        <b>17. NOTICE</b>
        Nova shall provide 15 days written notice before exercising default remedies, during which 
        Client may cure the default.
        """
        
        default_para = Paragraph(default_text, self.clause_style)
        story.append(default_para)
        story.append(Spacer(1, 15))

    def _add_general_provisions(self, story, contract):
        """Add general legal provisions"""
        header = Paragraph("GENERAL PROVISIONS", self.section_style)
        story.append(header)
        
        general_text = f"""
        <b>18. TERM</b>
        This Agreement shall remain in effect until the earlier of: (a) full repayment of the loan; 
        (b) expiration on {contract.expiry_date.strftime('%B %d, %Y')}; (c) termination by mutual consent.
        
        <b>19. GOVERNING LAW</b>
        This Agreement shall be governed by the laws of [Jurisdiction] without regard to conflict of law principles.
        
        <b>20. DISPUTE RESOLUTION</b>
        Any disputes shall be resolved through binding arbitration in accordance with commercial arbitration rules.
        
        <b>21. ENTIRE AGREEMENT</b>
        This Agreement, together with the Electronic Certificate and loan documents, constitutes the 
        entire agreement between the parties.
        
        <b>22. AMENDMENTS</b>
        This Agreement may only be amended in writing, signed by all parties.
        
        <b>23. SEVERABILITY</b>
        If any provision is deemed unenforceable, the remainder of the Agreement shall remain in full force.
        """
        
        general_para = Paragraph(general_text, self.clause_style)
        story.append(general_para)
        story.append(Spacer(1, 20))

    def _add_signature_page(self, story, contract):
        """Add signature page"""
        story.append(PageBreak())
        
        header = Paragraph("EXECUTION PAGE", self.section_style)
        story.append(header)
        
        execution_text = f"""
        IN WITNESS WHEREOF, the parties have executed this Tripartite Financing and Investment 
        Agreement as of the date first written above.
        
        Contract Number: {contract.contract_number}
        Generated: {timezone.now().strftime('%B %d, %Y at %I:%M %p')}
        """
        
        execution_para = Paragraph(execution_text, self.clause_style)
        story.append(execution_para)
        story.append(Spacer(1, 30))
        
        # Signature blocks
        signature_data = [
            ['NOVA DIGITAL FINANCING', 'CLIENT', 'CAPIMAX PLATFORM'],
            ['', '', ''],
            ['_' * 25, '_' * 25, '_' * 25],
            ['Authorized Representative', contract.client.get_full_name() or contract.client.email, 'Platform Representative'],
            ['', '', ''],
            ['Date: _______________', 'Date: _______________', 'Date: _______________'],
            ['', '', ''],
            ['Electronic Signature Available', 'Electronic Signature Required', 'API Integration']
        ]
        
        signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (2, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(signature_table)
        story.append(Spacer(1, 20))
        
        # Legal notice
        notice = Paragraph(
            "This document has been generated electronically by Nova Finance. "
            "Electronic signatures are legally binding when properly executed.",
            ParagraphStyle('Notice', parent=self.styles['Normal'], fontSize=8, 
                         alignment=TA_CENTER, textColor=colors.grey)
        )
        story.append(notice)

    def create_signature_notification(self, contract: TripartiteContract):
        """
        Create notification for contract signature requirement
        """
        notification = ContractNotification.objects.create(
            contract=contract,
            recipient=contract.client,
            notification_type='signature_required',
            title='Contract Signature Required',
            message=f'Your tripartite contract {contract.contract_number} is ready for signature. Please review and sign to activate your investment authorization.',
            action_required=True,
            action_url=f'/contracts/{contract.id}/sign/'
        )
        
        # Send email notification
        try:
            from notifications.email_service import email_service
            user_language = getattr(contract.client, 'language', 'en')
            
            email_service.send_contract_signature_email(
                contract=contract,
                language=user_language
            )
        except Exception as e:
            print(f"Failed to send contract signature email: {e}")
        
        return notification


class ElectronicSignatureService:
    """
    Service for handling electronic signatures
    """
    
    def __init__(self):
        pass
    
    def initiate_signature(self, contract: TripartiteContract, signer_user, signature_type: str, ip_address: str, user_agent: str):
        """
        Initiate electronic signature process
        """
        # Determine signer role
        if signer_user == contract.client:
            signer_role = 'client'
        else:
            signer_role = 'nova_admin'
        
        signature = ElectronicSignature.objects.create(
            contract=contract,
            signer=signer_user,
            signer_role=signer_role,
            signature_type=signature_type,
            ip_address=ip_address,
            user_agent=user_agent,
            signature_data='pending'
        )
        
        return signature
    
    def complete_signature(self, signature: ElectronicSignature, signature_data: str, verification_method: str = 'email'):
        """
        Complete electronic signature
        """
        signature.signature_data = signature_data
        signature.verification_method = verification_method
        signature.is_verified = True
        signature.verified_at = timezone.now()
        signature.save()
        
        # Update contract status
        contract = signature.contract
        
        if signature.signer_role == 'client':
            contract.client_signature_date = timezone.now()
        elif signature.signer_role == 'nova_admin':
            contract.nova_signature_date = timezone.now()
            contract.nova_signed_by = signature.signer
        
        # Check if all signatures completed
        if contract.client_signature_date and contract.nova_signature_date:
            contract.status = 'fully_executed'
            contract.effective_date = timezone.now()
            
            # Authorize Capimax investment
            contract.capimax_authorized = True
            contract.capimax_authorization_date = timezone.now()
            
            # Create completion notification
            ContractNotification.objects.create(
                contract=contract,
                recipient=contract.client,
                notification_type='contract_executed',
                title='Contract Fully Executed',
                message=f'Tripartite contract {contract.contract_number} has been fully executed. Your Capimax investment authorization is now active.'
            )
            
            # Send email notification
            try:
                from notifications.email_service import email_service
                user_language = getattr(contract.client, 'language', 'en')
                
                email_service.send_contract_executed_email(
                    contract=contract,
                    language=user_language
                )
            except Exception as e:
                print(f"Failed to send contract executed email: {e}")
        
        contract.save()
        
        return signature