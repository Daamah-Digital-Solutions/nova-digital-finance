from django.db import models

from common.models import TimeStampedModel


class Page(TimeStampedModel):
    slug = models.SlugField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    meta_description = models.CharField(max_length=160, blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class FAQ(TimeStampedModel):
    class Category(models.TextChoices):
        GENERAL = "general", "General"
        FINANCING = "financing", "Financing"
        PAYMENTS = "payments", "Payments"
        KYC = "kyc", "KYC"
        SECURITY = "security", "Security"
        CAPIMAX = "capimax", "CapiMax"

    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "order"]
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return self.question
