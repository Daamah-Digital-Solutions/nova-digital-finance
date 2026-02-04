from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def send_payment_reminders():
    """Send payment reminders 7, 3, and 1 day before due date."""
    from apps.financing.models import Installment
    from apps.notifications.services import NotificationService

    today = timezone.now().date()
    reminder_days = [7, 3, 1]

    for days in reminder_days:
        target_date = today + timedelta(days=days)
        due_installments = Installment.objects.filter(
            due_date=target_date,
            status__in=["upcoming", "due"],
        ).select_related("financing__user")

        for installment in due_installments:
            NotificationService.notify_payment_reminder(installment, days)


@shared_task
def mark_overdue_installments():
    """Mark installments as overdue if past due date."""
    from apps.financing.models import Installment

    today = timezone.now().date()
    Installment.objects.filter(
        due_date__lt=today,
        status__in=["upcoming", "due"],
    ).update(status="overdue")


@shared_task
def mark_due_installments():
    """Mark installments as due when their due date arrives."""
    from apps.financing.models import Installment

    today = timezone.now().date()
    Installment.objects.filter(
        due_date=today,
        status="upcoming",
    ).update(status="due")


@shared_task
def process_scheduled_payments():
    """Process scheduled payments for today."""
    from apps.payments.models import ScheduledPayment
    from apps.payments.services import StripeService

    today = timezone.now().date()
    scheduled = ScheduledPayment.objects.filter(
        scheduled_date=today,
        is_processed=False,
    ).select_related("installment__financing__user")

    for sp in scheduled:
        try:
            # Note: Actual automatic charging would need saved payment methods
            # For now, send a reminder
            from apps.notifications.services import NotificationService
            NotificationService.notify(
                user=sp.user,
                title="Scheduled Payment Due Today",
                message=f"Your scheduled payment of ${sp.installment.amount} is due today.",
                category="payment",
                action_url="/dashboard/payments",
            )
        except Exception:
            pass


@shared_task
def expire_signature_requests():
    """Expire signature requests past their expiry date."""
    from apps.signatures.models import SignatureRequest

    SignatureRequest.objects.filter(
        status="pending",
        expires_at__lt=timezone.now(),
    ).update(status="expired")
