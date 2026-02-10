"""
Notification service for in-app notifications and email sending.
"""
import logging
from typing import Optional, Dict, Any

from django.conf import settings

from common.email_service import EmailService
from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating notifications and sending emails."""

    @staticmethod
    def notify(
        user,
        title: str,
        message: str,
        category: str = "system",
        channel: str = "both",
        action_url: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        email_template: Optional[str] = None,
        email_context: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """
        Create a notification and optionally send an email.

        Args:
            user: User to notify
            title: Notification title
            message: Notification message
            category: Notification category (system, kyc, financing, payment, document, request)
            channel: Delivery channel (in_app, email, both)
            action_url: URL to redirect user when notification is clicked
            metadata: Additional metadata for the notification
            email_template: Optional email template name for HTML email
            email_context: Optional context for email template

        Returns:
            Notification object
        """
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            channel=channel,
            category=category,
            action_url=action_url,
            metadata=metadata or {},
        )

        if channel in ("email", "both"):
            if email_template and email_context:
                # Use HTML template
                EmailService._send_email(
                    to_email=user.email,
                    subject=title,
                    template_name=email_template,
                    context=email_context,
                )
            else:
                # Fallback to simple text email
                NotificationService._send_simple_email(user, title, message)

        return notification

    @staticmethod
    def _send_simple_email(user, subject: str, message: str) -> bool:
        """Send a simple text email (fallback)."""
        from django.core.mail import send_mail

        try:
            send_mail(
                subject=f"Nova Digital Finance - {subject}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {e}")
            return False

    # ==================== KYC Notifications ====================

    @staticmethod
    def notify_kyc_submitted(kyc_application) -> Notification:
        """Notify user that KYC has been submitted."""
        EmailService.send_kyc_submitted_email(kyc_application)

        return NotificationService.notify(
            user=kyc_application.user,
            title="KYC Application Submitted",
            message="Your KYC application has been submitted and is under review.",
            category="kyc",
            channel="in_app",  # Email already sent via EmailService
            action_url="/dashboard/kyc",
        )

    @staticmethod
    def notify_kyc_status_change(kyc_application, new_status: str) -> Notification:
        """Notify user of KYC status change."""
        messages = {
            "submitted": "Your KYC application has been submitted and is under review.",
            "under_review": "Your KYC application is being reviewed by our team.",
            "approved": "Your KYC application has been approved. You can now apply for financing.",
            "rejected": f"Your KYC application has been rejected. Reason: {kyc_application.rejection_reason}",
        }

        msg = messages.get(new_status, f"Your KYC status has been updated to: {new_status}")

        # Send appropriate email
        if new_status == "approved":
            EmailService.send_kyc_approved_email(kyc_application)
        elif new_status == "rejected":
            EmailService.send_kyc_rejected_email(kyc_application)

        return NotificationService.notify(
            user=kyc_application.user,
            title=f"KYC {new_status.replace('_', ' ').title()}",
            message=msg,
            category="kyc",
            channel="in_app",  # Email already sent
            action_url="/dashboard/kyc",
        )

    # ==================== Financing Notifications ====================

    @staticmethod
    def notify_financing_submitted(financing) -> Notification:
        """Notify user that financing application has been submitted."""
        EmailService.send_financing_submitted_email(financing)

        return NotificationService.notify(
            user=financing.user,
            title="Financing Application Submitted",
            message=f"Your financing application for {financing.bronova_amount} PRN has been submitted.",
            category="financing",
            channel="in_app",
            action_url="/dashboard/signatures",
        )

    @staticmethod
    def notify_financing_active(financing) -> Notification:
        """Notify user that financing is now active."""
        EmailService.send_financing_active_email(financing)

        return NotificationService.notify(
            user=financing.user,
            title="Financing Activated",
            message=f"Your financing of {financing.bronova_amount} PRN is now active. Your tokens are ready!",
            category="financing",
            channel="in_app",
            action_url="/dashboard",
        )

    @staticmethod
    def notify_financing_completed(financing) -> Notification:
        """Notify user that financing has been completed."""
        EmailService.send_financing_completed_email(financing)

        return NotificationService.notify(
            user=financing.user,
            title="Financing Completed",
            message=f"Congratulations! You have completed all payments for {financing.application_number}.",
            category="financing",
            channel="in_app",
            action_url="/dashboard/financing",
        )

    # ==================== Payment Notifications ====================

    @staticmethod
    def notify_payment_confirmed(payment) -> Notification:
        """Notify user of successful payment."""
        EmailService.send_payment_confirmation_email(payment)

        return NotificationService.notify(
            user=payment.user,
            title="Payment Confirmed",
            message=f"Your payment of ${payment.amount} has been confirmed.",
            category="payment",
            channel="in_app",
            action_url="/dashboard/payments",
        )

    @staticmethod
    def notify_payment_reminder(installment, days_before: int) -> Notification:
        """Send payment reminder notification."""
        EmailService.send_payment_reminder_email(installment, days_before)

        return NotificationService.notify(
            user=installment.financing.user,
            title=f"Payment Due in {days_before} Day{'s' if days_before > 1 else ''}",
            message=f"Your installment #{installment.installment_number} of ${installment.amount} is due on {installment.due_date}.",
            category="payment",
            channel="in_app",
            action_url="/dashboard/payments",
        )

    @staticmethod
    def notify_payment_overdue(installment, days_overdue: int) -> Notification:
        """Send payment overdue notification."""
        EmailService.send_payment_overdue_email(installment, days_overdue)

        return NotificationService.notify(
            user=installment.financing.user,
            title="Payment Overdue",
            message=f"Your installment #{installment.installment_number} is {days_overdue} day{'s' if days_overdue > 1 else ''} overdue.",
            category="payment",
            channel="in_app",
            action_url="/dashboard/payments",
        )

    # ==================== Document/Signature Notifications ====================

    @staticmethod
    def notify_signature_required(signature_request) -> Notification:
        """Notify user that a document needs signing."""
        EmailService.send_signature_required_email(signature_request)

        document = signature_request.document

        return NotificationService.notify(
            user=document.financing.user,
            title="Document Ready for Signature",
            message=f"Your {document.get_document_type_display()} is ready for signature.",
            category="document",
            channel="in_app",
            action_url="/dashboard/signatures",
        )

    @staticmethod
    def notify_document_signed(signature) -> Notification:
        """Notify user that document has been signed."""
        EmailService.send_document_signed_email(signature)

        document = signature.signature_request.document

        return NotificationService.notify(
            user=document.financing.user,
            title="Document Signed",
            message=f"Your {document.get_document_type_display()} has been signed successfully.",
            category="document",
            channel="in_app",
            action_url="/dashboard/documents",
        )

    # ==================== Request Notifications ====================

    @staticmethod
    def notify_request_received(client_request) -> Notification:
        """Notify user that their request has been received."""
        EmailService.send_request_received_email(client_request)

        return NotificationService.notify(
            user=client_request.user,
            title="Request Received",
            message=f"We've received your request: {client_request.subject}",
            category="request",
            channel="in_app",
            action_url="/dashboard/requests",
        )

    @staticmethod
    def notify_request_responded(client_request) -> Notification:
        """Notify user that their request has been responded to."""
        EmailService.send_request_response_email(client_request)

        return NotificationService.notify(
            user=client_request.user,
            title="Request Response",
            message=f"Your request '{client_request.subject}' has been responded to.",
            category="request",
            channel="in_app",
            action_url="/dashboard/requests",
        )
