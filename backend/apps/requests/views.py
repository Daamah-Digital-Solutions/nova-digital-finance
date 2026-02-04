from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
        serializer.save(user=self.request.user)


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
        serializer.save(
            reviewed_by=self.request.user,
            reviewed_at=timezone.now(),
        )
