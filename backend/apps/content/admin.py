from django.contrib import admin

from .models import FAQ, Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "slug",
        "is_published",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "is_published",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "title",
        "slug",
        "content",
        "meta_description",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "title",
                    "slug",
                    "is_published",
                ),
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "content",
                    "meta_description",
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


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = (
        "question",
        "category",
        "order",
        "is_published",
        "created_at",
    )
    list_filter = (
        "category",
        "is_published",
        "created_at",
    )
    search_fields = (
        "question",
        "answer",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    list_editable = ("order", "is_published")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "question",
                    "answer",
                ),
            },
        ),
        (
            "Organization",
            {
                "fields": (
                    "category",
                    "order",
                    "is_published",
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
