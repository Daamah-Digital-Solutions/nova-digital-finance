import requests
import json
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache

from .models import (
    CapimaxPlatform, CapimaxAccount, CapimaxInvestment,
    CapimaxTransaction, CapimaxAPILog
)
from pronova.models import ElectronicCertificate

class CapimaxAPIService:
    """
    Service for communicating with Capimax platform API
    """
    
    def __init__(self, platform: CapimaxPlatform = None):
        if platform:
            self.platform = platform
        else:
            self.platform = CapimaxPlatform.objects.filter(is_active=True).first()
            if not self.platform:
                raise ValueError("No active Capimax platform found")
    
    def _make_request(self, method: str, endpoint: str, data: dict = None, log_type: str = 'status_check') -> Tuple[bool, dict]:
        """
        Make authenticated API request to Capimax platform
        """
        start_time = time.time()
        url = f"{self.platform.api_base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        headers = {
            'Authorization': f'Bearer {self.platform.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'NovaFinance/1.0'
        }
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {'raw_response': response.text}
            
            success = 200 <= response.status_code < 300
            
            # Log API call
            CapimaxAPILog.objects.create(
                log_type=log_type,
                endpoint=endpoint,
                http_method=method.upper(),
                request_data=data or {},
                response_data=response_data,
                status_code=response.status_code,
                success=success,
                response_time_ms=response_time_ms,
                error_message='' if success else response_data.get('error', response.text)
            )
            
            return success, response_data
            
        except requests.RequestException as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            
            CapimaxAPILog.objects.create(
                log_type=log_type,
                endpoint=endpoint,
                http_method=method.upper(),
                request_data=data or {},
                response_data={},
                status_code=0,
                success=False,
                response_time_ms=response_time_ms,
                error_message=str(e)
            )
            
            return False, {'error': str(e)}
    
    def create_account(self, certificate: ElectronicCertificate) -> Tuple[bool, dict]:
        """
        Create Capimax account for Nova certificate holder
        """
        user = certificate.user
        
        account_data = {
            'nova_certificate_id': certificate.certificate_number,
            'user_email': user.email,
            'user_name': user.get_full_name() or user.email,
            'investment_capacity_usd': float(certificate.usd_value),
            'prn_amount': float(certificate.prn_amount),
            'certificate_expiry': certificate.expiry_date.isoformat(),
            'nova_contract_reference': getattr(certificate, 'tripartite_contract', {})
        }
        
        success, response = self._make_request('POST', 'accounts/create', account_data, 'account_creation')
        
        if success and response.get('account_id'):
            # Create local account record
            account = CapimaxAccount.objects.create(
                user=user,
                certificate=certificate,
                platform=self.platform,
                capimax_user_id=response.get('user_id'),
                total_capacity_usd=certificate.usd_value,
                available_capacity_usd=certificate.usd_value,
                account_status='active' if response.get('verified') else 'pending'
            )
            
            if response.get('verified'):
                account.activated_at = timezone.now()
                account.save()
                
                # Send activation email
                try:
                    from notifications.email_service import email_service
                    user_language = getattr(account.user, 'language', 'en')
                    
                    email_service.send_capimax_activation_email(
                        account=account,
                        language=user_language
                    )
                except Exception as e:
                    print(f"Failed to send Capimax activation email: {e}")
            
            return True, {'account': account, 'capimax_data': response}
        
        return False, response
    
    def sync_account_status(self, account: CapimaxAccount) -> Tuple[bool, dict]:
        """
        Sync account status with Capimax platform
        """
        success, response = self._make_request(
            'GET', 
            f'accounts/{account.capimax_account_id}/status',
            log_type='status_check'
        )
        
        if success:
            # Update account status
            old_status = account.account_status
            account.account_status = response.get('status', account.account_status)
            account.available_capacity_usd = Decimal(str(response.get('available_balance', account.available_capacity_usd)))
            account.invested_amount_usd = Decimal(str(response.get('invested_amount', account.invested_amount_usd)))
            account.total_profits_usd = Decimal(str(response.get('total_profits', account.total_profits_usd)))
            account.total_losses_usd = Decimal(str(response.get('total_losses', account.total_losses_usd)))
            account.last_activity_at = timezone.now()
            account.save()
            
            if old_status != account.account_status and account.account_status == 'active':
                account.activated_at = timezone.now()
                account.save()
        
        return success, response
    
    def create_investment(self, account: CapimaxAccount, investment_data: dict) -> Tuple[bool, dict]:
        """
        Create new investment through Capimax platform
        """
        api_data = {
            'account_id': account.capimax_account_id,
            'investment_type': investment_data.get('investment_type'),
            'amount_usd': float(investment_data.get('amount_usd')),
            'risk_level': investment_data.get('risk_level', 'medium'),
            'duration_days': investment_data.get('duration_days', 30),
            'expected_return': investment_data.get('expected_return'),
            'investment_name': investment_data.get('investment_name', ''),
            'terms': investment_data.get('terms', {})
        }
        
        success, response = self._make_request(
            'POST', 
            f'accounts/{account.capimax_account_id}/investments',
            api_data,
            'investment_create'
        )
        
        if success and response.get('investment_id'):
            # Create local investment record
            investment = CapimaxInvestment.objects.create(
                account=account,
                capimax_investment_id=response['investment_id'],
                investment_type=investment_data['investment_type'],
                investment_name=investment_data.get('investment_name', f"{investment_data['investment_type'].title()} Investment"),
                invested_amount_usd=Decimal(str(investment_data['amount_usd'])),
                current_value_usd=Decimal(str(investment_data['amount_usd'])),
                started_at=timezone.now(),
                expected_completion_at=timezone.now() + timedelta(days=investment_data.get('duration_days', 30)),
                risk_level=investment_data.get('risk_level', 'medium'),
                expected_return_percentage=Decimal(str(investment_data.get('expected_return', 0))),
                status='active',
                investment_description=investment_data.get('description', ''),
                investment_terms=investment_data.get('terms', {})
            )
            
            # Create deposit transaction
            CapimaxTransaction.objects.create(
                investment=investment,
                account=account,
                transaction_type='deposit',
                amount_usd=investment.invested_amount_usd,
                fee_amount_usd=Decimal('0.00'),
                status='completed',
                processed_at=timezone.now(),
                description=f'Initial deposit for {investment.investment_name}',
                capimax_transaction_id=response.get('transaction_id', '')
            )
            
            # Send investment creation email
            try:
                from notifications.email_service import email_service
                user_language = getattr(account.user, 'language', 'en')
                
                email_service.send_investment_created_email(
                    investment=investment,
                    language=user_language
                )
            except Exception as e:
                print(f"Failed to send investment created email: {e}")
            
            return True, {'investment': investment, 'capimax_data': response}
        
        return False, response
    
    def sync_investment_performance(self, investment: CapimaxInvestment) -> Tuple[bool, dict]:
        """
        Sync investment performance data from Capimax
        """
        success, response = self._make_request(
            'GET',
            f'investments/{investment.capimax_investment_id}/performance',
            log_type='investment_update'
        )
        
        if success:
            # Update investment performance
            investment.current_value_usd = Decimal(str(response.get('current_value', investment.current_value_usd)))
            investment.status = response.get('status', investment.status)
            
            if investment.status == 'completed':
                investment.completed_at = timezone.now()
            
            investment.save()
            
            # Sync transactions
            for txn_data in response.get('transactions', []):
                self._create_or_update_transaction(investment, txn_data)
        
        return success, response
    
    def _create_or_update_transaction(self, investment: CapimaxInvestment, txn_data: dict):
        """
        Create or update transaction from Capimax data
        """
        capimax_txn_id = txn_data.get('transaction_id')
        
        if not capimax_txn_id:
            return
        
        transaction, created = CapimaxTransaction.objects.get_or_create(
            capimax_transaction_id=capimax_txn_id,
            defaults={
                'investment': investment,
                'account': investment.account,
                'transaction_type': txn_data.get('type', 'profit_distribution'),
                'amount_usd': Decimal(str(txn_data.get('amount', 0))),
                'fee_amount_usd': Decimal(str(txn_data.get('fee', 0))),
                'status': txn_data.get('status', 'completed'),
                'processed_at': timezone.now(),
                'description': txn_data.get('description', ''),
                'transaction_data': txn_data
            }
        )
        
        if not created:
            # Update existing transaction
            transaction.status = txn_data.get('status', transaction.status)
            transaction.amount_usd = Decimal(str(txn_data.get('amount', transaction.amount_usd)))
            transaction.save()
    
    def withdraw_investment(self, investment: CapimaxInvestment, amount_usd: Decimal = None) -> Tuple[bool, dict]:
        """
        Withdraw from investment (full or partial)
        """
        withdrawal_data = {
            'investment_id': investment.capimax_investment_id,
            'amount_usd': float(amount_usd) if amount_usd else None,  # None = full withdrawal
            'reason': 'client_request'
        }
        
        success, response = self._make_request(
            'POST',
            f'investments/{investment.capimax_investment_id}/withdraw',
            withdrawal_data,
            'investment_update'
        )
        
        if success:
            # Create withdrawal transaction
            withdrawal_amount = Decimal(str(response.get('withdrawal_amount', amount_usd or investment.current_value_usd)))
            
            CapimaxTransaction.objects.create(
                investment=investment,
                account=investment.account,
                transaction_type='withdrawal',
                amount_usd=withdrawal_amount,
                fee_amount_usd=Decimal(str(response.get('fee', 0))),
                status='processing' if response.get('processing') else 'completed',
                description='Investment withdrawal',
                capimax_transaction_id=response.get('transaction_id', ''),
                transaction_data=response
            )
            
            if not amount_usd or amount_usd >= investment.current_value_usd:
                investment.status = 'completed'
                investment.completed_at = timezone.now()
                investment.save()
        
        return success, response

