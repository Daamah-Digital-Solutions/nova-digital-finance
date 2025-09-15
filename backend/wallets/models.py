from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid
from datetime import datetime

class WalletService(models.Model):
    """
    Nova's core wallet service for managing PRN operations
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=100, default='Nova PRN Service')
    total_prn_supply = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.00000000'))
    total_usd_reserves = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    service_wallet_address = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.service_wallet_address:
            self.service_wallet_address = f"NOVA{str(self.id)[:8].upper()}{datetime.now().strftime('%Y')}"
        super().save(*args, **kwargs)

    def issue_prn(self, amount_usd, user):
        """
        Issue PRN tokens backed 1:1 with USD
        """
        prn_amount = Decimal(str(amount_usd))  # 1:1 peg
        
        # Create or get user's PRN wallet
        from pronova.models import PRNWallet, PRNTransaction
        wallet, created = PRNWallet.objects.get_or_create(user=user)
        
        # Update wallet balance
        wallet.balance += prn_amount
        wallet.save()
        
        # Update system reserves
        self.total_prn_supply += prn_amount
        self.total_usd_reserves += amount_usd
        self.save()
        
        # Create transaction record
        transaction = PRNTransaction.objects.create(
            from_wallet=None,  # System issue
            to_wallet=wallet,
            amount=prn_amount,
            transaction_type='issue',
            status='completed',
            notes=f'PRN issued for loan disbursement: ${amount_usd}'
        )
        
        return transaction

    def pledge_prn(self, prn_amount, user, loan_application_id):
        """
        Pledge PRN as collateral for loan
        """
        from pronova.models import PRNWallet, PRNTransaction
        wallet = PRNWallet.objects.get(user=user)
        
        if wallet.available_balance < prn_amount:
            raise ValueError("Insufficient available PRN balance")
        
        # Update wallet pledged balance
        wallet.pledged_balance += prn_amount
        wallet.save()
        
        # Create transaction record
        transaction = PRNTransaction.objects.create(
            from_wallet=wallet,
            to_wallet=wallet,  # Same wallet, different status
            amount=prn_amount,
            transaction_type='pledge',
            status='completed',
            reference_id=str(loan_application_id),
            notes=f'PRN pledged as collateral for loan application'
        )
        
        return transaction

    def unpledge_prn(self, prn_amount, user, loan_application_id):
        """
        Release PRN pledge after loan repayment
        """
        from pronova.models import PRNWallet, PRNTransaction
        wallet = PRNWallet.objects.get(user=user)
        
        # Update wallet pledged balance
        wallet.pledged_balance -= prn_amount
        wallet.save()
        
        # Create transaction record
        transaction = PRNTransaction.objects.create(
            from_wallet=wallet,
            to_wallet=wallet,  # Same wallet, different status
            amount=prn_amount,
            transaction_type='unpledge',
            status='completed',
            reference_id=str(loan_application_id),
            notes=f'PRN pledge released after loan repayment'
        )
        
        return transaction

    def __str__(self):
        return f"{self.service_name} - {self.total_prn_supply} PRN / ${self.total_usd_reserves}"
