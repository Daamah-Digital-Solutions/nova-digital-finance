from django.contrib import admin

from .models import FinancingApplication, Installment


class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")
    fields = (
        "installment_number",
        "due_date",
        "amount",
        "paid_amount",
        "status",
        "paid_at",
        "deferred_to",
        "created_at",
    )
    ordering = ("installment_number",)


@admin.register(FinancingApplication)
class FinancingApplicationAdmin(admin.ModelAdmin):
    inlines = (InstallmentInline,)

    list_display = (
        "application_number",
        "user",
        "bronova_amount",
        "usd_equivalent",
        "fee_amount",
        "repayment_period_months",
        "monthly_installment",
        "status",
        "created_at",
    )
    list_filter = (
        "status",
        "repayment_period_months",
        "fee_percentage",
        "created_at",
        "approved_at",
    )
    search_fields = (
        "application_number",
        "user__email",
        "user__first_name",
        "user__last_name",
        "user__client_id",
    )
    readonly_fields = (
        "id",
        "application_number",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("user", "approved_by")

    fieldsets = (
        (
            "Application",
            {
                "fields": (
                    "id",
                    "application_number",
                    "user",
                    "status",
                ),
            },
        ),
        (
            "Financial Details",
            {
                "fields": (
                    "bronova_amount",
                    "usd_equivalent",
                    "fee_percentage",
                    "fee_amount",
                    "repayment_period_months",
                    "monthly_installment",
                ),
            },
        ),
        (
            "Acknowledgments",
            {
                "fields": (
                    "ack_terms",
                    "ack_fee_non_refundable",
                    "ack_repayment_schedule",
                    "ack_risk_disclosure",
                ),
            },
        ),
        (
            "Admin Review",
            {
                "fields": (
                    "approved_by",
                    "approved_at",
                    "rejection_reason",
                    "notes",
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


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = (
        "financing",
        "installment_number",
        "due_date",
        "amount",
        "paid_amount",
        "status",
        "paid_at",
    )
    list_filter = (
        "status",
        "due_date",
    )
    search_fields = (
        "financing__application_number",
        "financing__user__email",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("financing",)

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "financing",
                    "installment_number",
                ),
            },
        ),
        (
            "Payment Details",
            {
                "fields": (
                    "due_date",
                    "amount",
                    "paid_amount",
                    "status",
                    "paid_at",
                    "deferred_to",
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
