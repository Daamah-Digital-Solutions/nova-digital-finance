from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, KYCDocument, UserProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_kyc_verified', 'kyc_status')
    list_filter = ('is_kyc_verified', 'kyc_status', 'preferred_language', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Nova Finance Info', {
            'fields': ('phone_number', 'is_kyc_verified', 'kyc_status', 'preferred_language', 'client_number')
        }),
    )

@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'is_verified', 'uploaded_at')
    list_filter = ('document_type', 'is_verified')
    search_fields = ('user__email', 'user__username')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'nationality', 'city', 'country')
    search_fields = ('user__email', 'full_name', 'nationality')
