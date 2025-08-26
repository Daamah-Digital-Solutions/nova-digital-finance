from django.db.models.signals import post_save, post_delete
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

from .models import SecurityAuditLog, SecurityIncident
from .mhcc_integration import mhcc_client, security_monitor

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(user_logged_in)
def log_successful_login(sender, request, user, **kwargs):
    """Log successful login attempts"""
    try:
        SecurityAuditLog.objects.create(
            user=user,
            action_type='login',
            action='Successful login',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            request_method=request.method,
            request_path=request.path,
            status_code=200,
            details={
                'login_timestamp': timezone.now().isoformat(),
                'session_key': request.session.session_key
            }
        )
        
        # Monitor login patterns
        security_monitor.monitor_login_attempts(
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True
        )
        
        logger.info(f"Successful login for user {user.username} from {get_client_ip(request)}")
        
    except Exception as e:
        logger.error(f"Error logging successful login: {e}")


@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """Log failed login attempts"""
    try:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        SecurityAuditLog.objects.create(
            user=None,
            action_type='login',
            action='Failed login attempt',
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request.method,
            request_path=request.path,
            status_code=401,
            details={
                'attempted_username': credentials.get('username', ''),
                'failure_reason': 'Invalid credentials',
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # Monitor for suspicious patterns
        if not security_monitor.monitor_login_attempts(
            ip_address=ip_address,
            user_agent=user_agent,
            success=False
        ):
            # Create security incident for multiple failed attempts
            SecurityIncident.objects.create(
                incident_type='failed_login',
                severity='medium',
                title=f'Multiple failed login attempts from {ip_address}',
                description=f'Detected multiple failed login attempts from IP {ip_address}',
                ip_address=ip_address,
                metadata={
                    'user_agent': user_agent,
                    'attempted_username': credentials.get('username', ''),
                    'detection_timestamp': timezone.now().isoformat()
                }
            )
        
        logger.warning(f"Failed login attempt for username {credentials.get('username', 'unknown')} from {ip_address}")
        
    except Exception as e:
        logger.error(f"Error logging failed login: {e}")


@receiver(user_logged_out)
def log_logout(sender, request, user, **kwargs):
    """Log user logout"""
    try:
        if user:
            SecurityAuditLog.objects.create(
                user=user,
                action_type='logout',
                action='User logout',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                request_method=request.method,
                request_path=request.path,
                status_code=200,
                details={
                    'logout_timestamp': timezone.now().isoformat()
                }
            )
            
            logger.info(f"User {user.username} logged out from {get_client_ip(request)}")
            
    except Exception as e:
        logger.error(f"Error logging logout: {e}")


@receiver(post_save, sender=User)
def log_user_changes(sender, instance, created, **kwargs):
    """Log user account changes"""
    try:
        if created:
            SecurityAuditLog.objects.create(
                user=instance,
                action_type='profile_update',
                action='User account created',
                ip_address='127.0.0.1',  # Default for system-generated
                user_agent='System',
                request_method='POST',
                request_path='/api/auth/register/',
                status_code=201,
                details={
                    'user_id': str(instance.id),
                    'username': instance.username,
                    'email': instance.email,
                    'created_timestamp': timezone.now().isoformat()
                }
            )
            
            logger.info(f"New user account created: {instance.username}")
        else:
            # Log profile updates
            SecurityAuditLog.objects.create(
                user=instance,
                action_type='profile_update',
                action='User profile updated',
                ip_address='127.0.0.1',
                user_agent='System',
                request_method='PUT',
                request_path='/api/auth/profile/',
                status_code=200,
                details={
                    'user_id': str(instance.id),
                    'username': instance.username,
                    'updated_timestamp': timezone.now().isoformat()
                }
            )
            
    except Exception as e:
        logger.error(f"Error logging user changes: {e}")


@receiver(post_save, sender=SecurityIncident)
def handle_security_incident(sender, instance, created, **kwargs):
    """Handle new security incidents"""
    if created:
        try:
            # Report high/critical incidents to MHCC immediately
            if instance.severity in ['high', 'critical']:
                incident_data = {
                    'incident_id': str(instance.id),
                    'type': instance.incident_type,
                    'severity': instance.severity,
                    'title': instance.title,
                    'description': instance.description,
                    'ip_address': instance.ip_address,
                    'user_id': str(instance.affected_user.id) if instance.affected_user else None,
                    'occurred_at': instance.occurred_at.isoformat(),
                    'metadata': instance.metadata
                }
                
                success = mhcc_client.report_security_incident(incident_data)
                if success:
                    instance.reported_to_mhcc = True
                    instance.mhcc_incident_id = incident_data['incident_id']
                    instance.save(update_fields=['reported_to_mhcc', 'mhcc_incident_id'])
            
            logger.critical(f"Security incident created: {instance.incident_type} - {instance.severity}")
            
        except Exception as e:
            logger.error(f"Error handling security incident: {e}")


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip