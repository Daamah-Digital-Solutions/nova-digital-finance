import logging

from django.core.mail import send_mail
from django.conf import settings

from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def notify(user, title, message, category="system", channel="both",
               action_url="", metadata=None):
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
            NotificationService._send_email(user, title, message)

        return notification

    @staticmethod
    def _send_email(user, subject, message):
        try:
            send_mail(
                subject=f"Nova Digital Finance - {subject}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {e}")

    @staticmethod
    def notify_kyc_status_change(kyc_application, new_status):
        messages = {
            "submitted": "Your KYC application has been submitted and is under review.",
            "under_review": "Your KYC application is being reviewed by our team.",
            "approved": "Your KYC application has been approved. You can now apply for financing.",
            "rejected": f"Your KYC application has been rejected. Reason: {kyc_application.rejection_reason}",
        }

        msg = messages.get(new_status, f"Your KYC status has been updated to: {new_status}")

        NotificationService.notify(
            user=kyc_application.user,
            title=f"KYC {new_status.replace('_', ' ').title()}",
            message=msg,
            category="kyc",
            action_url="/dashboard/kyc",
        )

    @staticmethod
    def notify_payment_reminder(installment, days_before):
        NotificationService.notify(
            user=installment.financing.user,
            title=f"Payment Due in {days_before} Day{'s' if days_before > 1 else ''}",
            message=f"Your installment #{installment.installment_number} of "
                    f"${installment.amount} is due on {installment.due_date}. "
                    f"Please make your payment on time.",
            category="payment",
            action_url="/dashboard/payments",
        )
