from django.db import models
from decimal import Decimal
import uuid

class Currency(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    symbol = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    logo_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    whitepaper_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Currencies"

    def __str__(self):
        return f"{self.name} ({self.symbol})"

class ExchangeRate(models.Model):
    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='exchange_rates')
    usd_rate = models.DecimalField(max_digits=18, decimal_places=8)
    high_24h = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    low_24h = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    change_24h_percent = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    volume_24h = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=50, default='manual')
    is_active = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        unique_together = ['currency', 'timestamp']

    def __str__(self):
        return f"{self.currency.symbol}/USD: {self.usd_rate}"

class PriceHistory(models.Model):
    TIMEFRAME_CHOICES = [
        ('1m', '1 Minute'),
        ('5m', '5 Minutes'),
        ('15m', '15 Minutes'),
        ('30m', '30 Minutes'),
        ('1h', '1 Hour'),
        ('4h', '4 Hours'),
        ('1d', '1 Day'),
        ('1w', '1 Week'),
        ('1M', '1 Month'),
    ]

    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='price_history')
    timeframe = models.CharField(max_length=3, choices=TIMEFRAME_CHOICES)
    open_price = models.DecimalField(max_digits=18, decimal_places=8)
    high_price = models.DecimalField(max_digits=18, decimal_places=8)
    low_price = models.DecimalField(max_digits=18, decimal_places=8)
    close_price = models.DecimalField(max_digits=18, decimal_places=8)
    volume = models.DecimalField(max_digits=20, decimal_places=2)
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ['-timestamp']
        unique_together = ['currency', 'timeframe', 'timestamp']
