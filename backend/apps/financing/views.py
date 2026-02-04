from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminUser, IsOwner

from .models import FinancingApplication, Installment
from .serializers import (
    AdminFinancingSerializer,
    FinancingApplicationCreateSerializer,
    FinancingApplicationSerializer,
    FinancingCalculatorSerializer,
    FinancingSubmitSerializer,
    InstallmentSerializer,
)


class FinancingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FinancingApplicationCreateSerializer
        return FinancingApplicationSerializer

    def get_queryset(self):
        return FinancingApplication.objects.filter(
            user=self.request.user
        ).prefetch_related("installments")


class FinancingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = FinancingApplicationSerializer

    def get_queryset(self):
        return FinancingApplication.objects.filter(
            user=self.request.user
        ).prefetch_related("installments")

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status != FinancingApplication.Status.DRAFT:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Can only update draft applications.")
        serializer.save()


class FinancingSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            financing = FinancingApplication.objects.get(pk=pk, user=request.user)
        except FinancingApplication.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FinancingSubmitSerializer(
            data={}, context={"financing": financing}
        )
        serializer.is_valid(raise_exception=True)

        financing.status = FinancingApplication.Status.PENDING_FEE
        financing.save(update_fields=["status", "updated_at"])

        return Response(
            FinancingApplicationSerializer(financing).data,
            status=status.HTTP_200_OK,
        )


class InstallmentListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InstallmentSerializer

    def get_queryset(self):
        return Installment.objects.filter(
            financing__pk=self.kwargs["pk"],
            financing__user=self.request.user,
        )


class FinancingStatementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            financing = FinancingApplication.objects.get(pk=pk, user=request.user)
        except FinancingApplication.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        installments = financing.installments.all()
        paid = installments.filter(status=Installment.Status.PAID)
        total_paid = sum(i.paid_amount for i in paid)
        total_remaining = sum(i.remaining_amount for i in installments)

        statement = {
            "application_number": financing.application_number,
            "bronova_amount": str(financing.bronova_amount),
            "monthly_installment": str(financing.monthly_installment),
            "total_installments": installments.count(),
            "paid_installments": paid.count(),
            "total_paid": str(total_paid),
            "total_remaining": str(total_remaining),
            "next_due": None,
            "installments": InstallmentSerializer(installments, many=True).data,
        }

        next_due = installments.filter(
            status__in=[Installment.Status.DUE, Installment.Status.UPCOMING]
        ).first()
        if next_due:
            statement["next_due"] = {
                "installment_number": next_due.installment_number,
                "due_date": str(next_due.due_date),
                "amount": str(next_due.amount),
            }

        return Response(statement)


class FinancingCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = FinancingCalculatorSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        period = serializer.validated_data["period"]
        fee_pct = serializer.validated_data.get(
            "fee_percentage", settings.FINANCING_DEFAULT_FEE_PERCENTAGE
        )

        from apps.financing.services import FinancingService
        result = FinancingService.calculate(amount, period, fee_pct)
        return Response(result)


# Admin views
class AdminFinancingListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminFinancingSerializer
    filterset_fields = ["status", "user"]
    search_fields = ["application_number", "user__email", "user__client_id"]
    ordering_fields = ["created_at", "bronova_amount", "status"]

    def get_queryset(self):
        return FinancingApplication.objects.select_related("user").prefetch_related(
            "installments"
        )


class AdminFinancingDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminFinancingSerializer
    queryset = FinancingApplication.objects.select_related("user").prefetch_related(
        "installments"
    )


class AdminFinancingApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        from apps.financing.services import FinancingService

        try:
            financing = FinancingApplication.objects.get(pk=pk)
        except FinancingApplication.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            financing = FinancingService.approve_application(financing, request.user)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AdminFinancingSerializer(financing).data)


class AdminFinancingRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reason = request.data.get("reason", "")
        try:
            financing = FinancingApplication.objects.get(pk=pk)
        except FinancingApplication.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if financing.status not in [
            FinancingApplication.Status.SIGNED,
            FinancingApplication.Status.UNDER_REVIEW,
        ]:
            return Response(
                {"error": "Application cannot be rejected in current status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        financing.status = FinancingApplication.Status.REJECTED
        financing.rejection_reason = reason
        financing.save(update_fields=["status", "rejection_reason", "updated_at"])

        return Response(AdminFinancingSerializer(financing).data)
