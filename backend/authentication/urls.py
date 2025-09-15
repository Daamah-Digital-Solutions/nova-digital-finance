from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', views.password_reset_request, name='password_reset'),
    
    # User profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('dashboard/', views.user_dashboard_data, name='dashboard_data'),
    
    # KYC endpoints
    path('kyc/submit/', views.KYCSubmissionView.as_view(), name='kyc_submit'),
    path('kyc/status/', views.kyc_status, name='kyc_status'),
    path('kyc/documents/', views.KYCDocumentListView.as_view(), name='kyc_documents'),
    path('kyc/documents/upload/', views.KYCDocumentUploadView.as_view(), name='kyc_document_upload'),
]