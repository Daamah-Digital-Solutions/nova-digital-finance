from django.contrib import admin

from .models import KYCApplication, KYCDocument


class KYCDocumentInline(admin.TabularInline):
    model = KYCDocument
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")
    fields = (
        "document_type",
        "file",
        "file_name",
        "file_size",
        "is_verified",
        "notes",
        "created_at",
    )


@admin.register(KYCApplication)
class KYCApplicationAdmin(admin.ModelAdmin):
    inlines = (KYCDocumentInline,)

    list_display = (
        "user",
        "status",
        "reviewed_by",
        "submitted_at",
        "reviewed_at",
        "created_at",
    )
    list_filter = (
        "status",
        "created_at",
        "submitted_at",
        "reviewed_at",
    )
    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "user__client_id",
    )
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("user", "reviewed_by")

    fieldsets = (
        (
            None,
            {
                "fields": ("id", "user", "status"),
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "reviewed_by",
                    "reviewed_at",
                    "rejection_reason",
                ),
            },
        ),
        (
            "Documents",
            {
                "fields": ("pdf_summary", "submitted_at"),
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


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "file_name",
        "document_type",
        "kyc_application",
        "is_verified",
        "file_size",
        "created_at",
    )
    list_filter = (
        "document_type",
        "is_verified",
        "created_at",
    )
    search_fields = (
        "file_name",
        "kyc_application__user__email",
        "notes",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("kyc_application",)
