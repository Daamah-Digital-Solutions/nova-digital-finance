from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminUser

from .models import Payment, ScheduledPayment
from .serializers import (
    AdminPaymentSerializer,
    CryptoPaymentCreateSerializer,
    PaymentSerializer,
    ScheduledPaymentCreateSerializer,
    ScheduledPaymentSerializer,
    StripeCheckoutSerializer,
)


class StripeCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StripeCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.payments.services import StripeService

        try:
            result = StripeService.create_checkout_session(
                user=request.user,
                **serializer.validated_data,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class CryptoPaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CryptoPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.payments.services import NowPaymentsService

        try:
            result = NowPaymentsService.create_payment(
                user=request.user,
                **serializer.validated_data,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class PaymentListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer
    filterset_fields = ["payment_type", "payment_method", "status"]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class PaymentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class PaymentReceiptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk, user=request.user)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status != Payment.Status.COMPLETED:
            return Response(
                {"error": "Receipt only available for completed payments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.documents.models import Document
        receipt = Document.objects.filter(
            user=request.user,
            document_type=Document.DocumentType.RECEIPT,
            metadata__payment_id=str(payment.id),
        ).first()

        if receipt:
            from apps.documents.serializers import DocumentSerializer
            return Response(DocumentSerializer(receipt).data)

        # Generate receipt
        from apps.payments.services import PaymentService
        receipt = PaymentService.generate_receipt(payment)
        from apps.documents.serializers import DocumentSerializer
        return Response(DocumentSerializer(receipt).data)


class ScheduledPaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ScheduledPaymentCreateSerializer
        return ScheduledPaymentSerializer

    def get_queryset(self):
        return ScheduledPayment.objects.filter(
            user=self.request.user, is_processed=False
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ScheduledPaymentDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ScheduledPayment.objects.filter(
            user=self.request.user, is_processed=False
        )


# Admin views
class AdminPaymentListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminPaymentSerializer
    filterset_fields = ["payment_type", "payment_method", "status", "user"]
    search_fields = ["transaction_reference", "user__email", "user__client_id"]
    ordering_fields = ["created_at", "amount"]

    def get_queryset(self):
        return Payment.objects.select_related("user")
