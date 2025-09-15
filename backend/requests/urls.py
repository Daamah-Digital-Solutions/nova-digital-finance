from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoanRequestViewSet, RequestEligibilityView, RequestCommentsViewSet, 
    RequestHistoryViewSet
)

app_name = 'requests'

router = DefaultRouter()
router.register(r'loan-requests', LoanRequestViewSet, basename='loan-request')
router.register(r'comments', RequestCommentsViewSet, basename='request-comment')
router.register(r'history', RequestHistoryViewSet, basename='request-history')

urlpatterns = [
    path('', include(router.urls)),
    
    # Eligibility check
    path('eligibility/', RequestEligibilityView.as_view(), name='request-eligibility'),
]