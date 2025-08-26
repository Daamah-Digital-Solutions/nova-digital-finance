from django.contrib import admin
from .models import Currency, ExchangeRate

@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('symbol', 'name')
    ordering = ('symbol',)

@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('currency',)
    search_fields = ('currency__symbol', 'currency__name')
