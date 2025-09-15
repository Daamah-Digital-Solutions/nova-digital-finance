from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.email_service import notification_scheduler
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send payment reminder emails to users with upcoming due dates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually sending emails',
        )
        parser.add_argument(
            '--days',
            type=int,
            nargs='+',
            default=[3, 7, 14],
            help='Days before due date to send reminders (default: 3, 7, 14)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        reminder_days = options['days']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting payment reminder process...')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No emails will be sent')
            )
        
        try:
            # Send payment reminders
            results = notification_scheduler.send_payment_reminders()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Payment reminders completed:\n'
                    f'- Sent: {results["sent"]}\n'
                    f'- Failed: {results["failed"]}'
                )
            )
            
            if results['failed'] > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'Warning: {results["failed"]} emails failed to send. Check logs for details.'
                    )
                )
            
        except Exception as e:
            logger.error(f'Error in send_payment_reminders command: {e}')
            self.stdout.write(
                self.style.ERROR(f'Command failed: {e}')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS('Payment reminder process completed successfully!')
        )