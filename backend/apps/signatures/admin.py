from django.contrib import admin

from .models import Signature, SignatureRequest


class SignatureInline(admin.StackedInline):
    model = Signature
    can_delete = False
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")
    fields = (
        "signature_image",
        "signature_data",
        "consent_text",
        "ip_address",
        "user_agent",
        "created_at",
    )


@admin.register(SignatureRequest)
class SignatureRequestAdmin(admin.ModelAdmin):
    inlines = (SignatureInline,)

    list_display = (
        "document",
        "user",
        "status",
        "expires_at",
        "signed_at",
        "created_at",
    )
    list_filter = (
        "status",
        "created_at",
        "expires_at",
    )
    search_fields = (
        "user__email",
        "user__client_id",
        "document__title",
        "document__document_number",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user", "document")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "document",
                    "user",
                    "status",
                ),
            },
        ),
        (
            "Timing",
            {
                "fields": (
                    "expires_at",
                    "signed_at",
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


@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = (
        "signature_request",
        "ip_address",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = (
        "signature_request__user__email",
        "signature_request__document__title",
        "ip_address",
        "consent_text",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("signature_request",)

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "signature_request",
                    "signature_image",
                ),
            },
        ),
        (
            "Signature Data",
            {
                "fields": (
                    "signature_data",
                    "consent_text",
                ),
            },
        ),
        (
            "Client Info",
            {
                "fields": (
                    "ip_address",
                    "user_agent",
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
