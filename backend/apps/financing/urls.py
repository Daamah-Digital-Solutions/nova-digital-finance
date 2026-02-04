from django.urls import path

from . import views

urlpatterns = [
    path("", views.FinancingListCreateView.as_view(), name="financing-list"),
    path("<uuid:pk>/", views.FinancingDetailView.as_view(), name="financing-detail"),
    path("<uuid:pk>/submit/", views.FinancingSubmitView.as_view(), name="financing-submit"),
    path("<uuid:pk>/installments/", views.InstallmentListView.as_view(), name="financing-installments"),
    path("<uuid:pk>/statement/", views.FinancingStatementView.as_view(), name="financing-statement"),
    path("calculator/", views.FinancingCalculatorView.as_view(), name="financing-calculator"),
]
