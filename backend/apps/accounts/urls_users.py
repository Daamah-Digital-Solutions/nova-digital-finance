from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.UserMeView.as_view(), name="user-me"),
]
