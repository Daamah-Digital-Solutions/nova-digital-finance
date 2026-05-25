import hashlib
import io
import logging
from datetime import timedelta
from decimal import Decimal

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone

from common.utils import generate_document_number

from .models import Document

logger = logging.getLogger(__name__)

# Both PDF backends are optional: WeasyPrint is the primary HTML renderer
# (needs system libs like cairo/pango) and reportlab is the fallback for
# bare-bones PDFs. If either import fails we still want the rest of the
# Django process to start — historically the unconditional reportlab
# import crashed *every* /api/v1/financing/<id>/submit/ request with a
# 500 because the prod image didn't ship the wheel.
try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except (ImportError, OSError) as e:
    HAS_WEASYPRINT = False
    logger.warning(f"WeasyPrint not available: {e}. Using reportlab fallback for PDFs.")

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas as pdf_canvas
    HAS_REPORTLAB = True
except ImportError as e:
    HAS_REPORTLAB = False
    A4 = cm = ImageReader = pdf_canvas = None  # type: ignore[assignment]
    logger.warning(f"reportlab not available: {e}. Simple-PDF fallback disabled.")


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
        if not HAS_REPORTLAB:
            raise RuntimeError(
                "reportlab is not installed in this image — add it to "
                "backend/requirements.txt to enable the simple-PDF fallback."
            )
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

    # ------------------------------------------------------------------
    # Shared template-context builders. Used by both the initial
    # generate_* calls AND regenerate_signed_document so the signed PDF
    # re-renders the exact same Master Facility Agreement / Nova Finance
    # Instrument content (not a stripped-down reportlab fallback) with
    # the signature object embedded.
    # ------------------------------------------------------------------

    @staticmethod
    def _logo_path() -> str:
        """`file://` URI to the brand logo embedded in PDFs.

        WeasyPrint resolves <img src=...> as a URI relative to the base
        URL; an absolute filesystem path like "/app/templates/.../logo.png"
        triggers "Relative URI reference without a base URI" and the
        image is silently dropped. Prefix with file:// so the resolver
        treats it as an absolute URI.
        """
        import os
        from pathlib import Path
        abs_path = os.path.join(
            settings.BASE_DIR, "templates", "pdfs", "assets", "logo.png"
        )
        return Path(abs_path).resolve().as_uri()

    @staticmethod
    def _residential_address(user) -> str:
        profile = getattr(user, "profile", None)
        if not profile:
            return ""
        parts = [
            getattr(profile, "address_line_1", "") or "",
            getattr(profile, "address_line_2", "") or "",
            getattr(profile, "city", "") or "",
            getattr(profile, "state", "") or "",
            getattr(profile, "postal_code", "") or "",
            getattr(profile, "country", "") or "",
        ]
        return ", ".join(p for p in parts if p)

    @staticmethod
    def _id_or_passport(user) -> str:
        """Pick the most authoritative ID number we have on file.

        Pulls from a KYC passport/national-id record if one exists, otherwise
        falls back to the profile id_number field if the project has one.
        """
        try:
            from apps.kyc.models import KYCApplication, KYCDocument
            app = KYCApplication.objects.filter(user=user).first()
            if app:
                doc = app.documents.filter(
                    document_type__in=[
                        KYCDocument.DocumentType.PASSPORT,
                        KYCDocument.DocumentType.NATIONAL_ID,
                    ]
                ).first()
                if doc and getattr(doc, "id_number", None):
                    return doc.id_number  # not currently in schema, future-proof
        except Exception:  # pragma: no cover - defensive
            pass
        return ""

    @staticmethod
    def _maturity_date(financing):
        """Maturity = facility issue date (= created_at) + N months.

        Calendar arithmetic uses timedelta of 30 days per month to match
        FinancingService.generate_installments() which uses the same
        approximation for installment due dates.
        """
        from datetime import timedelta
        start = financing.created_at or timezone.now()
        months = int(financing.repayment_period_months or 0)
        return (start + timedelta(days=30 * months)).date()

    @staticmethod
    def _mfa_reference(financing) -> str:
        """Stable MFA reference derived from the financing application."""
        year = (financing.created_at or timezone.now()).year
        return f"MFA-NDF-{financing.application_number}-{year}"

    @staticmethod
    def _installments_table(financing) -> list[dict]:
        """Schedule A monthly installment rows with running balance.

        If FinancingService.generate_installments has already run, use the
        real installment objects; otherwise project the schedule forward
        from today using the financing's monthly_installment value.
        """
        from datetime import timedelta
        rows: list[dict] = []
        installments = list(financing.installments.all().order_by("installment_number"))
        if installments:
            total = sum((i.amount for i in installments), start=Decimal("0"))
            paid_so_far = Decimal("0")
            for inst in installments:
                paid_so_far += inst.amount
                rows.append({
                    "number": inst.installment_number,
                    "due_date": inst.due_date,
                    "amount": inst.amount,
                    "outstanding_after": (total - paid_so_far).quantize(Decimal("0.01")),
                    "status": inst.get_status_display() if hasattr(inst, "get_status_display") else "Pending",
                })
        else:
            monthly = Decimal(str(financing.monthly_installment))
            months = int(financing.repayment_period_months or 0)
            total = monthly * months
            start = (financing.created_at or timezone.now()).date()
            paid_so_far = Decimal("0")
            for i in range(1, months + 1):
                paid_so_far += monthly
                rows.append({
                    "number": i,
                    "due_date": start + timedelta(days=30 * i),
                    "amount": monthly.quantize(Decimal("0.01")),
                    "outstanding_after": (total - paid_so_far).quantize(Decimal("0.01")),
                    "status": "Pending",
                })
        return rows

    @staticmethod
    def _certificate_context(financing, document_number: str, signature=None) -> dict:
        return {
            "financing": financing,
            "user": financing.user,
            "today": timezone.now(),
            "document_number": document_number,
            "maturity_date": DocumentService._maturity_date(financing),
            "logo_path": DocumentService._logo_path(),
            "id_or_passport": DocumentService._id_or_passport(financing.user),
            "signature": signature,
            # verification_code is filled in after we hash the PDF; the
            # template guards with a default so the first render still works.
            "verification_code": "",
        }

    @staticmethod
    def _contract_context(financing, document_number: str, signature=None) -> dict:
        monthly = Decimal(str(financing.monthly_installment))
        months = int(financing.repayment_period_months or 0)
        total_payable = (monthly * months).quantize(Decimal("0.01"))
        return {
            "financing": financing,
            "user": financing.user,
            "today": timezone.now(),
            "document_number": document_number,
            "instrument_id": document_number,
            "maturity_date": DocumentService._maturity_date(financing),
            "mfa_reference": DocumentService._mfa_reference(financing),
            "logo_path": DocumentService._logo_path(),
            "id_or_passport": DocumentService._id_or_passport(financing.user),
            "residential_address": DocumentService._residential_address(financing.user),
            # Sensible defaults for clauses with placeholders the model
            # doesn't yet store. Override via Django admin / env later if
            # legal asks for different numbers.
            "default_interest_rate": getattr(settings, "FINANCING_DEFAULT_INTEREST_RATE", 18),
            "availability_days": getattr(settings, "FINANCING_AVAILABILITY_DAYS", 30),
            "total_payable": total_payable,
            "installments_table": DocumentService._installments_table(financing),
            "signature": signature,
            "verification_code": "",
        }

    @staticmethod
    def generate_certificate(financing):
        document_number = generate_document_number("CRT")
        context = DocumentService._certificate_context(financing, document_number)

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
                    f"Document Number: {document_number}",
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
        document_number = generate_document_number("CTR")
        context = DocumentService._contract_context(financing, document_number)

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
        """Regenerate a document's PDF with the signature embedded.

        Re-renders the same WeasyPrint HTML template as the original
        generation (Master Facility Agreement / Nova Finance Instrument),
        passing the signature object so the templates can drop the typed
        signature into the IN WITNESS WHEREOF block. If WeasyPrint isn't
        available, falls back to the reportlab simple-PDF path with the
        key document metadata only.
        """
        from apps.signatures.models import Signature

        sig_request = document.signature_requests.filter(status="signed").first()
        if not sig_request:
            logger.warning(f"No signed signature request for document {document.id}")
            return
        try:
            signature = sig_request.signature
        except Signature.DoesNotExist:
            logger.warning(f"No signature record for request {sig_request.id}")
            return

        financing = document.financing
        if not financing:
            logger.warning(f"No financing linked to document {document.id}")
            return

        # Re-render the rich template with the signature object so the
        # signed PDF carries the full MFA / instrument content, not a
        # stripped-down summary.
        pdf_bytes = None
        try:
            if document.document_type == Document.DocumentType.CONTRACT:
                ctx = DocumentService._contract_context(
                    financing, document.document_number, signature=signature
                )
                pdf_bytes = DocumentService._generate_pdf("pdfs/contract.html", ctx)
            elif document.document_type == Document.DocumentType.CERTIFICATE:
                ctx = DocumentService._certificate_context(
                    financing, document.document_number, signature=signature
                )
                pdf_bytes = DocumentService._generate_pdf("pdfs/certificate.html", ctx)
        except Exception as e:
            logger.error(
                "WeasyPrint re-render failed for document %s (%s); falling back to simple PDF: %s",
                document.id, document.document_type, e,
            )

        # Fallback: reportlab simple PDF with title + key fields + signature block.
        if pdf_bytes is None:
            signature_info = {
                "signature_text": signature.signature_text or document.user.get_full_name(),
                "signer_name": document.user.get_full_name(),
                "signed_at": sig_request.signed_at,
            }
            now = timezone.now()
            common_lines = [
                f"Document Number: {document.document_number}",
                f"Date: {document.created_at.strftime('%Y-%m-%d %H:%M')}",
                "---",
                "## Client",
                f"Name: {financing.user.get_full_name() or financing.user.email}",
                f"Client ID: {getattr(financing.user, 'client_id', 'N/A')}",
                f"Email: {financing.user.email}",
                "---",
                "## Financing Details",
                f"Application Number: {financing.application_number}",
                f"Facility Amount: {financing.bronova_amount} PRN ({financing.usd_equivalent} USD)",
                f"Term: {financing.repayment_period_months} months",
                f"Monthly Installment: {financing.monthly_installment} USD",
                f"Fee: {financing.fee_amount} USD ({financing.fee_percentage}%)",
                "---",
            ]
            title = (
                f"Master Facility Agreement - {financing.application_number}"
                if document.document_type == Document.DocumentType.CONTRACT
                else f"Nova Finance Instrument - {financing.application_number}"
            )
            pdf_bytes = DocumentService._generate_simple_pdf(
                title, common_lines, signature_info=signature_info
            )

        # Delete old file to avoid Django creating a suffixed duplicate
        old_name = document.file.name
        storage = document.file.storage
        if old_name and storage.exists(old_name):
            storage.delete(old_name)

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
