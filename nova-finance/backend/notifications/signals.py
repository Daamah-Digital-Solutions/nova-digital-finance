from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

from .email_service import email_service

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send welcome email when new user is created"""
    if created:
        try:
            # Get user's preferred language (default to English)
            user_language = getattr(instance, 'language', 'en')
            
            # Send welcome email
            success = email_service.send_welcome_email(
                user=instance,
                language=user_language
            )
            
            if success:
                logger.info(f"Welcome email sent to new user: {instance.email}")
            else:
                logger.error(f"Failed to send welcome email to: {instance.email}")
                
        except Exception as e:
            logger.error(f"Error sending welcome email to {instance.email}: {e}")


@receiver(post_save, sender='loans.Loan')
def send_loan_approval_email(sender, instance, created, **kwargs):
    """Send loan approval email when loan status changes to approved"""
    if not created and instance.status == 'approved':
        try:
            # Check if approval email was already sent
            if not getattr(instance, '_approval_email_sent', False):
                user_language = getattr(instance.user, 'language', 'en')
                
                success = email_service.send_loan_approval_email(
                    loan=instance,
                    language=user_language
                )
                
                if success:
                    instance._approval_email_sent = True
                    logger.info(f"Loan approval email sent for loan: {instance.loan_number}")
                else:
                    logger.error(f"Failed to send loan approval email for: {instance.loan_number}")
                    
        except Exception as e:
            logger.error(f"Error sending loan approval email for {instance.loan_number}: {e}")


@receiver(post_save, sender='payments.Payment')
def send_payment_confirmation_email(sender, instance, created, **kwargs):
    """Send payment confirmation email when payment is completed"""
    if created and instance.status == 'completed':
        try:
            user_language = getattr(instance.loan.user, 'language', 'en')
            
            success = email_service.send_payment_confirmation_email(
                payment=instance,
                language=user_language
            )
            
            if success:
                logger.info(f"Payment confirmation email sent for payment: {instance.id}")
            else:
                logger.error(f"Failed to send payment confirmation email for payment: {instance.id}")
                
        except Exception as e:
            logger.error(f"Error sending payment confirmation email for payment {instance.id}: {e}")


@receiver(post_save, sender='documents.Document')
def send_document_ready_email(sender, instance, created, **kwargs):
    """Send email when document is ready for download"""
    if not created and instance.status == 'completed':
        try:
            # Check if document ready email was already sent
            if not getattr(instance, '_ready_email_sent', False):
                user_language = getattr(instance.user, 'language', 'en')
                
                success = email_service.send_document_ready_email(
                    document=instance,
                    language=user_language
                )
                
                if success:
                    instance._ready_email_sent = True
                    logger.info(f"Document ready email sent for document: {instance.id}")
                else:
                    logger.error(f"Failed to send document ready email for document: {instance.id}")
                    
        except Exception as e:
            logger.error(f"Error sending document ready email for document {instance.id}: {e}")


@receiver(post_save, sender='security.SecurityIncident')
def send_security_alert_email(sender, instance, created, **kwargs):
    """Send security alert email for high/critical incidents"""
    if created and instance.severity in ['high', 'critical'] and instance.affected_user:
        try:
            user_language = getattr(instance.affected_user, 'language', 'en')
            
            alert_details = {
                'incident_type': instance.incident_type,
                'severity': instance.severity,
                'description': instance.description,
                'ip_address': instance.ip_address,
                'timestamp': instance.occurred_at,
                'incident_id': str(instance.id)
            }
            
            success = email_service.send_security_alert_email(
                user=instance.affected_user,
                alert_type=instance.incident_type,
                details=alert_details,
                language=user_language
            )
            
            if success:
                logger.info(f"Security alert email sent for incident: {instance.id}")
            else:
                logger.error(f"Failed to send security alert email for incident: {instance.id}")
                
        except Exception as e:
            logger.error(f"Error sending security alert email for incident {instance.id}: {e}")