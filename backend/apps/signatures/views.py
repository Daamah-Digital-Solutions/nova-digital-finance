import base64
import io

from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Signature, SignatureRequest
from .serializers import SignatureCreateSerializer, SignatureRequestSerializer


class PendingSignatureListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignatureRequestSerializer

    def get_queryset(self):
        return SignatureRequest.objects.filter(
            user=self.request.user,
            status=SignatureRequest.Status.PENDING,
            expires_at__gt=timezone.now(),
        ).select_related("document")


class SignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            sig_request = SignatureRequest.objects.get(
                pk=pk,
                user=request.user,
                status=SignatureRequest.Status.PENDING,
            )
        except SignatureRequest.DoesNotExist:
            return Response(
                {"error": "Signature request not found or already signed."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if sig_request.expires_at < timezone.now():
            sig_request.status = SignatureRequest.Status.EXPIRED
            sig_request.save(update_fields=["status"])
            return Response(
                {"error": "Signature request has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SignatureCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Decode base64 signature image
        sig_data = serializer.validated_data["signature_image"]
        if "base64," in sig_data:
            sig_data = sig_data.split("base64,")[1]

        image_data = base64.b64decode(sig_data)
        image_file = ContentFile(image_data, name=f"signature_{pk}.png")

        # Get IP and user agent
        ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        if not ip:
            ip = request.META.get("REMOTE_ADDR", "0.0.0.0")

        Signature.objects.create(
            signature_request=sig_request,
            signature_image=image_file,
            signature_data=serializer.validated_data.get("signature_data", {}),
            consent_text=serializer.validated_data["consent_text"],
            ip_address=ip,
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        sig_request.status = SignatureRequest.Status.SIGNED
        sig_request.signed_at = timezone.now()
        sig_request.save(update_fields=["status", "signed_at"])

        # Mark document as signed
        sig_request.document.is_signed = True
        sig_request.document.save(update_fields=["is_signed"])

        # Update financing status if applicable
        if sig_request.document.financing:
            financing = sig_request.document.financing
            from apps.financing.models import FinancingApplication
            if financing.status == FinancingApplication.Status.PENDING_SIGNATURE:
                financing.status = FinancingApplication.Status.SIGNED
                financing.save(update_fields=["status", "updated_at"])

        return Response(
            SignatureRequestSerializer(sig_request).data,
            status=status.HTTP_200_OK,
        )
