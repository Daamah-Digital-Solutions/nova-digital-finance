import hashlib
import io
import logging
from datetime import timedelta

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

from common.utils import generate_document_number

from .models import Document

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    def _generate_pdf(template_name, context):
        html_string = render_to_string(template_name, context)
        html = HTML(string=html_string)
        pdf_bytes = html.write_pdf()
        return pdf_bytes

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
            pdf_bytes = b"Certificate PDF placeholder"

        verification_code = DocumentService._generate_verification_code(pdf_bytes)

        document = Document.objects.create(
            user=financing.user,
            financing=financing,
            document_type=Document.DocumentType.CERTIFICATE,
            title=f"Certificate (Sak) - {financing.application_number}",
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
            pdf_bytes = b"Contract PDF placeholder"

        verification_code = DocumentService._generate_verification_code(pdf_bytes)

        document = Document.objects.create(
            user=financing.user,
            financing=financing,
            document_type=Document.DocumentType.CONTRACT,
            title=f"Trilateral Contract - {financing.application_number}",
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
            pdf_bytes = b"Receipt PDF placeholder"

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
            pdf_bytes = b"KYC Summary PDF placeholder"

        kyc_application.pdf_summary.save(
            f"kyc_summary_{kyc_application.user.client_id}.pdf",
            ContentFile(pdf_bytes),
        )

        return kyc_application

    @staticmethod
    def create_signing_request(financing):
        from apps.signatures.models import SignatureRequest

        # Get or create the contract document
        contract = Document.objects.filter(
            financing=financing,
            document_type=Document.DocumentType.CONTRACT,
        ).first()

        if not contract:
            contract = DocumentService.generate_contract(financing)

        sig_request = SignatureRequest.objects.create(
            document=contract,
            user=financing.user,
            expires_at=timezone.now() + timedelta(days=7),
        )

        financing.status = "pending_signature"
        financing.save(update_fields=["status", "updated_at"])

        from apps.notifications.services import NotificationService
        NotificationService.notify(
            user=financing.user,
            title="Document Ready for Signing",
            message=f"Your contract for {financing.application_number} is ready for signing. "
                    "Please review and sign within 7 days.",
            category="signature",
            action_url="/dashboard/signatures",
        )

        return sig_request
