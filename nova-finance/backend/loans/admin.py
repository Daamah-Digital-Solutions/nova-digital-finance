from django.contrib import admin
from .models import LoanApplication, Loan, Payment, LoanRequest

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'currency', 'status')
    list_filter = ('status', 'currency')
    search_fields = ('user__email', 'user__username')

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('loan_number', 'currency', 'status')
    list_filter = ('status', 'currency')
    search_fields = ('loan_number',)

@admin.register(Payment)
class LoanPaymentAdmin(admin.ModelAdmin):
    list_display = ('loan',)
    search_fields = ('loan__loan_number',)

@admin.register(LoanRequest)
class LoanRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'status')
    list_filter = ('status',)
    search_fields = ('user__email', 'user__username')
