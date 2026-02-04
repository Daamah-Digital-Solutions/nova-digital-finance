from django.urls import path

from . import views

urlpatterns = [
    path("pending/", views.PendingSignatureListView.as_view(), name="pending-signatures"),
    path("<uuid:pk>/sign/", views.SignView.as_view(), name="sign"),
]
