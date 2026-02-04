from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Personal Information",
            {
                "fields": (
                    "phone",
                    "date_of_birth",
                    "nationality",
                    "profile_picture",
                ),
            },
        ),
        (
            "Address",
            {
                "fields": (
                    "address_line_1",
                    "address_line_2",
                    "city",
                    "state",
                    "postal_code",
                    "country",
                ),
            },
        ),
        (
            "Employment & Income",
            {
                "fields": (
                    "occupation",
                    "employer",
                    "income_source",
                    "monthly_income",
                    "investment_purpose",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    inlines = (UserProfileInline,)

    list_display = (
        "email",
        "client_id",
        "account_number",
        "first_name",
        "last_name",
        "auth_provider",
        "is_email_verified",
        "mfa_enabled",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = (
        "auth_provider",
        "is_email_verified",
        "mfa_enabled",
        "is_active",
        "is_staff",
        "is_superuser",
        "created_at",
    )
    search_fields = (
        "email",
        "first_name",
        "last_name",
        "client_id",
        "account_number",
    )
    readonly_fields = (
        "id",
        "client_id",
        "account_number",
        "created_at",
        "updated_at",
        "last_login",
        "date_joined",
    )
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {"fields": ("first_name", "last_name")},
        ),
        (
            "Account Details",
            {
                "fields": (
                    "id",
                    "client_id",
                    "account_number",
                    "auth_provider",
                ),
            },
        ),
        (
            "Verification & Security",
            {
                "fields": (
                    "is_email_verified",
                    "mfa_enabled",
                    "mfa_secret",
                ),
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("last_login", "date_joined", "created_at", "updated_at"),
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                    "auth_provider",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone",
        "city",
        "country",
        "occupation",
        "income_source",
        "monthly_income",
        "created_at",
    )
    list_filter = (
        "income_source",
        "country",
    )
    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone",
        "city",
        "country",
        "occupation",
        "employer",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)
