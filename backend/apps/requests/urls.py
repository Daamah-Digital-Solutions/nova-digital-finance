from django.urls import path

from . import views

urlpatterns = [
    path("", views.ClientRequestListCreateView.as_view(), name="request-list"),
    path("<uuid:pk>/", views.ClientRequestDetailView.as_view(), name="request-detail"),
]
