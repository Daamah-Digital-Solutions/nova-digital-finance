from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.kyc.models import KYCApplication, KYCDocument
from apps.notifications.models import Notification
from common.pagination import StandardPagination
from common.permissions import IsAdminUser

from .serializers import (
    AdminKYCSerializer,
    KYCApplicationCreateSerializer,
    KYCApplicationSerializer,
    KYCDocumentSerializer,
    KYCSubmitSerializer,
)


# ---------------------------------------------------------------------------
# User-facing views
# ---------------------------------------------------------------------------


class KYCApplicationView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/kyc/ - Retrieve the current user's KYC application (auto-created if absent).
    PATCH /api/v1/kyc/ - Update the current user's KYC application while still in draft.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return KYCApplicationCreateSerializer
        return KYCApplicationSerializer

    def get_object(self):
        kyc_application, _created = KYCApplication.objects.get_or_create(
            user=self.request.user,
        )
        return kyc_application


class KYCSubmitView(APIView):
    """
    POST /api/v1/kyc/submit/ - Submit the current user's KYC application.

    Transitions status from 'draft' to 'submitted' and creates an in-app
    notification for the user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            kyc_application = KYCApplication.objects.get(user=request.user)
        except KYCApplication.DoesNotExist:
            return Response(
                {"error": "KYC application not found. Please create one first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = KYCSubmitSerializer(
            data=request.data,
            context={"kyc_application": kyc_application},
        )
        serializer.is_valid(raise_exception=True)

        kyc_application.status = KYCApplication.Status.SUBMITTED
        kyc_application.submitted_at = timezone.now()
        kyc_application.save(update_fields=["status", "submitted_at", "updated_at"])

        Notification.objects.create(
            user=request.user,
            title="KYC Submitted",
            message="Your KYC application has been submitted and is pending review.",
            category=Notification.Category.KYC,
            channel=Notification.Channel.BOTH,
            action_url="/kyc",
        )

        return Response(
            KYCApplicationSerializer(kyc_application).data,
            status=status.HTTP_200_OK,
        )


class KYCDocumentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/kyc/documents/ - List all documents for the current user's KYC.
    POST /api/v1/kyc/documents/ - Upload a new document to the current user's KYC.
    """

    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return KYCDocument.objects.filter(kyc_application__user=self.request.user)

    def perform_create(self, serializer):
        kyc_application, _created = KYCApplication.objects.get_or_create(
            user=self.request.user,
        )
        uploaded_file = self.request.FILES.get("file")
        serializer.save(
            kyc_application=kyc_application,
            file_name=uploaded_file.name if uploaded_file else "",
            file_size=uploaded_file.size if uploaded_file else 0,
        )


class KYCDocumentDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/v1/kyc/documents/<id>/ - Delete a document from the current user's KYC.

    Only allowed while the KYC application is in draft status.
    """

    serializer_class = KYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KYCDocument.objects.filter(kyc_application__user=self.request.user)

    def perform_destroy(self, instance):
        if instance.kyc_application.status != KYCApplication.Status.DRAFT:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Documents cannot be deleted after the KYC application has been submitted."
            )
        instance.file.delete(save=False)
        instance.delete()


# ---------------------------------------------------------------------------
# Admin views
# ---------------------------------------------------------------------------


class AdminKYCListView(generics.ListAPIView):
    """
    GET /api/v1/admin/kyc/ - List all KYC applications with filtering by status.
    """

    serializer_class = AdminKYCSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filterset_fields = ["status"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "user__client_id"]

    def get_queryset(self):
        return (
            KYCApplication.objects.select_related("user", "user__profile", "reviewed_by")
            .prefetch_related("documents")
            .all()
        )


class AdminKYCDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/admin/kyc/<id>/ - Retrieve a specific KYC application.
    PATCH /api/v1/admin/kyc/<id>/ - Review / approve / reject a KYC application.

    When the admin changes the status to 'approved' or 'rejected', the
    reviewed_by and reviewed_at fields are automatically set and a
    notification is sent to the applicant.
    """

    serializer_class = AdminKYCSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            KYCApplication.objects.select_related("user", "user__profile", "reviewed_by")
            .prefetch_related("documents")
            .all()
        )

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get("status")
        instance = serializer.save()

        if new_status in (KYCApplication.Status.APPROVED, KYCApplication.Status.REJECTED):
            instance.reviewed_by = self.request.user
            instance.reviewed_at = timezone.now()
            instance.save(update_fields=["reviewed_by", "reviewed_at", "updated_at"])

            if new_status == KYCApplication.Status.APPROVED:
                title = "KYC Approved"
                message = "Your KYC application has been approved. You can now access all services."
            else:
                reason = instance.rejection_reason or "No reason provided."
                title = "KYC Rejected"
                message = f"Your KYC application has been rejected. Reason: {reason}"

            Notification.objects.create(
                user=instance.user,
                title=title,
                message=message,
                category=Notification.Category.KYC,
                channel=Notification.Channel.BOTH,
                action_url="/kyc",
            )
