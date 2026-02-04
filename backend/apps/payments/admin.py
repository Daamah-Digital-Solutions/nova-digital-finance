from django.contrib import admin

from .models import Payment, ScheduledPayment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_reference",
        "user",
        "payment_type",
        "payment_method",
        "amount",
        "currency",
        "status",
        "created_at",
    )
    list_filter = (
        "payment_type",
        "payment_method",
        "status",
        "currency",
        "created_at",
    )
    search_fields = (
        "transaction_reference",
        "user__email",
        "user__client_id",
        "stripe_session_id",
        "stripe_payment_intent_id",
        "nowpayments_payment_id",
        "nowpayments_order_id",
        "description",
    )
    readonly_fields = (
        "id",
        "transaction_reference",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("user", "financing", "installment")

    fieldsets = (
        (
            "Payment Info",
            {
                "fields": (
                    "id",
                    "transaction_reference",
                    "user",
                    "financing",
                    "installment",
                    "payment_type",
                    "payment_method",
                    "status",
                ),
            },
        ),
        (
            "Amount",
            {
                "fields": (
                    "amount",
                    "currency",
                    "description",
                ),
            },
        ),
        (
            "Stripe Details",
            {
                "classes": ("collapse",),
                "fields": (
                    "stripe_session_id",
                    "stripe_payment_intent_id",
                ),
            },
        ),
        (
            "Crypto Details",
            {
                "classes": ("collapse",),
                "fields": (
                    "nowpayments_payment_id",
                    "nowpayments_order_id",
                    "crypto_address",
                    "crypto_amount",
                    "crypto_currency",
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


@admin.register(ScheduledPayment)
class ScheduledPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "installment",
        "scheduled_date",
        "payment_method",
        "is_processed",
        "processed_at",
        "created_at",
    )
    list_filter = (
        "payment_method",
        "is_processed",
        "scheduled_date",
        "created_at",
    )
    search_fields = (
        "user__email",
        "user__client_id",
        "installment__financing__application_number",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user", "installment", "payment")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "user",
                    "installment",
                    "scheduled_date",
                    "payment_method",
                ),
            },
        ),
        (
            "Processing",
            {
                "fields": (
                    "is_processed",
                    "processed_at",
                    "payment",
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
