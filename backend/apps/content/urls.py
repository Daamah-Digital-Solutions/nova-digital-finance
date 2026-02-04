from django.urls import path

from . import views

urlpatterns = [
    path("pages/<slug:slug>/", views.PageDetailView.as_view(), name="page-detail"),
    path("faq/", views.FAQListView.as_view(), name="faq-list"),
]
