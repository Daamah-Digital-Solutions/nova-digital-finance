from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal

from .models import (
    InvestmentPlatform, UserInvestmentAccount, InvestmentPosition,
    InvestmentTransaction, CapimaxIntegration, InvestmentAlert
)
from .serializers import (
    InvestmentPlatformSerializer, UserInvestmentAccountSerializer, InvestmentPositionSerializer,
    InvestmentTransactionSerializer, CapimaxIntegrationSerializer, InvestmentAlertSerializer,
    CreateInvestmentPositionSerializer, PortfolioSummarySerializer, MarketDataSerializer,
    InvestmentOpportunitySerializer, ClosePositionSerializer
)
from .services import InvestmentManagementService, CapimaxAPIService
from loans.models import Loan


class InvestmentPlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for investment platforms
    """
    queryset = InvestmentPlatform.objects.filter(status='active')
    serializer_class = InvestmentPlatformSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        platform_type = self.request.query_params.get('type')
        if platform_type:
            queryset = queryset.filter(platform_type=platform_type)
        return queryset


class UserInvestmentAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user investment accounts
    """
    serializer_class = UserInvestmentAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserInvestmentAccount.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """
        Sync account data with external platform
        """
        account = self.get_object()
        service = InvestmentManagementService()
        
        try:
            service.sync_account_data(account)
            return Response({'message': 'Account synced successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InvestmentPositionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for investment positions
    """
    serializer_class = InvestmentPositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_accounts = UserInvestmentAccount.objects.filter(user=self.request.user)
        return InvestmentPosition.objects.filter(account__in=user_accounts).order_by('-opened_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateInvestmentPositionSerializer
        elif self.action == 'close':
            return ClosePositionSerializer
        return InvestmentPositionSerializer

    def create(self, request, *args, **kwargs):
        """
        Create new investment position
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get loan
            loan = get_object_or_404(Loan, id=serializer.validated_data['loan_id'], user=request.user)
            
            # Create investment position
            service = InvestmentManagementService()
            position = service.create_investment_from_loan(
                loan=loan,
                investment_amount_usd=serializer.validated_data['investment_amount_usd'],
                asset_symbol=serializer.validated_data['asset_symbol'],
                strategy=serializer.validated_data['strategy']
            )
            
            # Return created position
            response_serializer = InvestmentPositionSerializer(position, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Close an investment position
        """
        position = self.get_object()
        serializer = ClosePositionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if position.status != 'active':
            return Response(
                {'error': 'Position is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = InvestmentManagementService()
            success = service.close_investment_position(position)
            
            if success:
                # Refresh position data
                position.refresh_from_db()
                response_serializer = InvestmentPositionSerializer(position, context={'request': request})
                return Response(response_serializer.data)
            else:
                return Response(
                    {'error': 'Failed to close position'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def update_price(self, request, pk=None):
        """
        Update position with current market price
        """
        position = self.get_object()
        service = InvestmentManagementService()
        
        try:
            service.update_position_prices(position)
            position.refresh_from_db()
            serializer = InvestmentPositionSerializer(position, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InvestmentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for investment transactions
    """
    serializer_class = InvestmentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_accounts = UserInvestmentAccount.objects.filter(user=self.request.user)
        return InvestmentTransaction.objects.filter(account__in=user_accounts).order_by('-executed_at')


class CapimaxIntegrationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Capimax integration settings
    """
    serializer_class = CapimaxIntegrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CapimaxIntegration.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Create Capimax integration for user
        """
        # Check if integration already exists
        if CapimaxIntegration.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'Capimax integration already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create integration
        integration = serializer.save(user=request.user)
        
        # Generate Capimax user ID (would be handled by external API in production)
        integration.capimax_user_id = f"NF_{request.user.id}_{integration.id}"
        integration.save()
        
        return Response(
            CapimaxIntegrationSerializer(integration, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class InvestmentAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for investment alerts
    """
    serializer_class = InvestmentAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InvestmentAlert.objects.filter(user=self.request.user).order_by('-triggered_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark alert as read
        """
        alert = self.get_object()
        alert.is_read = True
        alert.read_at = timezone.now()
        alert.save()
        
        serializer = InvestmentAlertSerializer(alert, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        Dismiss alert
        """
        alert = self.get_object()
        alert.is_dismissed = True
        alert.save()
        
        return Response({'message': 'Alert dismissed'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all alerts as read
        """
        alerts = self.get_queryset().filter(is_read=False)
        alerts.update(is_read=True, read_at=timezone.now())
        
        return Response({'message': f'{alerts.count()} alerts marked as read'})


class PortfolioSummaryView(APIView):
    """
    View for getting user's portfolio summary
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get comprehensive portfolio summary
        """
        service = InvestmentManagementService()
        
        try:
            summary = service.get_user_portfolio_summary(request.user)
            serializer = PortfolioSummarySerializer(summary)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MarketDataView(APIView):
    """
    View for getting market data
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get current market data for supported assets
        """
        symbols = request.query_params.get('symbols', 'BTC,ETH,BNB,ADA').split(',')
        
        try:
            api_service = CapimaxAPIService()
            market_data = api_service.get_market_data(symbols)
            
            # Transform data for response
            formatted_data = []
            for symbol, data in market_data.get('quotes', {}).items():
                formatted_data.append({
                    'symbol': symbol,
                    'price': data.get('price', '0'),
                    'change_24h': data.get('change_24h', '0'),
                    'change_24h_percent': data.get('change_24h_percent', '0'),
                    'volume_24h': data.get('volume_24h', '0'),
                    'market_cap': data.get('market_cap'),
                    'last_updated': timezone.now()
                })
            
            serializer = MarketDataSerializer(formatted_data, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InvestmentOpportunityView(APIView):
    """
    View for getting investment opportunities based on user's loans
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get investment opportunities for user's active loans
        """
        # Get user's active loans with certificates
        loans = Loan.objects.filter(
            user=request.user,
            status='active'
        ).filter(
            document__document_type='loan_certificate',
            document__status='signed'
        ).distinct()

        opportunities = []
        for loan in loans:
            # Calculate available investment amount (80% of loan value)
            max_investment_pct = Decimal('80.00')
            available_amount = loan.principal_amount_usd * (max_investment_pct / 100)

            # Get recommended assets based on loan amount
            recommended_assets = self._get_recommended_assets(available_amount)
            
            opportunity = {
                'loan_id': loan.id,
                'loan_number': loan.loan_number,
                'currency_symbol': loan.currency.symbol,
                'loan_amount_usd': loan.principal_amount_usd,
                'available_for_investment_usd': available_amount,
                'max_investment_percentage': max_investment_pct,
                'recommended_assets': recommended_assets,
                'risk_level': self._determine_risk_level(available_amount),
                'expected_return_range': {
                    'min_annual': '5.0',
                    'max_annual': '25.0'
                }
            }
            opportunities.append(opportunity)

        serializer = InvestmentOpportunitySerializer(opportunities, many=True)
        return Response(serializer.data)

    def _get_recommended_assets(self, investment_amount):
        """
        Get recommended assets based on investment amount
        """
        if investment_amount < Decimal('100'):
            return [
                {'symbol': 'BTC', 'name': 'Bitcoin', 'allocation': '60', 'risk': 'Medium'},
                {'symbol': 'ETH', 'name': 'Ethereum', 'allocation': '40', 'risk': 'Medium'}
            ]
        elif investment_amount < Decimal('1000'):
            return [
                {'symbol': 'BTC', 'name': 'Bitcoin', 'allocation': '40', 'risk': 'Medium'},
                {'symbol': 'ETH', 'name': 'Ethereum', 'allocation': '30', 'risk': 'Medium'},
                {'symbol': 'BNB', 'name': 'Binance Coin', 'allocation': '20', 'risk': 'Medium'},
                {'symbol': 'ADA', 'name': 'Cardano', 'allocation': '10', 'risk': 'High'}
            ]
        else:
            return [
                {'symbol': 'BTC', 'name': 'Bitcoin', 'allocation': '30', 'risk': 'Medium'},
                {'symbol': 'ETH', 'name': 'Ethereum', 'allocation': '25', 'risk': 'Medium'},
                {'symbol': 'BNB', 'name': 'Binance Coin', 'allocation': '15', 'risk': 'Medium'},
                {'symbol': 'ADA', 'name': 'Cardano', 'allocation': '15', 'risk': 'High'},
                {'symbol': 'DOT', 'name': 'Polkadot', 'allocation': '10', 'risk': 'High'},
                {'symbol': 'LINK', 'name': 'Chainlink', 'allocation': '5', 'risk': 'High'}
            ]

    def _determine_risk_level(self, investment_amount):
        """
        Determine risk level based on investment amount
        """
        if investment_amount < Decimal('100'):
            return 'Conservative'
        elif investment_amount < Decimal('1000'):
            return 'Moderate'
        else:
            return 'Aggressive'