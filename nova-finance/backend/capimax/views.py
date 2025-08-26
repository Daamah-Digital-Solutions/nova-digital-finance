from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from decimal import Decimal

from .models import CapimaxAccount, CapimaxInvestment, CapimaxTransaction, CapimaxPlatform
from .services import CapimaxIntegrationService, CapimaxAPIService
from pronova.models import ElectronicCertificate

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_certificate(request):
    """
    Activate user's certificate for Capimax investment
    """
    try:
        # Get user's active certificate
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
    except ElectronicCertificate.DoesNotExist:
        return Response({
            'error': 'No active certificate found for investment'
        }, status=status.HTTP_404_NOT_FOUND)
    
    service = CapimaxIntegrationService()
    success, response = service.activate_certificate_for_investment(certificate)
    
    if success:
        return Response({
            'success': True,
            'message': 'Certificate activated for Capimax investment',
            'account_id': response['account'].capimax_account_id,
            'capacity_usd': float(response['account'].total_capacity_usd)
        })
    else:
        return Response({
            'error': 'Failed to activate certificate',
            'details': response
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_status(request):
    """
    Get user's Capimax account status
    """
    try:
        certificate = ElectronicCertificate.objects.filter(
            user=request.user,
            status='pledged'
        ).first()
        
        if not certificate:
            return Response({
                'active': False,
                'message': 'No pledged certificate found'
            })
            
        account = certificate.capimax_account
    except CapimaxAccount.DoesNotExist:
        return Response({
            'active': False,
            'message': 'No Capimax account found'
        })
    
    service = CapimaxAPIService()
    success, sync_data = service.sync_account_status(account)
    
    account.refresh_from_db()
    
    return Response({
        'active': True,
        'account_id': account.capimax_account_id,
        'status': account.get_account_status_display(),
        'total_capacity_usd': float(account.total_capacity_usd),
        'available_capacity_usd': float(account.available_capacity_usd),
        'invested_amount_usd': float(account.invested_amount_usd),
        'total_profits_usd': float(account.total_profits_usd),
        'total_losses_usd': float(account.total_losses_usd),
        'net_profit_usd': float(account.net_profit_usd),
        'last_activity': account.last_activity_at.isoformat() if account.last_activity_at else None,
        'sync_success': success
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_account(request):
    """
    Manually sync account with Capimax platform
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
        account = certificate.capimax_account
    except (ElectronicCertificate.DoesNotExist, CapimaxAccount.DoesNotExist):
        return Response({
            'error': 'No Capimax account found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    service = CapimaxAPIService()
    success, response = service.sync_account_status(account)
    
    if success:
        return Response({
            'success': True,
            'message': 'Account synchronized successfully',
            'sync_data': response
        })
    else:
        return Response({
            'error': 'Failed to sync account',
            'details': response
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def investment_opportunities(request):
    """
    Get available investment opportunities for user
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
    except ElectronicCertificate.DoesNotExist:
        return Response({
            'error': 'No active certificate found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    service = CapimaxIntegrationService()
    opportunities = service.get_investment_opportunities(certificate)
    
    return Response({
        'opportunities': opportunities,
        'total_available': len(opportunities)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_investment(request):
    """
    Create new investment
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
    except ElectronicCertificate.DoesNotExist:
        return Response({
            'error': 'No active certificate found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Validate request data
    required_fields = ['investment_type', 'amount_usd']
    for field in required_fields:
        if field not in request.data:
            return Response({
                'error': f'Missing required field: {field}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    investment_data = {
        'investment_type': request.data['investment_type'],
        'amount_usd': Decimal(str(request.data['amount_usd'])),
        'risk_level': request.data.get('risk_level', 'medium'),
        'duration_days': request.data.get('duration_days', 30),
        'investment_name': request.data.get('investment_name'),
        'expected_return': request.data.get('expected_return', 0),
        'description': request.data.get('description', ''),
        'terms': request.data.get('terms', {})
    }
    
    service = CapimaxIntegrationService()
    success, response = service.create_investment_opportunity(certificate, investment_data)
    
    if success:
        investment = response['investment']
        return Response({
            'success': True,
            'investment_id': str(investment.id),
            'investment_name': investment.investment_name,
            'amount_usd': float(investment.invested_amount_usd),
            'status': investment.get_status_display(),
            'expected_completion': investment.expected_completion_at.isoformat() if investment.expected_completion_at else None
        })
    else:
        return Response({
            'error': 'Failed to create investment',
            'details': response
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_investments(request):
    """
    Get user's investments list
    """
    try:
        certificate = ElectronicCertificate.objects.filter(
            user=request.user,
            status='pledged'
        ).first()
        
        if not certificate:
            return Response({
                'investments': [],
                'total': 0,
                'message': 'No pledged certificate found'
            })
            
        account = certificate.capimax_account
    except CapimaxAccount.DoesNotExist:
        return Response({
            'investments': [],
            'total': 0,
            'message': 'No Capimax account found'
        })
    
    investments = account.investments.all().order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(investments, 20)
    investments_page = paginator.get_page(page)
    
    investments_data = []
    for investment in investments_page:
        investments_data.append({
            'id': str(investment.id),
            'investment_id': investment.investment_id,
            'name': investment.investment_name,
            'type': investment.get_investment_type_display(),
            'invested_amount_usd': float(investment.invested_amount_usd),
            'current_value_usd': float(investment.current_value_usd),
            'profit_loss_usd': float(investment.profit_loss_usd),
            'profit_loss_percentage': float(investment.profit_loss_percentage),
            'status': investment.get_status_display(),
            'risk_level': investment.get_risk_level_display(),
            'started_at': investment.started_at.isoformat(),
            'expected_completion_at': investment.expected_completion_at.isoformat() if investment.expected_completion_at else None,
            'completed_at': investment.completed_at.isoformat() if investment.completed_at else None
        })
    
    return Response({
        'investments': investments_data,
        'total': paginator.count,
        'page': page,
        'pages': paginator.num_pages
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def investment_detail(request, investment_id):
    """
    Get detailed investment information
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
        account = certificate.capimax_account
        investment = get_object_or_404(CapimaxInvestment, id=investment_id, account=account)
    except (ElectronicCertificate.DoesNotExist, CapimaxAccount.DoesNotExist):
        return Response({
            'error': 'Investment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Sync investment performance
    service = CapimaxAPIService()
    service.sync_investment_performance(investment)
    investment.refresh_from_db()
    
    # Get transactions
    transactions = investment.transactions.all().order_by('-created_at')[:10]
    transactions_data = []
    for txn in transactions:
        transactions_data.append({
            'id': str(txn.id),
            'type': txn.get_transaction_type_display(),
            'amount_usd': float(txn.amount_usd),
            'fee_amount_usd': float(txn.fee_amount_usd),
            'net_amount_usd': float(txn.net_amount_usd),
            'status': txn.get_status_display(),
            'processed_at': txn.processed_at.isoformat() if txn.processed_at else None,
            'description': txn.description
        })
    
    return Response({
        'id': str(investment.id),
        'investment_id': investment.investment_id,
        'name': investment.investment_name,
        'type': investment.get_investment_type_display(),
        'description': investment.investment_description,
        'invested_amount_usd': float(investment.invested_amount_usd),
        'current_value_usd': float(investment.current_value_usd),
        'profit_loss_usd': float(investment.profit_loss_usd),
        'profit_loss_percentage': float(investment.profit_loss_percentage),
        'status': investment.get_status_display(),
        'risk_level': investment.get_risk_level_display(),
        'expected_return_percentage': float(investment.expected_return_percentage) if investment.expected_return_percentage else None,
        'started_at': investment.started_at.isoformat(),
        'expected_completion_at': investment.expected_completion_at.isoformat() if investment.expected_completion_at else None,
        'completed_at': investment.completed_at.isoformat() if investment.completed_at else None,
        'investment_terms': investment.investment_terms,
        'recent_transactions': transactions_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_investment(request, investment_id):
    """
    Withdraw from investment (full or partial)
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
        account = certificate.capimax_account
        investment = get_object_or_404(CapimaxInvestment, id=investment_id, account=account)
    except (ElectronicCertificate.DoesNotExist, CapimaxAccount.DoesNotExist):
        return Response({
            'error': 'Investment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if investment.status not in ['active', 'completed']:
        return Response({
            'error': 'Cannot withdraw from this investment'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    withdrawal_amount = None
    if 'amount_usd' in request.data:
        withdrawal_amount = Decimal(str(request.data['amount_usd']))
        if withdrawal_amount > investment.current_value_usd:
            return Response({
                'error': 'Withdrawal amount exceeds current investment value'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    service = CapimaxAPIService()
    success, response = service.withdraw_investment(investment, withdrawal_amount)
    
    if success:
        return Response({
            'success': True,
            'message': 'Withdrawal initiated successfully',
            'withdrawal_amount': float(response.get('withdrawal_amount', withdrawal_amount or investment.current_value_usd)),
            'processing': response.get('processing', False)
        })
    else:
        return Response({
            'error': 'Failed to process withdrawal',
            'details': response
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_summary(request):
    """
    Get investment performance summary
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
    except ElectronicCertificate.DoesNotExist:
        return Response({
            'active': False,
            'message': 'No active certificate found'
        })
    
    service = CapimaxIntegrationService()
    summary = service.get_performance_summary(certificate)
    
    return Response(summary)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    """
    Get user's transaction history
    """
    try:
        certificate = ElectronicCertificate.objects.get(
            user=request.user,
            status='pledged'
        )
        account = certificate.capimax_account
    except (ElectronicCertificate.DoesNotExist, CapimaxAccount.DoesNotExist):
        return Response({
            'transactions': [],
            'total': 0
        })
    
    transactions = account.transactions.all().order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(transactions, 50)
    transactions_page = paginator.get_page(page)
    
    transactions_data = []
    for txn in transactions_page:
        transactions_data.append({
            'id': str(txn.id),
            'transaction_id': txn.transaction_id,
            'type': txn.get_transaction_type_display(),
            'amount_usd': float(txn.amount_usd),
            'fee_amount_usd': float(txn.fee_amount_usd),
            'net_amount_usd': float(txn.net_amount_usd),
            'status': txn.get_status_display(),
            'investment_name': txn.investment.investment_name if txn.investment else 'General Account',
            'processed_at': txn.processed_at.isoformat() if txn.processed_at else None,
            'created_at': txn.created_at.isoformat(),
            'description': txn.description
        })
    
    return Response({
        'transactions': transactions_data,
        'total': paginator.count,
        'page': page,
        'pages': paginator.num_pages
    })

# Admin endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_sync_all(request):
    """
    Admin endpoint to sync all investments
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    service = CapimaxIntegrationService()
    results = service.sync_all_investments()
    
    return Response({
        'success': True,
        'message': 'Synchronization completed',
        'results': results
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_accounts_list(request):
    """
    Admin endpoint to list all Capimax accounts
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    accounts = CapimaxAccount.objects.all().order_by('-created_at')
    
    accounts_data = []
    for account in accounts:
        accounts_data.append({
            'id': str(account.id),
            'account_id': account.capimax_account_id,
            'user_email': account.user.email,
            'status': account.get_account_status_display(),
            'total_capacity_usd': float(account.total_capacity_usd),
            'invested_amount_usd': float(account.invested_amount_usd),
            'net_profit_usd': float(account.net_profit_usd),
            'active_investments': account.investments.filter(status='active').count(),
            'created_at': account.created_at.isoformat()
        })
    
    return Response({
        'accounts': accounts_data,
        'total': len(accounts_data)
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_platform_settings(request):
    """
    Admin endpoint to manage platform settings
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    platform = CapimaxPlatform.objects.filter(is_active=True).first()
    
    if request.method == 'GET':
        if not platform:
            return Response({
                'error': 'No active platform found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'platform_name': platform.platform_name,
            'api_base_url': platform.api_base_url,
            'is_active': platform.is_active,
            'accepts_nova_certificates': platform.accepts_nova_certificates,
            'minimum_investment_usd': float(platform.minimum_investment_usd),
            'maximum_investment_usd': float(platform.maximum_investment_usd),
            'platform_fee_percentage': float(platform.platform_fee_percentage),
            'auto_sync_enabled': platform.auto_sync_enabled,
            'sync_interval_minutes': platform.sync_interval_minutes,
            'last_sync_at': platform.last_sync_at.isoformat() if platform.last_sync_at else None
        })
    
    elif request.method == 'POST':
        if not platform:
            platform = CapimaxPlatform()
        
        # Update platform settings
        updatable_fields = [
            'platform_name', 'api_base_url', 'is_active', 'accepts_nova_certificates',
            'minimum_investment_usd', 'maximum_investment_usd', 'platform_fee_percentage',
            'auto_sync_enabled', 'sync_interval_minutes'
        ]
        
        for field in updatable_fields:
            if field in request.data:
                setattr(platform, field, request.data[field])
        
        platform.save()
        
        return Response({
            'success': True,
            'message': 'Platform settings updated successfully'
        })