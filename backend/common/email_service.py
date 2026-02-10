"""
Email service for sending templated HTML emails.
"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending templated emails."""

    FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'https://novadf.com')
    FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Nova Digital Finance <noreply@novadf.tech>')

    @classmethod
    def _get_base_context(cls, user) -> Dict[str, Any]:
        """Get base context for all email templates."""
        return {
            'user_name': user.get_full_name() or user.email.split('@')[0],
            'user_email': user.email,
            'frontend_url': cls.FRONTEND_URL,
            'year': datetime.now().year,
        }

    @classmethod
    def _send_email(
        cls,
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None,
    ) -> bool:
        """
        Send an HTML email using a template.

        Args:
            to_email: Recipient email address
            subject: Email subject
            template_name: Template name (e.g., 'welcome' for 'emails/welcome.html')
            context: Template context dictionary
            from_email: Optional sender email (defaults to DEFAULT_FROM_EMAIL)

        Returns:
            bool: True if email was sent successfully
        """
        try:
            html_content = render_to_string(f'emails/{template_name}.html', context)
            text_content = strip_tags(html_content)

            email = EmailMultiAlternatives(
                subject=f"Nova Digital Finance - {subject}",
                body=text_content,
                from_email=from_email or cls.FROM_EMAIL,
                to=[to_email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    # ==================== User Account Emails ====================

    @classmethod
    def send_welcome_email(cls, user) -> bool:
        """Send welcome email to new user."""
        context = cls._get_base_context(user)
        context['client_id'] = user.client_id or 'Pending'

        return cls._send_email(
            to_email=user.email,
            subject="Welcome to Nova Digital Finance",
            template_name="welcome",
            context=context,
        )

    @classmethod
    def send_verification_email(cls, user, verification_url: str) -> bool:
        """Send email verification link."""
        context = cls._get_base_context(user)
        context['verification_url'] = verification_url

        return cls._send_email(
            to_email=user.email,
            subject="Verify Your Email Address",
            template_name="email_verification",
            context=context,
        )

    @classmethod
    def send_password_reset_email(cls, user, reset_url: str) -> bool:
        """Send password reset email."""
        context = cls._get_base_context(user)
        context['reset_url'] = reset_url

        return cls._send_email(
            to_email=user.email,
            subject="Reset Your Password",
            template_name="password_reset",
            context=context,
        )

    # ==================== KYC Emails ====================

    @classmethod
    def send_kyc_submitted_email(cls, kyc_application) -> bool:
        """Send KYC submission confirmation."""
        user = kyc_application.user
        context = cls._get_base_context(user)
        context['selfie_submitted'] = bool(kyc_application.selfie)

        return cls._send_email(
            to_email=user.email,
            subject="KYC Application Submitted",
            template_name="kyc_submitted",
            context=context,
        )

    @classmethod
    def send_kyc_approved_email(cls, kyc_application) -> bool:
        """Send KYC approval notification."""
        user = kyc_application.user
        context = cls._get_base_context(user)

        return cls._send_email(
            to_email=user.email,
            subject="KYC Application Approved",
            template_name="kyc_approved",
            context=context,
        )

    @classmethod
    def send_kyc_rejected_email(cls, kyc_application) -> bool:
        """Send KYC rejection notification."""
        user = kyc_application.user
        context = cls._get_base_context(user)
        context['rejection_reason'] = kyc_application.rejection_reason or "Documents could not be verified."

        return cls._send_email(
            to_email=user.email,
            subject="KYC Application Requires Attention",
            template_name="kyc_rejected",
            context=context,
        )

    # ==================== Financing Emails ====================

    @classmethod
    def send_financing_submitted_email(cls, financing) -> bool:
        """Send financing application submission confirmation."""
        user = financing.user
        context = cls._get_base_context(user)
        context.update({
            'application_number': financing.application_number,
            'amount': financing.bronova_amount,
            'period_months': financing.repayment_period_months,
            'fee_amount': financing.fee_amount,
            'monthly_installment': financing.monthly_installment,
        })

        return cls._send_email(
            to_email=user.email,
            subject="Financing Application Submitted",
            template_name="financing_submitted",
            context=context,
        )

    @classmethod
    def send_financing_active_email(cls, financing) -> bool:
        """Send financing activation notification."""
        user = financing.user
        context = cls._get_base_context(user)

        # Get first installment due date
        first_installment = financing.installments.order_by('due_date').first()
        first_due_date = first_installment.due_date if first_installment else "TBD"

        context.update({
            'application_number': financing.application_number,
            'amount': financing.bronova_amount,
            'monthly_installment': financing.monthly_installment,
            'first_due_date': first_due_date,
            'total_installments': financing.repayment_period_months,
        })

        return cls._send_email(
            to_email=user.email,
            subject="Your Financing is Now Active",
            template_name="financing_active",
            context=context,
        )

    @classmethod
    def send_financing_completed_email(cls, financing) -> bool:
        """Send financing completion notification."""
        user = financing.user
        context = cls._get_base_context(user)
        context.update({
            'application_number': financing.application_number,
            'amount': financing.bronova_amount,
            'total_paid': financing.total_with_fee,
            'completion_date': datetime.now().strftime("%B %d, %Y"),
        })

        return cls._send_email(
            to_email=user.email,
            subject="Congratulations! Financing Completed",
            template_name="financing_completed",
            context=context,
        )

    # ==================== Payment Emails ====================

    @classmethod
    def send_payment_confirmation_email(cls, payment) -> bool:
        """Send payment confirmation email."""
        user = payment.user
        context = cls._get_base_context(user)

        context.update({
            'amount': payment.amount,
            'payment_type': payment.get_payment_type_display(),
            'transaction_id': payment.stripe_payment_id or payment.crypto_tx_hash or str(payment.id)[:8],
            'payment_date': payment.created_at.strftime("%B %d, %Y at %H:%M"),
        })

        if payment.financing:
            context['application_number'] = payment.financing.application_number
            # Calculate remaining balance
            from apps.financing.models import Installment
            remaining = Installment.objects.filter(
                financing=payment.financing,
                status__in=['pending', 'due', 'overdue']
            ).count()
            if remaining > 0:
                next_installment = Installment.objects.filter(
                    financing=payment.financing,
                    status__in=['pending', 'due']
                ).order_by('due_date').first()
                if next_installment:
                    context['remaining_balance'] = next_installment.amount * remaining
                    context['next_due_date'] = next_installment.due_date

        return cls._send_email(
            to_email=user.email,
            subject="Payment Confirmed",
            template_name="payment_confirmation",
            context=context,
        )

    @classmethod
    def send_payment_reminder_email(cls, installment, days_until_due: int) -> bool:
        """Send payment reminder email."""
        user = installment.financing.user
        context = cls._get_base_context(user)
        context.update({
            'days_until_due': days_until_due,
            'application_number': installment.financing.application_number,
            'installment_number': installment.installment_number,
            'total_installments': installment.financing.repayment_period_months,
            'amount': installment.amount,
            'due_date': installment.due_date.strftime("%B %d, %Y"),
        })

        return cls._send_email(
            to_email=user.email,
            subject=f"Payment Reminder - Due in {days_until_due} day{'s' if days_until_due > 1 else ''}",
            template_name="payment_reminder",
            context=context,
        )

    @classmethod
    def send_payment_overdue_email(cls, installment, days_overdue: int) -> bool:
        """Send payment overdue notification."""
        user = installment.financing.user
        context = cls._get_base_context(user)
        context.update({
            'days_overdue': days_overdue,
            'application_number': installment.financing.application_number,
            'installment_number': installment.installment_number,
            'amount': installment.amount,
            'due_date': installment.due_date.strftime("%B %d, %Y"),
        })

        return cls._send_email(
            to_email=user.email,
            subject="Payment Overdue Notice",
            template_name="payment_overdue",
            context=context,
        )

    # ==================== Document/Signature Emails ====================

    @classmethod
    def send_signature_required_email(cls, signature_request) -> bool:
        """Send signature request notification."""
        user = signature_request.document.financing.user
        context = cls._get_base_context(user)
        context.update({
            'document_type': signature_request.document.get_document_type_display(),
            'application_number': signature_request.document.financing.application_number,
            'created_date': signature_request.created_at.strftime("%B %d, %Y"),
        })

        return cls._send_email(
            to_email=user.email,
            subject="Document Ready for Signature",
            template_name="signature_required",
            context=context,
        )

    @classmethod
    def send_document_signed_email(cls, signature) -> bool:
        """Send document signed confirmation."""
        user = signature.signature_request.document.financing.user
        document = signature.signature_request.document
        context = cls._get_base_context(user)
        context.update({
            'document_type': document.get_document_type_display(),
            'application_number': document.financing.application_number,
            'signed_date': signature.signed_at.strftime("%B %d, %Y at %H:%M"),
            'verification_code': document.verification_code or 'N/A',
        })

        return cls._send_email(
            to_email=user.email,
            subject="Document Signed Successfully",
            template_name="document_signed",
            context=context,
        )

    # ==================== Request Emails ====================

    @classmethod
    def send_request_received_email(cls, client_request) -> bool:
        """Send request submission confirmation."""
        user = client_request.user
        context = cls._get_base_context(user)
        context.update({
            'subject': client_request.subject,
            'request_type': client_request.get_request_type_display(),
            'submitted_date': client_request.created_at.strftime("%B %d, %Y"),
        })

        return cls._send_email(
            to_email=user.email,
            subject="We've Received Your Request",
            template_name="request_received",
            context=context,
        )

    @classmethod
    def send_request_response_email(cls, client_request) -> bool:
        """Send request response notification."""
        user = client_request.user
        context = cls._get_base_context(user)
        context.update({
            'subject': client_request.subject,
            'submitted_date': client_request.created_at.strftime("%B %d, %Y"),
            'admin_response': client_request.admin_response,
        })

        return cls._send_email(
            to_email=user.email,
            subject="Response to Your Request",
            template_name="request_response",
            context=context,
        )
