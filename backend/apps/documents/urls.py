from django.urls import path

from . import views

urlpatterns = [
    path("", views.DocumentListView.as_view(), name="document-list"),
    path("<uuid:pk>/", views.DocumentDetailView.as_view(), name="document-detail"),
    path("<uuid:pk>/download/", views.DocumentDownloadView.as_view(), name="document-download"),
    path("verify/<str:code>/", views.DocumentVerifyView.as_view(), name="document-verify"),
]
