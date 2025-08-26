from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvestmentPlatformViewSet, UserInvestmentAccountViewSet, InvestmentPositionViewSet,
    InvestmentTransactionViewSet, CapimaxIntegrationViewSet, InvestmentAlertViewSet,
    PortfolioSummaryView, MarketDataView, InvestmentOpportunityView
)

app_name = 'investments'

router = DefaultRouter()
router.register(r'platforms', InvestmentPlatformViewSet, basename='platform')
router.register(r'accounts', UserInvestmentAccountViewSet, basename='account')
router.register(r'positions', InvestmentPositionViewSet, basename='position')
router.register(r'transactions', InvestmentTransactionViewSet, basename='transaction')
router.register(r'capimax', CapimaxIntegrationViewSet, basename='capimax')
router.register(r'alerts', InvestmentAlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
    
    # Portfolio and market data
    path('portfolio/summary/', PortfolioSummaryView.as_view(), name='portfolio-summary'),
    path('market/data/', MarketDataView.as_view(), name='market-data'),
    
    # Investment opportunities
    path('opportunities/', InvestmentOpportunityView.as_view(), name='opportunities'),
]