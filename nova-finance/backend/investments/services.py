import requests
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from typing import Dict, List, Optional, Any

from .models import (
    InvestmentPlatform, UserInvestmentAccount, InvestmentPosition,
    InvestmentTransaction, CapimaxIntegration, InvestmentAlert
)
from loans.models import Loan


class CapimaxAPIService:
    """
    Service for integrating with Capimax investment platform
    """

    def __init__(self):
        self.base_url = getattr(settings, 'CAPIMAX_API_URL', 'https://api.capimax.com/v1')
        self.client_id = getattr(settings, 'CAPIMAX_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'CAPIMAX_CLIENT_SECRET', '')

    def _make_request(self, method: str, endpoint: str, data: Dict = None, 
                     user_api_key: str = None) -> Dict:
        """
        Make authenticated request to Capimax API
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'NovaFinance/1.0'
        }

        # Add authentication
        if user_api_key:
            headers['X-API-KEY'] = user_api_key
        else:
            # Use platform credentials
            timestamp = str(int(datetime.now().timestamp()))
            signature = self._generate_signature(method, endpoint, data, timestamp)
            headers.update({
                'X-CLIENT-ID': self.client_id,
                'X-TIMESTAMP': timestamp,
                'X-SIGNATURE': signature
            })

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Capimax API error: {str(e)}")

    def _generate_signature(self, method: str, endpoint: str, data: Dict, timestamp: str) -> str:
        """
        Generate HMAC signature for API authentication
        """
        message = f"{method.upper()}{endpoint}{json.dumps(data) if data else ''}{timestamp}"
        signature = hmac.new(
            self.client_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature

    def create_user_account(self, user, loan: Loan) -> Dict:
        """
        Create user account on Capimax platform
        """
        account_data = {
            'external_user_id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'loan_certificate': {
                'loan_id': str(loan.id),
                'loan_number': loan.loan_number,
                'currency': loan.currency.symbol,
                'amount_usd': str(loan.principal_amount_usd),
                'certificate_url': self._get_loan_certificate_url(loan)
            }
        }

        response = self._make_request('POST', '/accounts', account_data)
        return response

    def get_account_balance(self, account: UserInvestmentAccount) -> Dict:
        """
        Get account balance from Capimax
        """
        response = self._make_request(
            'GET', 
            f'/accounts/{account.platform_user_id}/balance',
            user_api_key=account.api_key
        )
        return response

    def create_investment_position(self, account: UserInvestmentAccount, 
                                 asset_symbol: str, amount_usd: Decimal,
                                 strategy: str = 'balanced') -> Dict:
        """
        Create new investment position
        """
        position_data = {
            'asset_symbol': asset_symbol,
            'investment_amount': str(amount_usd),
            'strategy': strategy,
            'auto_trade': True
        }

        response = self._make_request(
            'POST',
            f'/accounts/{account.platform_user_id}/positions',
            position_data,
            user_api_key=account.api_key
        )
        return response

    def close_position(self, account: UserInvestmentAccount, position_id: str) -> Dict:
        """
        Close an investment position
        """
        response = self._make_request(
            'DELETE',
            f'/accounts/{account.platform_user_id}/positions/{position_id}',
            user_api_key=account.api_key
        )
        return response

    def get_market_data(self, symbols: List[str]) -> Dict:
        """
        Get current market data for symbols
        """
        cache_key = f"capimax_market_data_{'_'.join(symbols)}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data

        response = self._make_request(
            'GET',
            f'/market/quotes?symbols={",".join(symbols)}'
        )
        
        # Cache for 30 seconds
        cache.set(cache_key, response, 30)
        return response

    def get_account_positions(self, account: UserInvestmentAccount) -> List[Dict]:
        """
        Get all positions for an account
        """
        response = self._make_request(
            'GET',
            f'/accounts/{account.platform_user_id}/positions',
            user_api_key=account.api_key
        )
        return response.get('positions', [])

    def get_account_transactions(self, account: UserInvestmentAccount, 
                               start_date: datetime = None, 
                               end_date: datetime = None) -> List[Dict]:
        """
        Get account transaction history
        """
        params = {}
        if start_date:
            params['start_date'] = start_date.isoformat()
        if end_date:
            params['end_date'] = end_date.isoformat()

        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f'/accounts/{account.platform_user_id}/transactions'
        if query_string:
            endpoint += f'?{query_string}'

        response = self._make_request('GET', endpoint, user_api_key=account.api_key)
        return response.get('transactions', [])

    def _get_loan_certificate_url(self, loan: Loan) -> str:
        """
        Get URL for loan certificate document
        """
        # This would return the actual certificate URL from the documents app
        return f"{settings.SITE_URL}/api/documents/loan/{loan.id}/certificate/"


class InvestmentManagementService:
    """
    Service for managing investments and integrating with platforms
    """

    def __init__(self):
        self.capimax_api = CapimaxAPIService()

    def setup_user_investment_account(self, user, loan: Loan, platform_slug: str = 'capimax') -> UserInvestmentAccount:
        """
        Set up user investment account on specified platform
        """
        try:
            platform = InvestmentPlatform.objects.get(slug=platform_slug, status='active')
        except InvestmentPlatform.DoesNotExist:
            raise Exception(f"Investment platform '{platform_slug}' not found or inactive")

        # Check if account already exists
        account, created = UserInvestmentAccount.objects.get_or_create(
            user=user,
            platform=platform,
            defaults={
                'platform_user_id': '',
                'verification_status': 'pending'
            }
        )

        if created or not account.platform_user_id:
            # Create account on external platform
            if platform_slug == 'capimax':
                api_response = self.capimax_api.create_user_account(user, loan)
                account.platform_user_id = api_response.get('user_id')
                account.api_key = api_response.get('api_key')  # Would be encrypted in production
                account.verification_status = 'verified'
                account.verified_at = timezone.now()
                account.save()

        return account

    def create_investment_from_loan(self, loan: Loan, investment_amount_usd: Decimal,
                                  asset_symbol: str = 'BTC', strategy: str = 'balanced') -> InvestmentPosition:
        """
        Create investment position using loan certificate as collateral
        """
        # Validate loan is active and signed
        if loan.status != 'active':
            raise Exception("Loan must be active to create investments")

        # Check if loan has required documents
        if not loan.documents.filter(document_type='loan_certificate', status='signed').exists():
            raise Exception("Loan certificate must be signed before investing")

        # Get or create investment account
        account = self.setup_user_investment_account(loan.user, loan)

        # Validate investment amount
        max_investment = loan.principal_amount_usd * Decimal('0.8')  # 80% of loan value
        if investment_amount_usd > max_investment:
            raise Exception(f"Investment amount cannot exceed ${max_investment}")

        # Create position on external platform
        api_response = self.capimax_api.create_investment_position(
            account, asset_symbol, investment_amount_usd, strategy
        )

        # Create local position record
        position = InvestmentPosition.objects.create(
            account=account,
            loan=loan,
            position_id=api_response.get('position_id'),
            asset_symbol=asset_symbol,
            asset_name=api_response.get('asset_name', asset_symbol),
            investment_amount_usd=investment_amount_usd,
            entry_price=Decimal(api_response.get('entry_price', '0')),
            quantity=Decimal(api_response.get('quantity', '0')),
            opened_at=timezone.now(),
            status='active'
        )

        # Create transaction record
        InvestmentTransaction.objects.create(
            account=account,
            position=position,
            transaction_id=api_response.get('transaction_id'),
            transaction_type='buy',
            asset_symbol=asset_symbol,
            quantity=position.quantity,
            price=position.entry_price,
            amount_usd=investment_amount_usd,
            executed_at=timezone.now(),
            status='completed'
        )

        return position

    def update_position_prices(self, position: InvestmentPosition):
        """
        Update position with current market prices
        """
        try:
            market_data = self.capimax_api.get_market_data([position.asset_symbol])
            current_price = Decimal(market_data.get('quotes', {}).get(position.asset_symbol, {}).get('price', '0'))
            
            if current_price > 0:
                position.current_price = current_price
                position.current_value_usd = position.quantity * current_price
                position.unrealized_pnl_usd = position.current_value_usd - position.investment_amount_usd
                position.save()

                # Check for alerts
                self._check_position_alerts(position)

        except Exception as e:
            # Log error but don't fail completely
            print(f"Failed to update position prices: {e}")

    def sync_account_data(self, account: UserInvestmentAccount):
        """
        Sync account data with external platform
        """
        try:
            # Update balance
            balance_data = self.capimax_api.get_account_balance(account)
            account.balance_usd = Decimal(balance_data.get('balance', '0'))
            account.available_balance_usd = Decimal(balance_data.get('available_balance', '0'))
            account.save()

            # Update positions
            positions_data = self.capimax_api.get_account_positions(account)
            for pos_data in positions_data:
                try:
                    position = InvestmentPosition.objects.get(
                        account=account,
                        position_id=pos_data.get('position_id')
                    )
                    position.current_price = Decimal(pos_data.get('current_price', '0'))
                    position.current_value_usd = Decimal(pos_data.get('current_value', '0'))
                    position.unrealized_pnl_usd = Decimal(pos_data.get('unrealized_pnl', '0'))
                    position.status = pos_data.get('status', 'active')
                    if pos_data.get('closed_at'):
                        position.closed_at = datetime.fromisoformat(pos_data['closed_at'].replace('Z', '+00:00'))
                    position.save()
                except InvestmentPosition.DoesNotExist:
                    continue

        except Exception as e:
            print(f"Failed to sync account data: {e}")

    def close_investment_position(self, position: InvestmentPosition) -> bool:
        """
        Close an investment position
        """
        try:
            # Close position on external platform
            api_response = self.capimax_api.close_position(position.account, position.position_id)
            
            # Update local position
            position.status = 'closed'
            position.closed_at = timezone.now()
            position.realized_pnl_usd = position.unrealized_pnl_usd
            position.save()

            # Create closing transaction
            InvestmentTransaction.objects.create(
                account=position.account,
                position=position,
                transaction_id=api_response.get('transaction_id'),
                transaction_type='sell',
                asset_symbol=position.asset_symbol,
                quantity=position.quantity,
                price=position.current_price,
                amount_usd=position.current_value_usd,
                executed_at=timezone.now(),
                status='completed'
            )

            return True

        except Exception as e:
            print(f"Failed to close position: {e}")
            return False

    def _check_position_alerts(self, position: InvestmentPosition):
        """
        Check if position triggers any alerts
        """
        if not hasattr(position.account.user, 'capimaxintegration'):
            return

        integration = position.account.user.capimaxintegration
        profit_loss_pct = position.profit_loss_percentage

        # Check stop loss
        if profit_loss_pct <= -integration.stop_loss_percentage:
            self._create_alert(
                position, 'stop_loss', 'high',
                'Stop Loss Triggered',
                f'Your {position.asset_symbol} position has hit the stop loss threshold of {integration.stop_loss_percentage}%'
            )

        # Check take profit
        elif profit_loss_pct >= integration.take_profit_percentage:
            self._create_alert(
                position, 'take_profit', 'medium',
                'Take Profit Target Reached',
                f'Your {position.asset_symbol} position has reached the take profit target of {integration.take_profit_percentage}%'
            )

    def _create_alert(self, position: InvestmentPosition, alert_type: str, priority: str, title: str, message: str):
        """
        Create investment alert
        """
        InvestmentAlert.objects.create(
            user=position.account.user,
            account=position.account,
            position=position,
            alert_type=alert_type,
            priority=priority,
            title=title,
            message=message,
            triggered_at=timezone.now()
        )

    def get_user_portfolio_summary(self, user) -> Dict:
        """
        Get comprehensive portfolio summary for user
        """
        accounts = UserInvestmentAccount.objects.filter(user=user, is_active=True)
        
        summary = {
            'total_balance_usd': Decimal('0.00'),
            'total_invested_usd': Decimal('0.00'),
            'total_pnl_usd': Decimal('0.00'),
            'total_pnl_percentage': Decimal('0.00'),
            'active_positions_count': 0,
            'platforms': [],
            'positions': []
        }

        for account in accounts:
            positions = account.positions.filter(status='active')
            account_invested = sum(p.investment_amount_usd for p in positions)
            account_pnl = sum(p.unrealized_pnl_usd for p in positions)
            
            summary['total_balance_usd'] += account.balance_usd
            summary['total_invested_usd'] += account_invested
            summary['total_pnl_usd'] += account_pnl
            summary['active_positions_count'] += positions.count()
            
            summary['platforms'].append({
                'name': account.platform.name,
                'balance': account.balance_usd,
                'invested': account_invested,
                'pnl': account_pnl,
                'positions_count': positions.count()
            })
            
            for position in positions:
                summary['positions'].append({
                    'id': str(position.id),
                    'asset_symbol': position.asset_symbol,
                    'asset_name': position.asset_name,
                    'investment_amount': position.investment_amount_usd,
                    'current_value': position.current_value_usd,
                    'pnl': position.unrealized_pnl_usd,
                    'pnl_percentage': position.profit_loss_percentage,
                    'platform': account.platform.name
                })

        # Calculate overall P&L percentage
        if summary['total_invested_usd'] > 0:
            summary['total_pnl_percentage'] = (summary['total_pnl_usd'] / summary['total_invested_usd']) * 100

        return summary