import base64
import logging

from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import NotificationService
from .models import Signature, SignatureRequest
from .serializers import SignatureCreateSerializer, SignatureRequestSerializer

logger = logging.getLogger(__name__)


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

        # Get IP and user agent
        ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        if not ip:
            ip = request.META.get("REMOTE_ADDR", "0.0.0.0")

        # Handle optional signature image
        image_file = None
        sig_image_data = serializer.validated_data.get("signature_image", "")
        if sig_image_data:
            if "base64," in sig_image_data:
                sig_image_data = sig_image_data.split("base64,")[1]
            try:
                image_data = base64.b64decode(sig_image_data)
                image_file = ContentFile(image_data, name=f"signature_{pk}.png")
            except Exception:
                pass

        signature = Signature.objects.create(
            signature_request=sig_request,
            signature_text=serializer.validated_data["signature_text"],
            signature_image=image_file or "",
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

        # Regenerate the PDF with the typed signature embedded
        try:
            from apps.documents.services import DocumentService
            DocumentService.regenerate_signed_document(sig_request.document)
            logger.info(f"Successfully regenerated document {sig_request.document.id} with signature")
        except Exception as e:
            import traceback
            logger.error(f"Failed to regenerate signed document: {e}\n{traceback.format_exc()}")

        # Send notification and email
        NotificationService.notify_document_signed(signature)

        # Update financing status: only move to fee payment when ALL documents are signed
        if sig_request.document.financing:
            financing = sig_request.document.financing
            from apps.financing.models import FinancingApplication
            if financing.status == FinancingApplication.Status.PENDING_SIGNATURE:
                # Check if there are still pending signature requests for this financing
                from apps.documents.models import Document
                pending_sigs = SignatureRequest.objects.filter(
                    document__financing=financing,
                    status=SignatureRequest.Status.PENDING,
                ).count()
                if pending_sigs == 0:
                    financing.status = FinancingApplication.Status.PENDING_FEE
                    financing.save(update_fields=["status", "updated_at"])

        return Response(
            SignatureRequestSerializer(sig_request).data,
            status=status.HTTP_200_OK,
        )
