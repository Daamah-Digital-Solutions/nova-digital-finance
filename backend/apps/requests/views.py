from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import NotificationService
from common.permissions import IsAdminUser

from .models import ClientRequest
from .serializers import AdminClientRequestSerializer, ClientRequestSerializer


class ClientRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientRequestSerializer
    filterset_fields = ["request_type", "status"]

    def get_queryset(self):
        return ClientRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        client_request = serializer.save(user=self.request.user)
        # Send notification and email
        NotificationService.notify_request_received(client_request)


class ClientRequestDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientRequestSerializer

    def get_queryset(self):
        return ClientRequest.objects.filter(user=self.request.user)


# Admin views
class AdminRequestListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminClientRequestSerializer
    filterset_fields = ["request_type", "status", "user"]
    search_fields = ["subject", "user__email", "user__client_id"]

    def get_queryset(self):
        return ClientRequest.objects.select_related("user")


class AdminRequestDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminClientRequestSerializer
    queryset = ClientRequest.objects.select_related("user")

    def perform_update(self, serializer):
        # Check if admin_response is being added/updated
        old_response = self.get_object().admin_response
        new_response = serializer.validated_data.get("admin_response", "")

        client_request = serializer.save(
            reviewed_by=self.request.user,
            reviewed_at=timezone.now(),
        )

        # Send notification if admin added a new response
        if new_response and new_response != old_response:
            NotificationService.notify_request_responded(client_request)
