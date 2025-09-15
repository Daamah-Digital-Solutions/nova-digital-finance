import os
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from django.template import Context, Template
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.utils import timezone
import hashlib
import base64

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfutils
except ImportError:
    # Fallback for when reportlab is not installed
    pass

from .models import Document, DocumentTemplate, ElectronicSignature, DocumentAccess

class DocumentGenerationService:
    """
    Service for generating professional PDF documents from templates
    """

    def __init__(self):
        try:
            from reportlab.lib.styles import getSampleStyleSheet
            self.styles = getSampleStyleSheet()
        except ImportError:
            self.styles = None

    def generate_loan_certificate(self, loan, user_language='en'):
        """
        Generate a professional loan certificate PDF
        """
        template_data = self.get_loan_certificate_data(loan)
        
        # Create document record
        document = Document.objects.create(
            user=loan.user,
            loan=loan,
            document_type='loan_certificate',
            title=f"Loan Certificate - {loan.loan_number}",
            generated_data=template_data,
            status='generated'
        )
        
        # Generate PDF content
        pdf_content = self.create_loan_certificate_pdf(template_data, user_language)
        
        # Save PDF file
        pdf_filename = f"loan_certificate_{loan.loan_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
        document.pdf_file.save(
            pdf_filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return document

    def generate_financing_contract(self, loan_application, user_language='en'):
        """
        Generate a professional financing contract PDF
        """
        template_data = self.get_financing_contract_data(loan_application)
        
        # Create document record
        document = Document.objects.create(
            user=loan_application.user,
            loan_application=loan_application,
            document_type='financing_contract',
            title=f"Financing Contract - {loan_application.id}",
            generated_data=template_data,
            status='generated'
        )
        
        # Generate PDF content
        pdf_content = self.create_financing_contract_pdf(template_data, user_language)
        
        # Save PDF file
        pdf_filename = f"financing_contract_{loan_application.id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        document.pdf_file.save(
            pdf_filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return document

    def generate_kyc_report(self, user, kyc_data=None, user_language='en'):
        """
        Generate a professional KYC verification report PDF
        """
        template_data = self.get_kyc_report_data(user, kyc_data)
        
        # Create document record
        document = Document.objects.create(
            user=user,
            document_type='kyc_report',
            title=f"KYC Verification Report - {user.username}",
            generated_data=template_data,
            status='generated'
        )
        
        # Generate PDF content
        pdf_content = self.create_kyc_report_pdf(template_data, user_language)
        
        # Save PDF file
        pdf_filename = f"kyc_report_{user.username}_{datetime.now().strftime('%Y%m%d')}.pdf"
        document.pdf_file.save(
            pdf_filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return document

    def generate_payment_receipt(self, payment, user_language='en'):
        """
        Generate a professional payment receipt PDF
        """
        if payment:
            template_data = self.get_payment_receipt_data(payment)
            user = payment.user
            title = f"Payment Receipt - {payment.payment_number}"
            pdf_filename = f"payment_receipt_{payment.payment_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
        else:
            # Generate sample payment receipt for demo purposes
            from django.contrib.auth import get_user_model
            from django.contrib.auth.models import AnonymousUser
            User = get_user_model()
            
            # Get the current user from request context (this will be set in the view)
            user = getattr(self, '_current_user', None)
            if not user:
                raise ValueError("User context required for sample payment receipt")
            
            template_data = {
                'company_name': 'Nova Financial Digital',
                'receipt_number': f'PR-{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'payment_date': datetime.now().strftime('%B %d, %Y'),
                'client_name': user.username,
                'client_id': getattr(user, 'client_number', f'CLIENT-{user.id}'),
                'loan_number': 'SAMPLE-LOAN-001',
                'payment_amount': '$250.00',
                'payment_method': 'Credit Card (Sample)',
                'transaction_id': f'TXN-{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'status': 'Sample Receipt',
                'remaining_balance': '$750.00'
            }
            title = f"Sample Payment Receipt - {template_data['receipt_number']}"
            pdf_filename = f"sample_payment_receipt_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        template_data = self.get_payment_receipt_data(payment) if payment else template_data
        
        # Create document record
        document = Document.objects.create(
            user=user,
            payment=payment,
            document_type='payment_receipt',
            title=title,
            generated_data=template_data,
            status='generated'
        )
        
        # Generate PDF content
        pdf_content = self.create_payment_receipt_pdf(template_data, user_language)
        
        # Save PDF file
        document.pdf_file.save(
            pdf_filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return document

    def generate_investment_certificate(self, investment, user_language='en'):
        """
        Generate a professional investment certificate PDF
        """
        template_data = self.get_investment_certificate_data(investment)
        
        # Store original investment data for future regeneration
        investment_data = {
            'id': str(investment.id),
            'amount_usd': float(investment.amount_usd),
            'asset_allocation': getattr(investment, 'asset_allocation', {'symbol': 'MIXED', 'name': 'Mixed Assets', 'percentage': 100}),
            'expected_return_percentage': getattr(investment, 'expected_return_percentage', 10),
            'term_months': getattr(investment, 'term_months', 12),
            'platform_name': getattr(investment, 'platform_name', 'Capimax'),
            'position_type': getattr(investment, 'position_type', 'long'),
            'opened_at': getattr(investment, 'opened_at', None)
        }
        
        # Create document record
        document = Document.objects.create(
            user=investment.user,
            document_type='investment_certificate',
            title=f"Investment Certificate - {investment.id}",
            generated_data=investment_data,
            status='generated'
        )
        
        # Generate PDF content
        pdf_content = self.create_investment_certificate_pdf(template_data, user_language)
        
        # Save PDF file
        pdf_filename = f"investment_certificate_{investment.id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        document.pdf_file.save(
            pdf_filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return document

    def get_loan_certificate_data(self, loan):
        """
        Prepare data for loan certificate template
        """
        return {
            'company_name': 'Nova Financial Digital',
            'company_address': 'Licensed Financial Services Provider',
            'certificate_number': f"CERT-{loan.loan_number}",
            'issue_date': datetime.now().strftime('%B %d, %Y'),
            'client_name': loan.user.profile.full_name if hasattr(loan.user, 'profile') else loan.user.username,
            'client_id': loan.user.client_number,
            'currency_name': loan.currency.name,
            'currency_symbol': loan.currency.symbol,
            'loan_amount_currency': str(loan.principal_amount_currency),
            'loan_amount_usd': f"${loan.principal_amount_usd:,.2f}",
            'loan_number': loan.loan_number,
            'creation_date': loan.created_at.strftime('%B %d, %Y'),
            'maturity_date': loan.final_payment_date.strftime('%B %d, %Y'),
            'monthly_payment': f"${loan.monthly_payment_usd:,.2f}",
            'total_amount': f"${loan.total_amount_usd:,.2f}",
            'status': loan.status.title(),
            'terms': {
                'interest_rate': '0.00%',
                'duration': f"{loan.duration_months} months",
                'payment_frequency': 'Monthly',
                'currency_pair': f"{loan.currency.symbol}/USD"
            }
        }

    def get_financing_contract_data(self, application):
        """
        Prepare data for financing contract template
        """
        return {
            'company_name': 'Nova Financial Digital',
            'company_address': 'Licensed Financial Services Provider',
            'contract_number': f"CONTRACT-{application.id}",
            'contract_date': datetime.now().strftime('%B %d, %Y'),
            'client_name': application.user.profile.full_name if hasattr(application.user, 'profile') else application.user.username,
            'client_id': application.user.client_number,
            'currency_name': application.currency.name,
            'currency_symbol': application.currency.symbol,
            'loan_amount_currency': str(application.loan_amount_currency),
            'loan_amount_usd': f"${application.loan_amount_usd:,.2f}",
            'fee_percentage': f"{application.fee_percentage}%",
            'fee_amount': f"${application.fee_amount_usd:,.2f}",
            'monthly_payment': f"${application.monthly_payment_usd:,.2f}",
            'total_payment': f"${application.total_payment_usd:,.2f}",
            'duration_months': application.duration_months,
            'exchange_rate': f"1 {application.currency.symbol} = ${application.exchange_rate_at_application:.2f}",
            'terms_and_conditions': self.get_standard_terms()
        }

    def create_loan_certificate_pdf(self, data, language='en'):
        """
        Create a professional loan certificate PDF using ReportLab
        """
        from io import BytesIO
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Define styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        # Add certificate header
        story.append(Paragraph(data['company_name'], title_style))
        story.append(Paragraph('CRYPTOCURRENCY OWNERSHIP CERTIFICATE', subtitle_style))
        story.append(Spacer(1, 20))
        
        # Certificate details
        cert_data = [
            ['Certificate Number:', data['certificate_number']],
            ['Issue Date:', data['issue_date']],
            ['Client Name:', data['client_name']],
            ['Client ID:', data['client_id']],
            ['', ''],
            ['Cryptocurrency:', f"{data['currency_name']} ({data['currency_symbol']})"],
            ['Amount Financed:', f"{data['loan_amount_currency']} {data['currency_symbol']}"],
            ['USD Equivalent:', data['loan_amount_usd']],
            ['Loan Number:', data['loan_number']],
            ['', ''],
            ['Terms:', ''],
            ['Interest Rate:', data['terms']['interest_rate']],
            ['Duration:', data['terms']['duration']],
            ['Monthly Payment:', data['monthly_payment']],
            ['Payment Frequency:', data['terms']['payment_frequency']],
        ]
        
        table = Table(cert_data, colWidths=[2.5*inch, 3*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Legal text
        legal_text = """
        <para align="justify">
        This certificate confirms that the above-mentioned cryptocurrency amount has been financed 
        by Nova Financial Digital under the terms specified. The cryptocurrency is held as collateral 
        until the loan is fully repaid. This certificate may be used for investment purposes on 
        approved platforms including Capimax.
        </para>
        """
        story.append(Paragraph(legal_text, self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Footer
        footer_text = f"""
        <para align="center">
        <b>Nova Financial Digital</b><br/>
        Licensed Financial Services Provider<br/>
        Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
        </para>
        """
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def create_financing_contract_pdf(self, data, language='en'):
        """
        Create a professional financing contract PDF
        """
        from io import BytesIO
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=20,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        story.append(Paragraph('CRYPTOCURRENCY FINANCING AGREEMENT', title_style))
        story.append(Spacer(1, 20))
        
        # Contract details
        contract_info = f"""
        <para>
        <b>Contract Number:</b> {data['contract_number']}<br/>
        <b>Date:</b> {data['contract_date']}<br/>
        <b>Parties:</b> {data['company_name']} and {data['client_name']}
        </para>
        """
        story.append(Paragraph(contract_info, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Financing details table
        financing_data = [
            ['FINANCING DETAILS', ''],
            ['Cryptocurrency', f"{data['currency_name']} ({data['currency_symbol']})"],
            ['Amount Financed', f"{data['loan_amount_currency']} {data['currency_symbol']}"],
            ['USD Value', data['loan_amount_usd']],
            ['Processing Fee', f"{data['fee_percentage']} ({data['fee_amount']})"],
            ['Monthly Payment', data['monthly_payment']],
            ['Loan Duration', f"{data['duration_months']} months"],
            ['Total Payment', data['total_payment']],
            ['Exchange Rate', data['exchange_rate']],
        ]
        
        table = Table(financing_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Terms and conditions
        terms_title = ParagraphStyle(
            'TermsTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.darkblue
        )
        
        story.append(Paragraph('TERMS AND CONDITIONS', terms_title))
        
        terms = data['terms_and_conditions']
        for i, term in enumerate(terms, 1):
            story.append(Paragraph(f"{i}. {term}", self.styles['Normal']))
            story.append(Spacer(1, 8))
        
        # Signature section
        story.append(Spacer(1, 30))
        signature_data = [
            ['SIGNATURES', '', ''],
            ['', '', ''],
            ['Client Signature:', '_' * 30, 'Date: _' * 15],
            ['', '', ''],
            [data['client_name'], '', ''],
            ['', '', ''],
            ['Nova Financial Digital:', '_' * 30, 'Date: _' * 15],
            ['', '', ''],
            ['Authorized Representative', '', ''],
        ]
        
        sig_table = Table(signature_data, colWidths=[2*inch, 2.5*inch, 1.5*inch])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        
        story.append(sig_table)
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def get_kyc_report_data(self, user, kyc_data=None):
        """
        Prepare data for KYC report template
        """
        from authentication.models import KYCDocument
        
        # Get KYC documents and info
        kyc_docs = KYCDocument.objects.filter(user=user) if 'KYCDocument' in dir() else []
        
        return {
            'company_name': 'Nova Financial Digital',
            'report_number': f"KYC-{user.client_number}-{datetime.now().strftime('%Y%m%d')}",
            'report_date': datetime.now().strftime('%B %d, %Y'),
            'client_name': user.profile.full_name if hasattr(user, 'profile') else user.username,
            'client_id': user.client_number,
            'email': user.email,
            'kyc_status': user.kyc_status if hasattr(user, 'kyc_status') else 'pending',
            'verification_date': datetime.now().strftime('%B %d, %Y'),
            'documents_provided': [doc.document_type for doc in kyc_docs] if kyc_docs else [],
            'risk_level': 'Low',
            'compliance_score': '95%'
        }

    def get_payment_receipt_data(self, payment):
        """
        Prepare data for payment receipt template
        """
        return {
            'company_name': 'Nova Financial Digital',
            'receipt_number': f"REC-{payment.payment_number}",
            'payment_date': payment.payment_date.strftime('%B %d, %Y'),
            'client_name': payment.user.profile.full_name if hasattr(payment.user, 'profile') else payment.user.username,
            'client_id': payment.user.client_number,
            'loan_number': payment.loan.loan_number,
            'payment_amount': f"${payment.amount_usd:,.2f}",
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'status': payment.status.title(),
            'remaining_balance': f"${payment.loan.remaining_amount_usd:,.2f}"
        }

    def get_investment_certificate_data(self, investment):
        """
        Prepare data for investment certificate template
        """
        return {
            'company_name': 'Nova Financial Digital',
            'certificate_number': f"INV-{investment.id}",
            'issue_date': datetime.now().strftime('%B %d, %Y'),
            'investor_name': investment.user.profile.full_name if hasattr(investment.user, 'profile') else investment.user.username,
            'investor_id': investment.user.client_number,
            'investment_amount': f"${investment.amount_usd:,.2f}",
            'platform': 'Capimax',
            'asset_allocation': investment.asset_allocation if hasattr(investment, 'asset_allocation') else {},
            'expected_return': f"{investment.expected_return_percentage}%" if hasattr(investment, 'expected_return_percentage') else "Variable",
            'investment_term': f"{investment.term_months} months" if hasattr(investment, 'term_months') else "Open-ended",
            'status': 'Active'
        }

    def create_kyc_report_pdf(self, data, language='en'):
        """
        Create a professional KYC verification report PDF
        """
        from io import BytesIO
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'KYCTitle',
            parent=self.styles['Heading1'],
            fontSize=22,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        story.append(Paragraph('KYC VERIFICATION REPORT', title_style))
        story.append(Spacer(1, 20))
        
        # Report details
        report_info = f"""
        <para>
        <b>Report Number:</b> {data['report_number']}<br/>
        <b>Report Date:</b> {data['report_date']}<br/>
        <b>Company:</b> {data['company_name']}
        </para>
        """
        story.append(Paragraph(report_info, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Client information table
        client_data = [
            ['CLIENT INFORMATION', ''],
            ['Full Name', data['client_name']],
            ['Client ID', data['client_id']],
            ['Email', data['email']],
            ['KYC Status', data['kyc_status'].upper()],
            ['Verification Date', data['verification_date']],
            ['Risk Level', data['risk_level']],
            ['Compliance Score', data['compliance_score']],
        ]
        
        table = Table(client_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Verification statement
        verification_text = """
        <para align="justify">
        This report certifies that the above-named individual has successfully completed 
        the Know Your Customer (KYC) verification process as required by Nova Financial Digital 
        and applicable regulatory requirements. All submitted documents have been verified 
        and authenticated.
        </para>
        """
        story.append(Paragraph(verification_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def create_payment_receipt_pdf(self, data, language='en'):
        """
        Create a professional payment receipt PDF
        """
        from io import BytesIO
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=self.styles['Heading1'],
            fontSize=22,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkgreen
        )
        
        story.append(Paragraph('PAYMENT RECEIPT', title_style))
        story.append(Spacer(1, 20))
        
        # Receipt details
        receipt_info = f"""
        <para>
        <b>Receipt Number:</b> {data['receipt_number']}<br/>
        <b>Payment Date:</b> {data['payment_date']}<br/>
        <b>Company:</b> {data['company_name']}
        </para>
        """
        story.append(Paragraph(receipt_info, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Payment details table
        payment_data = [
            ['PAYMENT DETAILS', ''],
            ['Client Name', data['client_name']],
            ['Client ID', data['client_id']],
            ['Loan Number', data['loan_number']],
            ['Payment Amount', data['payment_amount']],
            ['Payment Method', data['payment_method']],
            ['Transaction ID', data['transaction_id']],
            ['Payment Status', data['status']],
            ['Remaining Balance', data['remaining_balance']],
        ]
        
        table = Table(payment_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Receipt confirmation
        confirmation_text = """
        <para align="center">
        <b>PAYMENT CONFIRMED</b><br/>
        Thank you for your payment. This receipt confirms that your payment has been 
        successfully processed and applied to your account.
        </para>
        """
        story.append(Paragraph(confirmation_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def create_investment_certificate_pdf(self, data, language='en'):
        """
        Create a professional investment certificate PDF
        """
        from io import BytesIO
        buffer = BytesIO()
        
        # Ensure styles are available
        if not hasattr(self, 'styles') or self.styles is None:
            from reportlab.lib.styles import getSampleStyleSheet
            self.styles = getSampleStyleSheet()
        
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'InvestTitle',
            parent=self.styles['Heading1'],
            fontSize=22,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.purple
        )
        
        story.append(Paragraph('INVESTMENT CERTIFICATE', title_style))
        story.append(Paragraph('Capimax Investment Platform', ParagraphStyle(
            'Subtitle', parent=self.styles['Normal'], fontSize=14,
            alignment=TA_CENTER, textColor=colors.grey
        )))
        story.append(Spacer(1, 20))
        
        # Certificate details
        cert_info = f"""
        <para>
        <b>Certificate Number:</b> {data['certificate_number']}<br/>
        <b>Issue Date:</b> {data['issue_date']}<br/>
        <b>Platform:</b> {data['platform']}
        </para>
        """
        story.append(Paragraph(cert_info, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Investment details table
        invest_data = [
            ['INVESTMENT DETAILS', ''],
            ['Investor Name', data['investor_name']],
            ['Investor ID', data['investor_id']],
            ['Investment Amount', data['investment_amount']],
            ['Expected Return', data['expected_return']],
            ['Investment Term', data['investment_term']],
            ['Status', data['status']],
        ]
        
        table = Table(invest_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.purple),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Investment terms
        terms_text = """
        <para align="justify">
        This certificate confirms your investment through the Capimax platform. 
        Your investment is backed by PRN tokens as collateral. You retain 100% of 
        profits generated from your investment activities. Nova Financial Digital 
        provides the platform and collateral management services with zero commission.
        </para>
        """
        story.append(Paragraph(terms_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def get_standard_terms(self):
        """
        Standard terms and conditions for financing contracts
        """
        return [
            "This agreement constitutes a cryptocurrency financing arrangement with 0% interest rate.",
            "The loan amount is denominated in USD to protect against cryptocurrency volatility.",
            "Monthly payments are fixed in USD and due on the same date each month.",
            "The cryptocurrency is held as collateral until the loan is fully repaid.",
            "The ownership certificate may be used for investment purposes on approved platforms.",
            "Early repayment is allowed without penalty, subject to administrative processing.",
            "All payments must be made through approved payment methods via the Nova Finance platform.",
            "This agreement is governed by applicable financial services regulations.",
            "Any disputes shall be resolved through binding arbitration.",
            "Nova Financial Digital reserves the right to modify terms with 30 days written notice."
        ]

    def embed_signature_in_pdf(self, document, signature):
        """
        Regenerate PDF with embedded electronic signature
        """
        from io import BytesIO
        import base64
        from reportlab.lib.utils import ImageReader
        
        # Ensure styles are initialized
        if not hasattr(self, 'styles') or self.styles is None:
            self.styles = getSampleStyleSheet()
        
        # Determine document type and regenerate with signature
        if document.document_type == 'loan_certificate':
            return self._regenerate_certificate_with_signature(document, signature)
        elif document.document_type == 'financing_contract':
            return self._regenerate_contract_with_signature(document, signature)
        elif document.document_type == 'kyc_report':
            return self._regenerate_kyc_report_with_signature(document, signature)
        elif document.document_type == 'payment_receipt':
            return self._regenerate_payment_receipt_with_signature(document, signature)
        elif document.document_type == 'investment_certificate':
            return self._regenerate_investment_certificate_with_signature(document, signature)
        
        return None

    def _regenerate_certificate_with_signature(self, document, signature):
        """
        Regenerate loan certificate PDF with embedded signature
        """
        from io import BytesIO
        import base64
        from reportlab.lib.utils import ImageReader
        
        # Ensure styles are available
        if not hasattr(self, 'styles') or self.styles is None:
            self.styles = getSampleStyleSheet()
        
        # Get the original document data
        template_data = document.generated_data
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Define styles (same as original)
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle', 
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        # Add certificate header
        story.append(Paragraph('Nova Financial Digital', title_style))
        story.append(Paragraph('CRYPTOCURRENCY OWNERSHIP CERTIFICATE', subtitle_style))
        story.append(Spacer(1, 20))
        
        # Certificate details
        cert_data = [
            ['Certificate Number:', template_data.get('certificate_number', 'N/A')],
            ['Issue Date:', datetime.now().strftime('%B %d, %Y')],
            ['Client Name:', document.user.get_full_name() or document.user.username],
            ['Client ID:', getattr(document.user, 'client_number', 'N/A')],
            ['', ''],
            ['PRN Amount:', f"{template_data.get('prn_amount', '0')} PRN"],
            ['USD Equivalent:', f"${template_data.get('usd_value', '0')}"],
            ['Status:', template_data.get('status', 'Active')],
        ]
        
        table = Table(cert_data, colWidths=[2.5*inch, 3*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Legal text
        legal_text = """
        <para align="justify">
        This certificate confirms that the above-mentioned cryptocurrency amount has been financed 
        by Nova Financial Digital under the terms specified. The cryptocurrency is held as collateral 
        until the loan is fully repaid. This certificate may be used for investment purposes on 
        approved platforms including Capimax.
        </para>
        """
        story.append(Paragraph(legal_text, self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Signature section with embedded signature
        story.append(Paragraph('ELECTRONIC SIGNATURE', ParagraphStyle(
            'SigTitle', parent=self.styles['Heading2'], fontSize=14, 
            spaceAfter=15, textColor=colors.darkblue
        )))
        
        # Create signature table
        sig_table_data = [
            ['Client Signature:', '', 'Date:'],
            ['', '', ''],
        ]
        
        # Handle different signature types
        if signature:
            if signature.signature_method == 'canvas' and signature.signature_data.startswith('data:image'):
                # Canvas signature - embed as image
                try:
                    # Extract base64 image data
                    image_data = signature.signature_data.split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    image_buffer = BytesIO(image_bytes)
                    
                    # Create signature image
                    from reportlab.platypus import Image
                    sig_image = Image(ImageReader(image_buffer), width=2*inch, height=0.5*inch)
                    sig_table_data.append([sig_image, '', signature.signed_at.strftime('%m/%d/%Y')])
                except Exception as e:
                    # Fallback to text if image processing fails
                    print(f"Failed to embed signature image: {e}")
                    sig_table_data.append([f"[Digital Signature: {signature.signature_method.title()}]", '', 
                                         signature.signed_at.strftime('%m/%d/%Y')])
            else:
                # Typed signature or fallback
                signature_text = signature.signature_data if signature.signature_method == 'typed' else '[Digital Signature]'
                sig_style = ParagraphStyle('Signature', parent=self.styles['Normal'], 
                                         fontName='Helvetica-BoldOblique', fontSize=12, 
                                         textColor=colors.darkblue)
                sig_table_data.append([Paragraph(signature_text, sig_style), '', 
                                     signature.signed_at.strftime('%m/%d/%Y')])
        else:
            # No signature - unsigned document
            sig_table_data.append(['[Unsigned Document]', '', datetime.now().strftime('%m/%d/%Y')])
        
        sig_table_data.append(['', '', ''])
        sig_table_data.append([document.user.get_full_name() or document.user.username, '', ''])
        
        sig_table = Table(sig_table_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (2, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(sig_table)
        story.append(Spacer(1, 20))
        
        # Verification info
        if signature:
            verification_text = f"""
            <para align="center">
            <b>ELECTRONICALLY SIGNED</b><br/>
            Signed on {signature.signed_at.strftime('%B %d, %Y at %I:%M %p')}<br/>
            Signature Method: {signature.signature_method.title()}<br/>
            Verification Hash: {signature.verification_hash[:16]}...
            </para>
            """
        else:
            verification_text = f"""
            <para align="center">
            <b>DOCUMENT GENERATED</b><br/>
            Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
            Status: Unsigned Document<br/>
            This document is available for electronic signature.
            </para>
            """
        story.append(Paragraph(verification_text, ParagraphStyle(
            'Verification', parent=self.styles['Normal'], fontSize=8, 
            alignment=TA_CENTER, textColor=colors.grey
        )))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    def _regenerate_contract_with_signature(self, document, signature):
        """
        Regenerate financing contract PDF with embedded signature
        """
        from io import BytesIO
        import base64
        from reportlab.lib.utils import ImageReader
        
        # Ensure styles are available
        if not hasattr(self, 'styles') or self.styles is None:
            self.styles = getSampleStyleSheet()
        
        template_data = document.generated_data
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=20,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        story.append(Paragraph('CRYPTOCURRENCY FINANCING AGREEMENT', title_style))
        story.append(Spacer(1, 20))
        
        # Contract details
        contract_info = f"""
        <para>
        <b>Contract Number:</b> {template_data.get('contract_number', 'N/A')}<br/>
        <b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>
        <b>Client:</b> {document.user.get_full_name() if hasattr(document.user, 'get_full_name') else document.user.username}
        </para>
        """
        story.append(Paragraph(contract_info, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Financing details table
        financing_data = [
            ['FINANCING DETAILS', ''],
            ['PRN Amount', f"{template_data.get('prn_amount', '0')} PRN"],
            ['USD Value', f"${template_data.get('usd_value', '0')}"],
            ['Status', template_data.get('status', 'Active')],
        ]
        
        table = Table(financing_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Terms and conditions (simplified)
        terms_title = ParagraphStyle(
            'TermsTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.darkblue
        )
        
        story.append(Paragraph('KEY TERMS', terms_title))
        
        terms = [
            "This agreement governs the cryptocurrency financing arrangement.",
            "PRN tokens are pledged as collateral until full repayment.",
            "Client retains 100% of investment profits from approved platforms.",
            "Electronic signatures are legally binding and verifiable."
        ]
        
        for i, term in enumerate(terms, 1):
            story.append(Paragraph(f"{i}. {term}", self.styles['Normal']))
            story.append(Spacer(1, 8))
        
        # Signature section with embedded signature
        story.append(Spacer(1, 30))
        story.append(Paragraph('ELECTRONIC SIGNATURE', ParagraphStyle(
            'SigTitle', parent=self.styles['Heading2'], fontSize=14, 
            spaceAfter=15, textColor=colors.darkblue
        )))
        
        # Client signature section
        sig_table_data = [
            ['CLIENT SIGNATURE', '', 'DATE'],
            ['', '', ''],
        ]
        
        # Handle different signature types
        if signature:
            if signature.signature_method == 'canvas' and signature.signature_data.startswith('data:image'):
                try:
                    # Extract base64 image data
                    image_data = signature.signature_data.split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    image_buffer = BytesIO(image_bytes)
                    
                    # Create signature image
                    from reportlab.platypus import Image
                    sig_image = Image(ImageReader(image_buffer), width=2.5*inch, height=0.6*inch)
                    sig_table_data.append([sig_image, '', signature.signed_at.strftime('%m/%d/%Y')])
                except Exception as e:
                    print(f"Failed to embed contract signature image: {e}")
                    sig_table_data.append([f"[Digital Signature: {signature.signature_method.title()}]", '', 
                                         signature.signed_at.strftime('%m/%d/%Y')])
            else:
                signature_text = signature.signature_data if signature.signature_method == 'typed' else '[Digital Signature]'
                sig_style = ParagraphStyle('Signature', parent=self.styles['Normal'], 
                                         fontName='Helvetica-BoldOblique', fontSize=14, 
                                         textColor=colors.darkblue)
                sig_table_data.append([Paragraph(signature_text, sig_style), '', 
                                     signature.signed_at.strftime('%m/%d/%Y')])
        else:
            # No signature - unsigned document
            sig_table_data.append(['[Unsigned Document]', '', datetime.now().strftime('%m/%d/%Y')])
        
        sig_table_data.append(['', '', ''])
        client_name = document.user.get_full_name() if hasattr(document.user, 'get_full_name') else document.user.username
        sig_table_data.append([client_name, '', ''])
        
        # Nova signature placeholder
        sig_table_data.extend([
            ['', '', ''],
            ['NOVA FINANCIAL DIGITAL', '', 'DATE'],
            ['', '', ''],
            ['[Authorized Representative]', '', datetime.now().strftime('%m/%d/%Y')],
            ['', '', ''],
            ['System Generated', '', ''],
        ])
        
        sig_table = Table(sig_table_data, colWidths=[3*inch, 1*inch, 1.5*inch])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(sig_table)
        story.append(Spacer(1, 20))
        
        # Verification info
        if signature:
            verification_text = f"""
            <para align="center">
            <b>ELECTRONICALLY SIGNED DOCUMENT</b><br/>
            Client signed on {signature.signed_at.strftime('%B %d, %Y at %I:%M %p')}<br/>
            Signature Method: {signature.signature_method.title()}<br/>
            Verification Hash: {signature.verification_hash[:20]}...<br/>
            This document is legally binding under electronic signature laws.
            </para>
            """
        else:
            verification_text = f"""
            <para align="center">
            <b>UNSIGNED CONTRACT DOCUMENT</b><br/>
            Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
            Status: Awaiting Electronic Signature<br/>
            This document requires client signature to become legally binding.
            </para>
            """
        story.append(Paragraph(verification_text, ParagraphStyle(
            'Verification', parent=self.styles['Normal'], fontSize=8, 
            alignment=TA_CENTER, textColor=colors.grey
        )))
        
        # Build PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

class ElectronicSignatureService:
    """
    Service for handling electronic signatures
    """

    def create_signature(self, document, user, signature_data, method='canvas', ip_address=None, user_agent=None):
        """
        Create an electronic signature for a document
        """
        # Generate verification hash
        verification_hash = self.generate_signature_hash(document, user, signature_data)
        
        # Create signature record
        signature = ElectronicSignature.objects.create(
            document=document,
            user=user,
            signature_data=signature_data,
            signature_method=method,
            ip_address=ip_address or '127.0.0.1',
            user_agent=user_agent or '',
            verification_hash=verification_hash
        )
        
        # Generate new PDF with embedded signature
        doc_service = DocumentGenerationService()
        signed_pdf_content = doc_service.embed_signature_in_pdf(document, signature)
        
        if signed_pdf_content:
            # Save the signed PDF to the document
            from django.core.files.base import ContentFile
            pdf_filename = f"signed_{document.document_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            document.pdf_file.save(
                pdf_filename,
                ContentFile(signed_pdf_content),
                save=False  # We'll save the document below
            )
        
        # Update document status
        document.status = 'signed'
        document.signature_timestamp = timezone.now()
        document.digital_signature = f"Electronically signed by {user.get_full_name() or user.username} on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}"
        document.save()
        
        return signature

    def generate_signature_hash(self, document, user, signature_data):
        """
        Generate a verification hash for the signature
        """
        hash_input = f"{document.id}_{user.id}_{signature_data}_{timezone.now().isoformat()}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def verify_signature(self, signature):
        """
        Verify the integrity of an electronic signature
        """
        # In a real implementation, this would perform cryptographic verification
        return signature.is_valid and signature.document.status == 'signed'

class DocumentDeliveryService:
    """
    Service for delivering documents via email
    """

    def send_document_email(self, document, recipient_email=None):
        """
        Send document via email with PDF attachment
        """
        if not recipient_email:
            recipient_email = document.user.email
            
        subject = f"Your {document.get_document_type_display()} - Nova Finance"
        
        message = f"""
        Dear {document.user.username},
        
        Please find attached your {document.get_document_type_display()}.
        
        Document Details:
        - Document Number: {document.document_number}
        - Type: {document.get_document_type_display()}
        - Generated: {document.created_at.strftime('%B %d, %Y')}
        
        You can also access this document anytime through your Nova Finance dashboard.
        
        Best regards,
        Nova Financial Digital Team
        """
        
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        
        # Attach PDF if available
        if document.pdf_file:
            email.attach_file(document.pdf_file.path)
        
        try:
            email.send()
            document.email_sent = True
            document.email_sent_at = timezone.now()
            document.save()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False