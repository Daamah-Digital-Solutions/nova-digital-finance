from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "category",
        "channel",
        "is_read",
        "read_at",
        "created_at",
    )
    list_filter = (
        "category",
        "channel",
        "is_read",
        "created_at",
    )
    search_fields = (
        "title",
        "message",
        "user__email",
        "user__client_id",
        "action_url",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user",)

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "user",
                    "title",
                    "message",
                ),
            },
        ),
        (
            "Delivery",
            {
                "fields": (
                    "channel",
                    "category",
                    "action_url",
                ),
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_read",
                    "read_at",
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
