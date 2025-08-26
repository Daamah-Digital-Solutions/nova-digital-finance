from django.contrib import admin
from .models import PaymentMethod, PaymentIntent, PaymentTransaction, RefundRequest

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_default')
    search_fields = ('user__email', 'user__username')

@admin.register(PaymentIntent)
class PaymentIntentAdmin(admin.ModelAdmin):
    list_display = ('user', 'status')
    list_filter = ('status',)
    search_fields = ('user__email',)

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'status')
    list_filter = ('status',)
    search_fields = ('user__email',)

@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'status')
    list_filter = ('status',)
    search_fields = ('user__email',)
