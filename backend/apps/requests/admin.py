from django import forms
from django.contrib import admin

from .models import ClientRequest


class ClientRequestForm(forms.ModelForm):
    class Meta:
        model = ClientRequest
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make details field optional and provide a default JSON value
        if "details" in self.fields:
            self.fields["details"].required = False
            self.fields["details"].initial = {}


@admin.register(ClientRequest)
class ClientRequestAdmin(admin.ModelAdmin):
    form = ClientRequestForm
    list_display = (
        "subject",
        "user",
        "request_type",
        "financing",
        "status",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    )
    list_filter = (
        "request_type",
        "status",
        "created_at",
        "reviewed_at",
    )
    search_fields = (
        "subject",
        "description",
        "admin_response",
        "user__email",
        "user__client_id",
        "financing__application_number",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user", "financing", "reviewed_by")

    fieldsets = (
        (
            "Request",
            {
                "fields": (
                    "id",
                    "user",
                    "financing",
                    "request_type",
                    "status",
                    "subject",
                    "description",
                ),
            },
        ),
        (
            "Request Details",
            {
                "classes": ("collapse",),
                "fields": ("details",),
            },
        ),
        (
            "Admin Review",
            {
                "fields": (
                    "reviewed_by",
                    "reviewed_at",
                    "admin_response",
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
