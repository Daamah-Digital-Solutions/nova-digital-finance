import os
import logging
from typing import List, Dict, Any, Optional
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

logger = logging.getLogger(__name__)
User = get_user_model()

class EmailService:
    """
    Comprehensive email service for Nova Finance platform
    """
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nova-finance.com')
        self.support_email = getattr(settings, 'SUPPORT_EMAIL', 'support@nova-finance.com')
        self.admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@nova-finance.com')
        
        # Email templates directory
        self.template_dir = 'emails/'
        
        # Supported languages
        self.supported_languages = ['en', 'ar', 'es', 'fr']

    def send_welcome_email(self, user: User, language: str = 'en') -> bool:
        """Send welcome email to new users"""
        try:
            context = {
                'user': user,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('welcome', language)
            
            return self._send_templated_email(
                template_name='welcome',
                subject=subject,
                recipient_email=user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {user.email}: {e}")
            return False

    def send_kyc_status_email(self, user: User, status: str, language: str = 'en') -> bool:
        """Send KYC status update email"""
        try:
            context = {
                'user': user,
                'kyc_status': status,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('kyc_status', language, {'status': status})
            
            return self._send_templated_email(
                template_name='kyc_status',
                subject=subject,
                recipient_email=user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending KYC status email to {user.email}: {e}")
            return False

    def send_loan_approval_email(self, loan_application, language: str = 'en') -> bool:
        """Send loan approval email for Nova Finance PRN system"""
        try:
            context = {
                'user': loan_application.user,
                'loan_application': loan_application,
                'loan_amount_usd': loan_application.loan_amount_usd,
                'prn_amount': loan_application.prn_amount,
                'fee_amount': loan_application.fee_amount_usd,
                'monthly_payment': loan_application.monthly_payment_usd,
                'duration_months': loan_application.duration_months,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('loan_approval', language)
            
            return self._send_templated_email(
                template_name='loan_approval',
                subject=subject,
                recipient_email=loan_application.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending loan approval email: {e}")
            return False
    
    def send_prn_certificate_email(self, certificate, pdf_path: str = None, language: str = 'en') -> bool:
        """Send PRN certificate email with PDF attachment"""
        try:
            context = {
                'user': certificate.user,
                'certificate': certificate,
                'certificate_number': certificate.certificate_number,
                'prn_amount': certificate.prn_amount,
                'usd_value': certificate.usd_value,
                'loan_application': certificate.loan_application,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('prn_certificate', language)
            
            # Attach certificate PDF if provided
            attachments = []
            if pdf_path and os.path.exists(pdf_path):
                try:
                    with open(pdf_path, 'rb') as pdf_file:
                        attachments.append({
                            'filename': f'nova_certificate_{certificate.certificate_number}.pdf',
                            'content': pdf_file.read(),
                            'mimetype': 'application/pdf'
                        })
                except Exception as e:
                    logger.warning(f"Could not attach certificate PDF: {e}")
            
            return self._send_templated_email(
                template_name='prn_certificate',
                subject=subject,
                recipient_email=certificate.user.email,
                context=context,
                language=language,
                attachments=attachments
            )
            
        except Exception as e:
            logger.error(f"Error sending PRN certificate email: {e}")
            return False
    
    def send_contract_signature_email(self, contract, language: str = 'en') -> bool:
        """Send tripartite contract signature notification"""
        try:
            context = {
                'user': contract.client,
                'contract': contract,
                'contract_number': contract.contract_number,
                'prn_amount': contract.prn_amount,
                'usd_value': contract.usd_value,
                'loan_duration': contract.loan_duration_months,
                'certificate': contract.certificate,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year,
                'signature_url': f'/contracts/{contract.id}/sign/'
            }
            
            subject = self._get_localized_subject('contract_signature', language)
            
            return self._send_templated_email(
                template_name='contract_signature',
                subject=subject,
                recipient_email=contract.client.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending contract signature email: {e}")
            return False
    
    def send_contract_executed_email(self, contract, language: str = 'en') -> bool:
        """Send contract fully executed notification"""
        try:
            context = {
                'user': contract.client,
                'contract': contract,
                'contract_number': contract.contract_number,
                'prn_amount': contract.prn_amount,
                'usd_value': contract.usd_value,
                'certificate': contract.certificate,
                'capimax_authorized': contract.capimax_authorized,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('contract_executed', language)
            
            return self._send_templated_email(
                template_name='contract_executed',
                subject=subject,
                recipient_email=contract.client.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending contract executed email: {e}")
            return False
    
    def send_capimax_activation_email(self, account, language: str = 'en') -> bool:
        """Send Capimax account activation notification"""
        try:
            context = {
                'user': account.user,
                'account': account,
                'account_id': account.capimax_account_id,
                'total_capacity': account.total_capacity_usd,
                'certificate': account.certificate,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('capimax_activation', language)
            
            return self._send_templated_email(
                template_name='capimax_activation',
                subject=subject,
                recipient_email=account.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending Capimax activation email: {e}")
            return False
    
    def send_investment_created_email(self, investment, language: str = 'en') -> bool:
        """Send investment creation notification"""
        try:
            context = {
                'user': investment.account.user,
                'investment': investment,
                'investment_name': investment.investment_name,
                'investment_type': investment.get_investment_type_display(),
                'invested_amount': investment.invested_amount_usd,
                'risk_level': investment.get_risk_level_display(),
                'expected_return': investment.expected_return_percentage,
                'account': investment.account,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('investment_created', language)
            
            return self._send_templated_email(
                template_name='investment_created',
                subject=subject,
                recipient_email=investment.account.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending investment created email: {e}")
            return False
    
    def send_investment_profit_email(self, investment, profit_amount: float, language: str = 'en') -> bool:
        """Send investment profit notification"""
        try:
            context = {
                'user': investment.account.user,
                'investment': investment,
                'investment_name': investment.investment_name,
                'profit_amount': profit_amount,
                'current_value': investment.current_value_usd,
                'profit_percentage': investment.profit_loss_percentage,
                'total_invested': investment.invested_amount_usd,
                'account': investment.account,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('investment_profit', language, {'amount': profit_amount})
            
            return self._send_templated_email(
                template_name='investment_profit',
                subject=subject,
                recipient_email=investment.account.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending investment profit email: {e}")
            return False
    
    def send_pledge_release_email(self, certificate, language: str = 'en') -> bool:
        """Send PRN pledge release notification"""
        try:
            context = {
                'user': certificate.user,
                'certificate': certificate,
                'certificate_number': certificate.certificate_number,
                'prn_amount': certificate.prn_amount,
                'usd_value': certificate.usd_value,
                'loan_application': certificate.loan_application,
                'release_date': certificate.pledge_release_date,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('pledge_release', language)
            
            return self._send_templated_email(
                template_name='pledge_release',
                subject=subject,
                recipient_email=certificate.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending pledge release email: {e}")
            return False

    def send_payment_reminder_email(self, loan, days_until_due: int, language: str = 'en') -> bool:
        """Send payment reminder email"""
        try:
            next_payment = loan.get_next_payment_due()
            if not next_payment:
                return False
            
            context = {
                'user': loan.user,
                'loan': loan,
                'next_payment': next_payment,
                'days_until_due': days_until_due,
                'payment_amount': next_payment.get('amount', 0),
                'due_date': next_payment.get('due_date'),
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('payment_reminder', language, {
                'days': days_until_due,
                'amount': next_payment.get('amount', 0)
            })
            
            return self._send_templated_email(
                template_name='payment_reminder',
                subject=subject,
                recipient_email=loan.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending payment reminder email: {e}")
            return False

    def send_payment_confirmation_email(self, payment, language: str = 'en') -> bool:
        """Send payment confirmation email"""
        try:
            context = {
                'user': payment.loan.user,
                'payment': payment,
                'loan': payment.loan,
                'payment_amount': payment.amount_usd,
                'remaining_balance': payment.loan.remaining_balance_usd,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('payment_confirmation', language)
            
            return self._send_templated_email(
                template_name='payment_confirmation',
                subject=subject,
                recipient_email=payment.loan.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending payment confirmation email: {e}")
            return False

    def send_document_ready_email(self, document, language: str = 'en') -> bool:
        """Send email when document is ready for download"""
        try:
            context = {
                'user': document.user,
                'document': document,
                'document_type': document.document_type,
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year,
                'download_url': f'/documents/{document.id}/'
            }
            
            subject = self._get_localized_subject('document_ready', language)
            
            return self._send_templated_email(
                template_name='document_ready',
                subject=subject,
                recipient_email=document.user.email,
                context=context,
                language=language
            )
            
        except Exception as e:
            logger.error(f"Error sending document ready email: {e}")
            return False

    def send_security_alert_email(self, user: User, alert_type: str, details: Dict[str, Any], language: str = 'en') -> bool:
        """Send security alert email"""
        try:
            context = {
                'user': user,
                'alert_type': alert_type,
                'details': details,
                'timestamp': timezone.now(),
                'platform_name': 'Nova Finance',
                'support_email': self.support_email,
                'current_year': timezone.now().year
            }
            
            subject = self._get_localized_subject('security_alert', language, {'type': alert_type})
            
            return self._send_templated_email(
                template_name='security_alert',
                subject=subject,
                recipient_email=user.email,
                context=context,
                language=language,
                priority='high'
            )
            
        except Exception as e:
            logger.error(f"Error sending security alert email: {e}")
            return False

    def send_bulk_notification(self, users: List[User], template_name: str, subject: str, 
                             context: Dict[str, Any], language: str = 'en') -> Dict[str, int]:
        """Send bulk notification to multiple users"""
        results = {'success': 0, 'failed': 0}
        
        for user in users:
            try:
                user_context = context.copy()
                user_context['user'] = user
                
                success = self._send_templated_email(
                    template_name=template_name,
                    subject=subject,
                    recipient_email=user.email,
                    context=user_context,
                    language=language
                )
                
                if success:
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                logger.error(f"Error sending bulk email to {user.email}: {e}")
                results['failed'] += 1
        
        logger.info(f"Bulk email completed: {results['success']} success, {results['failed']} failed")
        return results

    def _send_templated_email(self, template_name: str, subject: str, recipient_email: str,
                            context: Dict[str, Any], language: str = 'en',
                            attachments: Optional[List[Dict]] = None, priority: str = 'normal') -> bool:
        """Send email using template"""
        try:
            # Prepare template paths
            html_template = f'{self.template_dir}{language}/{template_name}.html'
            text_template = f'{self.template_dir}{language}/{template_name}.txt'
            
            # Fallback to English if language template doesn't exist
            if language != 'en':
                try:
                    html_content = render_to_string(html_template, context)
                    text_content = render_to_string(text_template, context)
                except:
                    html_template = f'{self.template_dir}en/{template_name}.html'
                    text_template = f'{self.template_dir}en/{template_name}.txt'
                    html_content = render_to_string(html_template, context)
                    text_content = render_to_string(text_template, context)
            else:
                html_content = render_to_string(html_template, context)
                text_content = render_to_string(text_template, context)
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=self.from_email,
                to=[recipient_email]
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    email.attach(
                        filename=attachment['filename'],
                        content=attachment['content'],
                        mimetype=attachment.get('mimetype', 'application/octet-stream')
                    )
            
            # Set priority headers
            if priority == 'high':
                email.extra_headers['X-Priority'] = '1'
                email.extra_headers['Importance'] = 'high'
            
            # Send email
            email.send()
            
            logger.info(f"Email sent successfully to {recipient_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending templated email to {recipient_email}: {e}")
            return False

    def _get_localized_subject(self, template_type: str, language: str, params: Optional[Dict] = None) -> str:
        """Get localized email subject"""
        subjects = {
            'en': {
                'welcome': 'Welcome to Nova Finance!',
                'kyc_status': 'KYC Status Update: {status}',
                'loan_approval': 'Loan Approved - PRN Tokens Issued',
                'prn_certificate': 'Your PRN Certificate is Ready',
                'contract_signature': 'Tripartite Contract Requires Your Signature',
                'contract_executed': 'Investment Authorization Activated',
                'capimax_activation': 'Capimax Investment Account Activated',
                'investment_created': 'Investment Created Successfully',
                'investment_profit': 'Investment Profit: ${amount}',
                'pledge_release': 'PRN Tokens Released - Loan Completed',
                'payment_reminder': 'Payment Reminder: ${amount} Due in {days} Days',
                'payment_confirmation': 'Payment Confirmed - Thank You',
                'document_ready': 'Your Document is Ready for Download',
                'security_alert': 'Security Alert: {type}',
            },
            'ar': {
                'welcome': 'مرحباً بكم في نوفا فاينانس!',
                'kyc_status': 'تحديث حالة التحقق: {status}',
                'loan_approval': 'تمت الموافقة على القرض - تم إصدار رموز PRN',
                'prn_certificate': 'شهادة PRN الخاصة بك جاهزة',
                'contract_signature': 'العقد الثلاثي يتطلب توقيعك',
                'contract_executed': 'تم تفعيل ترخيص الاستثمار',
                'capimax_activation': 'تم تفعيل حساب الاستثمار في كابيماكس',
                'investment_created': 'تم إنشاء الاستثمار بنجاح',
                'investment_profit': 'أرباح الاستثمار: ${amount}',
                'pledge_release': 'تم تحرير رموز PRN - اكتمل القرض',
                'payment_reminder': 'تذكير بالدفع: ${amount} مستحق خلال {days} أيام',
                'payment_confirmation': 'تم تأكيد الدفعة - شكراً لكم',
                'document_ready': 'الوثيقة جاهزة للتحميل',
                'security_alert': 'تنبيه أمني: {type}',
            },
            'es': {
                'welcome': '¡Bienvenido a Nova Finance!',
                'kyc_status': 'Actualización de Estado KYC: {status}',
                'loan_approval': 'Préstamo Aprobado - Tokens PRN Emitidos',
                'prn_certificate': 'Su Certificado PRN está Listo',
                'contract_signature': 'Contrato Tripartito Requiere su Firma',
                'contract_executed': 'Autorización de Inversión Activada',
                'capimax_activation': 'Cuenta de Inversión Capimax Activada',
                'investment_created': 'Inversión Creada Exitosamente',
                'investment_profit': 'Ganancia de Inversión: ${amount}',
                'pledge_release': 'Tokens PRN Liberados - Préstamo Completado',
                'payment_reminder': 'Recordatorio de Pago: ${amount} Vence en {days} Días',
                'payment_confirmation': 'Pago Confirmado - Gracias',
                'document_ready': 'Su Documento está Listo para Descargar',
                'security_alert': 'Alerta de Seguridad: {type}',
            },
            'fr': {
                'welcome': 'Bienvenue chez Nova Finance!',
                'kyc_status': 'Mise à jour du Statut KYC: {status}',
                'loan_approval': 'Prêt Approuvé - Tokens PRN Émis',
                'prn_certificate': 'Votre Certificat PRN est Prêt',
                'contract_signature': 'Contrat Tripartite Nécessite votre Signature',
                'contract_executed': 'Autorisation d\'Investissement Activée',
                'capimax_activation': 'Compte d\'Investissement Capimax Activé',
                'investment_created': 'Investissement Créé avec Succès',
                'investment_profit': 'Profit d\'Investissement: ${amount}',
                'pledge_release': 'Tokens PRN Libérés - Prêt Terminé',
                'payment_reminder': 'Rappel de Paiement: ${amount} Dû dans {days} Jours',
                'payment_confirmation': 'Paiement Confirmé - Merci',
                'document_ready': 'Votre Document est Prêt à Télécharger',
                'security_alert': 'Alerte de Sécurité: {type}',
            }
        }
        
        lang_subjects = subjects.get(language, subjects['en'])
        subject_template = lang_subjects.get(template_type, f'Nova Finance Notification: {template_type}')
        
        if params:
            try:
                return subject_template.format(**params)
            except KeyError:
                return subject_template
        
        return subject_template


class NotificationScheduler:
    """
    Scheduler for automated email notifications
    """
    
    def __init__(self):
        self.email_service = EmailService()

    def send_payment_reminders(self) -> Dict[str, int]:
        """Send payment reminders for upcoming due dates"""
        from loans.models import Loan
        from django.db.models import Q
        
        results = {'sent': 0, 'failed': 0}
        
        # Get loans with upcoming payments (3, 7, and 14 days)
        reminder_days = [3, 7, 14]
        
        for days in reminder_days:
            target_date = timezone.now().date() + timezone.timedelta(days=days)
            
            loans = Loan.objects.filter(
                status='active',
                next_payment_date=target_date
            ).select_related('user')
            
            for loan in loans:
                try:
                    # Get user's preferred language
                    user_language = getattr(loan.user, 'language', 'en')
                    
                    success = self.email_service.send_payment_reminder_email(
                        loan=loan,
                        days_until_due=days,
                        language=user_language
                    )
                    
                    if success:
                        results['sent'] += 1
                    else:
                        results['failed'] += 1
                        
                except Exception as e:
                    logger.error(f"Error sending payment reminder for loan {loan.id}: {e}")
                    results['failed'] += 1
        
        return results

    def send_kyc_follow_ups(self) -> Dict[str, int]:
        """Send follow-up emails for incomplete KYC"""
        results = {'sent': 0, 'failed': 0}
        
        # Get users with incomplete KYC older than 7 days
        cutoff_date = timezone.now() - timezone.timedelta(days=7)
        
        users = User.objects.filter(
            Q(kyc_status='pending') | Q(kyc_status='incomplete'),
            date_joined__lt=cutoff_date
        )
        
        for user in users:
            try:
                user_language = getattr(user, 'language', 'en')
                
                success = self.email_service.send_kyc_status_email(
                    user=user,
                    status='follow_up',
                    language=user_language
                )
                
                if success:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                logger.error(f"Error sending KYC follow-up for user {user.id}: {e}")
                results['failed'] += 1
        
        return results


# Global instances
email_service = EmailService()
notification_scheduler = NotificationScheduler()