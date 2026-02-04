from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "document_number",
        "title",
        "document_type",
        "user",
        "financing",
        "is_signed",
        "created_at",
    )
    list_filter = (
        "document_type",
        "is_signed",
        "created_at",
    )
    search_fields = (
        "document_number",
        "title",
        "user__email",
        "user__client_id",
        "verification_code",
        "financing__application_number",
    )
    readonly_fields = (
        "id",
        "document_number",
        "verification_code",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("user", "financing")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "document_number",
                    "title",
                    "document_type",
                    "user",
                    "financing",
                ),
            },
        ),
        (
            "File",
            {
                "fields": (
                    "file",
                    "is_signed",
                    "verification_code",
                ),
            },
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("metadata",),
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
