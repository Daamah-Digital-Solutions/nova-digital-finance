import base64

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import DocumentSerializer


class DocumentListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer
    filterset_fields = ["document_type", "is_signed"]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)


class DocumentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)


class DocumentDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            document = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response(
                {"error": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not document.file:
            return Response(
                {"error": "File not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        file_content = document.file.read()
        return Response({
            "filename": f"{document.document_number}.pdf",
            "content_type": "application/pdf",
            "data": base64.b64encode(file_content).decode("ascii"),
        })


class DocumentVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        try:
            document = Document.objects.get(verification_code=code)
        except Document.DoesNotExist:
            return Response(
                {"verified": False, "error": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "verified": True,
            "document_number": document.document_number,
            "document_type": document.document_type,
            "title": document.title,
            "issued_to": document.user.get_full_name(),
            "issued_at": document.created_at,
            "is_signed": document.is_signed,
        })
