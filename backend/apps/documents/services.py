import hashlib
import io
import logging
from datetime import timedelta

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

from common.utils import generate_document_number

from .models import Document

logger = logging.getLogger(__name__)

try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except (ImportError, OSError) as e:
    HAS_WEASYPRINT = False
    logger.warning(f"WeasyPrint not available: {e}. Using reportlab fallback for PDFs.")


class DocumentService:
    @staticmethod
    def _generate_pdf(template_name, context):
        html_string = render_to_string(template_name, context)
        if not HAS_WEASYPRINT:
            raise RuntimeError("WeasyPrint is not available")
        html = HTML(string=html_string)
        pdf_bytes = html.write_pdf()
        return pdf_bytes

    @staticmethod
    def _generate_simple_pdf(title, lines, signature_info=None):
        """Generate a PDF using reportlab.

        Args:
            title: Document title
            lines: Content lines (## for headings, --- for dividers)
            signature_info: Optional dict with keys:
                - signature_text: The typed full name (rendered italic)
                - signer_name: Name of the person who signed
                - signed_at: datetime when signed
        """
        buf = io.BytesIO()
        c = pdf_canvas.Canvas(buf, pagesize=A4)
        width, height = A4

        # Header bar
        c.setFillColorRGB(0.05, 0.12, 0.25)
        c.rect(0, height - 3 * cm, width, 3 * cm, fill=True, stroke=False)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(2 * cm, height - 2 * cm, "Nova Digital Finance")
        c.setFont("Helvetica", 10)
        c.drawString(2 * cm, height - 2.6 * cm, "Digital Financing Platform")

        # Title
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(2 * cm, height - 5 * cm, title)

        # Divider
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.line(2 * cm, height - 5.4 * cm, width - 2 * cm, height - 5.4 * cm)

        # Content lines
        y = height - 6.5 * cm
        for line in lines:
            if y < 5 * cm:  # leave room for signature block
                c.showPage()
                y = height - 3 * cm
            if line.startswith("##"):
                c.setFont("Helvetica-Bold", 12)
                line = line[2:].strip()
                y -= 0.3 * cm
            elif line.startswith("---"):
                c.setStrokeColorRGB(0.85, 0.85, 0.85)
                c.line(2 * cm, y + 0.15 * cm, width - 2 * cm, y + 0.15 * cm)
                y -= 0.6 * cm
                continue
            else:
                c.setFont("Helvetica", 10)
            c.setFillColorRGB(0, 0, 0)
            c.drawString(2 * cm, y, line)
            y -= 0.6 * cm

        # Signature block
        if signature_info:
            if y < 7 * cm:
                c.showPage()
                y = height - 3 * cm

            y -= 1 * cm
            c.setStrokeColorRGB(0.85, 0.85, 0.85)
            c.line(2 * cm, y + 0.15 * cm, width - 2 * cm, y + 0.15 * cm)
            y -= 0.8 * cm

            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0, 0)
            c.drawString(2 * cm, y, "Electronic Signature")
            y -= 1 * cm

            # Render typed signature as italic text
            signature_text = signature_info.get("signature_text", "")
            if signature_text:
                c.setFont("Helvetica-BoldOblique", 18)
                c.setFillColorRGB(0.1, 0.1, 0.3)
                c.drawString(2 * cm, y, signature_text)
                y -= 0.8 * cm

            # Signature line
            c.setStrokeColorRGB(0.6, 0.6, 0.6)
            c.line(2 * cm, y, 10 * cm, y)
            y -= 0.5 * cm

            c.setFont("Helvetica", 10)
            c.setFillColorRGB(0.2, 0.2, 0.2)
            signer_name = signature_info.get("signer_name", "")
            signed_at = signature_info.get("signed_at")
            if signer_name:
                c.drawString(2 * cm, y, f"Signed by: {signer_name}")
                y -= 0.5 * cm
            if signed_at:
                c.drawString(2 * cm, y, f"Date: {signed_at.strftime('%Y-%m-%d %H:%M:%S')}")
                y -= 0.5 * cm

            c.setFont("Helvetica-Oblique", 8)
            c.setFillColorRGB(0.5, 0.5, 0.5)
            c.drawString(2 * cm, y, "This electronic signature is legally binding and verifiable.")

        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(2 * cm, 1.5 * cm, "Nova Digital Finance - This document was generated electronically.")
        c.drawRightString(width - 2 * cm, 1.5 * cm, f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}")

        c.save()
        return buf.getvalue()

    @staticmethod
    def _generate_verification_code(pdf_bytes):
        return hashlib.sha256(pdf_bytes).hexdigest()

    @staticmethod
    def _generate_qr_code(data):
        img = qrcode.make(data)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

    @staticmethod
    def generate_certificate(financing):
        context = {
            "financing": financing,
            "user": financing.user,
            "date": timezone.now(),
            "document_number": generate_document_number("CRT"),
        }

        try:
            pdf_bytes = DocumentService._generate_pdf(
                "pdfs/certificate.html", context
            )
        except Exception as e:
            logger.error(f"Failed to generate certificate PDF: {e}")
            now = timezone.now()
            pdf_bytes = DocumentService._generate_simple_pdf(
                f"Financing Certificate - {financing.application_number}",
                [
                    f"Document Number: {context['document_number']}",
                    f"Date: {now.strftime('%Y-%m-%d %H:%M')}",
                    "---",
                    "## Client Information",
                    f"Name: {financing.user.get_full_name()}",
                    f"Client ID: {getattr(financing.user, 'client_id', 'N/A')}",
                    f"Email: {financing.user.email}",
                    "---",
                    "## Financing Details",
                    f"Application Number: {financing.application_number}",
                    f"Financing Amount: {financing.bronova_amount}",
                    f"USD Equivalent: ${financing.usd_equivalent}",
                    f"Status: {financing.get_status_display()}",
                    "---",
                    "",
                    "This certificate confirms the above financing arrangement",
                    "has been registered with Nova Digital Finance.",
                    "",
                    "This is an electronically generated document.",
                ],
            )

        verification_code = DocumentService._generate_verification_code(pdf_bytes)

        document = Document.objects.create(
            user=financing.user,
            financing=financing,
            document_type=Document.DocumentType.CERTIFICATE,
            title=f"Financing Certificate - {financing.application_number}",
            document_number=context["document_number"],
            verification_code=verification_code,
            metadata={
                "bronova_amount": str(financing.bronova_amount),
                "application_number": financing.application_number,
            },
        )

        document.file.save(
            f"certificate_{financing.application_number}.pdf",
            ContentFile(pdf_bytes),
        )

        return document

    @staticmethod
    def generate_contract(financing):
        context = {
            "financing": financing,
            "user": financing.user,
            "profile": getattr(financing.user, "profile", None),
            "installments": financing.installments.all(),
            "date": timezone.now(),
            "document_number": generate_document_number("CTR"),
        }

        try:
            pdf_bytes = DocumentService._generate_pdf(
                "pdfs/contract.html", context
            )
        except Exception as e:
            logger.error(f"Failed to generate contract PDF: {e}")
            now = timezone.now()
            profile = getattr(financing.user, "profile", None)
            pdf_bytes = DocumentService._generate_simple_pdf(
                f"Financing Contract - {financing.application_number}",
                [
                    f"Document Number: {context['document_number']}",
                    f"Date: {now.strftime('%Y-%m-%d %H:%M')}",
                    "---",
                    "## Parties",
                    f"Borrower: {financing.user.get_full_name()}",
                    f"Email: {financing.user.email}",
                    f"Phone: {getattr(profile, 'phone_number', 'N/A') if profile else 'N/A'}",
                    "Lender: Nova Digital Finance",
                    "---",
                    "## Financing Terms",
                    f"Application Number: {financing.application_number}",
                    f"Financing Amount: {financing.bronova_amount}",
                    f"USD Equivalent: ${financing.usd_equivalent}",
                    f"Repayment Period: {financing.repayment_period_months} months",
                    f"Monthly Installment: {financing.monthly_installment}",
                    f"Processing Fee: {financing.fee_amount}",
                    f"Total with Fee: {financing.total_with_fee}",
                    "---",
                    "## Terms and Conditions",
                    "1. The borrower agrees to repay the total amount in monthly installments.",
                    "2. Late payments may incur additional charges as per platform policy.",
                    "3. The borrower acknowledges all terms of the financing program.",
                    "4. This contract is binding upon electronic signature by all parties.",
                    "5. All disputes shall be resolved per the platform's dispute resolution policy.",
                    "---",
                    "",
                    "By signing this document, all parties agree to the terms above.",
                ],
            )

        verification_code = DocumentService._generate_verification_code(pdf_bytes)

        document = Document.objects.create(
            user=financing.user,
            financing=financing,
            document_type=Document.DocumentType.CONTRACT,
            title=f"Financing Contract - {financing.application_number}",
            document_number=context["document_number"],
            verification_code=verification_code,
            metadata={
                "bronova_amount": str(financing.bronova_amount),
                "application_number": financing.application_number,
                "repayment_months": financing.repayment_period_months,
            },
        )

        document.file.save(
            f"contract_{financing.application_number}.pdf",
            ContentFile(pdf_bytes),
        )

        return document

    @staticmethod
    def generate_receipt(payment):
        context = {
            "payment": payment,
            "user": payment.user,
            "date": timezone.now(),
            "document_number": generate_document_number("RCP"),
        }

        try:
            pdf_bytes = DocumentService._generate_pdf(
                "pdfs/receipt.html", context
            )
        except Exception as e:
            logger.error(f"Failed to generate receipt PDF: {e}")
            now = timezone.now()
            pdf_bytes = DocumentService._generate_simple_pdf(
                f"Payment Receipt - {payment.transaction_reference}",
                [
                    f"Document Number: {context['document_number']}",
                    f"Date: {now.strftime('%Y-%m-%d %H:%M')}",
                    "---",
                    "## Payment Details",
                    f"Transaction Reference: {payment.transaction_reference}",
                    f"Amount: {payment.amount}",
                    f"Payment Type: {getattr(payment, 'payment_type', 'N/A')}",
                    f"Status: {getattr(payment, 'status', 'completed')}",
                    "---",
                    "## Client Information",
                    f"Name: {payment.user.get_full_name()}",
                    f"Email: {payment.user.email}",
                    "---",
                    "",
                    "Thank you for your payment.",
                    "This is an electronically generated receipt.",
                ],
            )

        verification_code = DocumentService._generate_verification_code(pdf_bytes)

        document = Document.objects.create(
            user=payment.user,
            financing=payment.financing,
            document_type=Document.DocumentType.RECEIPT,
            title=f"Payment Receipt - {payment.transaction_reference}",
            document_number=context["document_number"],
            verification_code=verification_code,
            metadata={
                "payment_id": str(payment.id),
                "amount": str(payment.amount),
                "transaction_reference": payment.transaction_reference,
            },
        )

        document.file.save(
            f"receipt_{payment.transaction_reference}.pdf",
            ContentFile(pdf_bytes),
        )

        return document

    @staticmethod
    def generate_kyc_summary(kyc_application):
        context = {
            "kyc": kyc_application,
            "user": kyc_application.user,
            "profile": getattr(kyc_application.user, "profile", None),
            "documents": kyc_application.documents.all(),
            "date": timezone.now(),
        }

        try:
            pdf_bytes = DocumentService._generate_pdf(
                "pdfs/kyc_summary.html", context
            )
        except Exception as e:
            logger.error(f"Failed to generate KYC summary PDF: {e}")
            now = timezone.now()
            pdf_bytes = DocumentService._generate_simple_pdf(
                f"KYC Summary - {kyc_application.user.get_full_name()}",
                [
                    f"Date: {now.strftime('%Y-%m-%d %H:%M')}",
                    "---",
                    "## Client Information",
                    f"Name: {kyc_application.user.get_full_name()}",
                    f"Client ID: {getattr(kyc_application.user, 'client_id', 'N/A')}",
                    f"Email: {kyc_application.user.email}",
                    "---",
                    "## KYC Status",
                    f"Application Status: {getattr(kyc_application, 'status', 'N/A')}",
                    f"Submitted: {getattr(kyc_application, 'created_at', now).strftime('%Y-%m-%d') if hasattr(getattr(kyc_application, 'created_at', now), 'strftime') else 'N/A'}",
                    "---",
                    "",
                    "This is an electronically generated KYC summary document.",
                ],
            )

        kyc_application.pdf_summary.save(
            f"kyc_summary_{kyc_application.user.client_id}.pdf",
            ContentFile(pdf_bytes),
        )

        return kyc_application

    @staticmethod
    def regenerate_signed_document(document):
        """Regenerate a document's PDF with the signature embedded."""
        from apps.signatures.models import Signature

        # Find the signature for this document
        sig_request = document.signature_requests.filter(status="signed").first()
        if not sig_request:
            logger.warning(f"No signed signature request for document {document.id}")
            return

        try:
            signature = sig_request.signature
        except Signature.DoesNotExist:
            logger.warning(f"No signature record for request {sig_request.id}")
            return

        signature_info = {
            "signature_text": signature.signature_text or document.user.get_full_name(),
            "signer_name": document.user.get_full_name(),
            "signed_at": sig_request.signed_at,
        }

        financing = document.financing
        if not financing:
            logger.warning(f"No financing linked to document {document.id}")
            return

        # Build content lines based on document type
        now = timezone.now()
        profile = getattr(financing.user, "profile", None)

        if document.document_type == Document.DocumentType.CONTRACT:
            lines = [
                f"Document Number: {document.document_number}",
                f"Date: {document.created_at.strftime('%Y-%m-%d %H:%M')}",
                "---",
                "## Parties",
                f"Borrower: {financing.user.get_full_name()}",
                f"Email: {financing.user.email}",
                f"Phone: {getattr(profile, 'phone_number', 'N/A') if profile else 'N/A'}",
                "Lender: Nova Digital Finance",
                "---",
                "## Financing Terms",
                f"Application Number: {financing.application_number}",
                f"Financing Amount: {financing.bronova_amount}",
                f"USD Equivalent: ${financing.usd_equivalent}",
                f"Repayment Period: {financing.repayment_period_months} months",
                f"Monthly Installment: {financing.monthly_installment}",
                f"Processing Fee: {financing.fee_amount}",
                f"Total with Fee: {financing.total_with_fee}",
                "---",
                "## Terms and Conditions",
                "1. The borrower agrees to repay the total amount in monthly installments.",
                "2. Late payments may incur additional charges as per platform policy.",
                "3. The borrower acknowledges all terms of the financing program.",
                "4. This contract is binding upon electronic signature by all parties.",
                "5. All disputes shall be resolved per the platform's dispute resolution policy.",
                "---",
            ]
            title = f"Financing Contract - {financing.application_number}"
        elif document.document_type == Document.DocumentType.CERTIFICATE:
            lines = [
                f"Document Number: {document.document_number}",
                f"Date: {document.created_at.strftime('%Y-%m-%d %H:%M')}",
                "---",
                "## Client Information",
                f"Name: {financing.user.get_full_name()}",
                f"Client ID: {getattr(financing.user, 'client_id', 'N/A')}",
                f"Email: {financing.user.email}",
                "---",
                "## Financing Details",
                f"Application Number: {financing.application_number}",
                f"Financing Amount: {financing.bronova_amount}",
                f"USD Equivalent: ${financing.usd_equivalent}",
                f"Status: {financing.get_status_display()}",
                "---",
            ]
            title = f"Financing Certificate - {financing.application_number}"
        else:
            lines = [
                f"Document Number: {document.document_number}",
                f"Date: {document.created_at.strftime('%Y-%m-%d %H:%M')}",
                "---",
            ]
            title = document.title

        # Generate new PDF with signature
        pdf_bytes = DocumentService._generate_simple_pdf(title, lines, signature_info=signature_info)

        # Delete old file to avoid Django creating a suffixed duplicate
        old_name = document.file.name
        storage = document.file.storage
        if old_name and storage.exists(old_name):
            storage.delete(old_name)

        # Save new PDF and update database (must include "file" in update_fields!)
        document.file.save(old_name, ContentFile(pdf_bytes), save=False)
        document.verification_code = DocumentService._generate_verification_code(pdf_bytes)
        document.save(update_fields=["verification_code", "file"])

        logger.info(f"Regenerated signed document {document.id} with embedded signature")

    @staticmethod
    def create_signing_request(financing):
        from apps.signatures.models import SignatureRequest

        expires_at = timezone.now() + timedelta(days=7)
        sig_requests = []

        # Get or create the contract document
        contract = Document.objects.filter(
            financing=financing,
            document_type=Document.DocumentType.CONTRACT,
        ).first()

        if not contract:
            contract = DocumentService.generate_contract(financing)

        # Create signing request for contract (if not already signed)
        if not contract.signature_requests.filter(status__in=["pending", "signed"]).exists():
            sig_requests.append(SignatureRequest.objects.create(
                document=contract,
                user=financing.user,
                expires_at=expires_at,
            ))

        # Get or create the certificate document
        certificate = Document.objects.filter(
            financing=financing,
            document_type=Document.DocumentType.CERTIFICATE,
        ).first()

        if not certificate:
            certificate = DocumentService.generate_certificate(financing)

        # Create signing request for certificate (if not already signed)
        if not certificate.signature_requests.filter(status__in=["pending", "signed"]).exists():
            sig_requests.append(SignatureRequest.objects.create(
                document=certificate,
                user=financing.user,
                expires_at=expires_at,
            ))

        financing.status = "pending_signature"
        financing.save(update_fields=["status", "updated_at"])

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify(
                user=financing.user,
                title="Documents Ready for Signing",
                message=f"Your documents for {financing.application_number} are ready for signing. "
                        "Please review and sign within 7 days.",
                category="signature",
                action_url="/dashboard/signatures",
            )
        except Exception as e:
            logger.error(f"Failed to send signing notification: {e}")

        return sig_requests