class CapimaxIntegrationService:
    """
    High-level service for managing Capimax integrations
    """
    
    def __init__(self):
        self.api_service = CapimaxAPIService()
    
    def activate_certificate_for_investment(self, certificate: ElectronicCertificate) -> Tuple[bool, dict]:
        """
        Activate Nova certificate for Capimax investment
        """
        # Check if account already exists
        try:
            account = certificate.capimax_account
            success, response = self.api_service.sync_account_status(account)
            return success, {'account': account, 'sync_data': response}
        except CapimaxAccount.DoesNotExist:
            pass
        
        # Create new account
        success, response = self.api_service.create_account(certificate)
        
        if success:
            account = response['account']
            
            # Update certificate
            certificate.capimax_certificate_id = account.capimax_account_id
            certificate.capimax_investment_active = True
            certificate.save()
            
            return True, {'account': account, 'message': 'Certificate activated for Capimax investment'}
        
        return False, response
    
    def create_investment_opportunity(self, certificate: ElectronicCertificate, investment_data: dict) -> Tuple[bool, dict]:
        """
        Create new investment opportunity for certificate holder
        """
        try:
            account = certificate.capimax_account
        except CapimaxAccount.DoesNotExist:
            # Activate certificate first
            success, response = self.activate_certificate_for_investment(certificate)
            if not success:
                return False, {'error': 'Failed to activate certificate for investment'}
            account = response['account']
        
        # Validate investment amount
        requested_amount = Decimal(str(investment_data.get('amount_usd', 0)))
        if requested_amount > account.available_capacity_usd:
            return False, {
                'error': 'Investment amount exceeds available capacity',
                'requested': float(requested_amount),
                'available': float(account.available_capacity_usd)
            }
        
        # Create investment
        success, response = self.api_service.create_investment(account, investment_data)
        
        if success:
            # Update account capacity
            account.available_capacity_usd -= requested_amount
            account.invested_amount_usd += requested_amount
            account.save()
        
        return success, response
    
    def sync_all_investments(self) -> dict:
        """
        Sync all active investments with Capimax platform
        """
        results = {
            'synced': 0,
            'errors': 0,
            'total_profit': Decimal('0.00'),
            'accounts_updated': 0
        }
        
        # Get all active accounts
        active_accounts = CapimaxAccount.objects.filter(account_status='active')
        
        for account in active_accounts:
            try:
                # Sync account status
                success, response = self.api_service.sync_account_status(account)
                if success:
                    results['accounts_updated'] += 1
                
                # Sync each investment
                for investment in account.investments.filter(status__in=['active', 'pending']):
                    success, response = self.api_service.sync_investment_performance(investment)
                    if success:
                        results['synced'] += 1
                        results['total_profit'] += investment.profit_loss_usd
                    else:
                        results['errors'] += 1
                        
            except Exception as e:
                results['errors'] += 1
                print(f"Error syncing account {account.capimax_account_id}: {e}")
        
        # Update platform sync timestamp
        platform = CapimaxPlatform.objects.filter(is_active=True).first()
        if platform:
            platform.last_sync_at = timezone.now()
            platform.save()
        
        return results
    
    def get_investment_opportunities(self, certificate: ElectronicCertificate) -> List[dict]:
        """
        Get available investment opportunities for certificate
        """
        try:
            account = certificate.capimax_account
        except CapimaxAccount.DoesNotExist:
            return []
        
        # Mock investment opportunities (in real implementation, this would come from Capimax API)
        opportunities = [
            {
                'id': 'forex_eur_usd',
                'name': 'EUR/USD Forex Trading',
                'type': 'forex',
                'min_investment': 100,
                'max_investment': min(float(account.available_capacity_usd), 5000),
                'expected_return': '8-15%',
                'risk_level': 'medium',
                'duration_days': 30,
                'description': 'Currency pair trading with automated risk management'
            },
            {
                'id': 'stocks_tech',
                'name': 'Tech Stocks Portfolio',
                'type': 'stocks',
                'min_investment': 500,
                'max_investment': min(float(account.available_capacity_usd), 10000),
                'expected_return': '12-20%',
                'risk_level': 'high',
                'duration_days': 90,
                'description': 'Diversified technology stocks with growth potential'
            },
            {
                'id': 'bonds_gov',
                'name': 'Government Bonds',
                'type': 'bonds',
                'min_investment': 1000,
                'max_investment': float(account.available_capacity_usd),
                'expected_return': '4-6%',
                'risk_level': 'low',
                'duration_days': 180,
                'description': 'Stable government bond investments with guaranteed returns'
            }
        ]
        
        # Filter by available capacity
        available_opportunities = []
        for opp in opportunities:
            if account.available_capacity_usd >= opp['min_investment']:
                available_opportunities.append(opp)
        
        return available_opportunities
    
    def get_performance_summary(self, certificate: ElectronicCertificate) -> dict:
        """
        Get performance summary for certificate investments
        """
        try:
            account = certificate.capimax_account
        except CapimaxAccount.DoesNotExist:
            return {
                'active': False,
                'message': 'Certificate not activated for investment'
            }
        
        # Calculate performance metrics
        total_invested = account.invested_amount_usd
        total_current_value = sum(inv.current_value_usd for inv in account.investments.all())
        total_profit = account.net_profit_usd
        
        return {
            'active': True,
            'account_status': account.get_account_status_display(),
            'total_capacity': float(account.total_capacity_usd),
            'available_capacity': float(account.available_capacity_usd),
            'total_invested': float(total_invested),
            'current_value': float(total_current_value),
            'total_profit': float(total_profit),
            'profit_percentage': float((total_profit / total_invested * 100) if total_invested > 0 else 0),
            'active_investments': account.investments.filter(status='active').count(),
            'completed_investments': account.investments.filter(status='completed').count(),
            'last_activity': account.last_activity_at.isoformat() if account.last_activity_at else None
        }