from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id", "document_type", "document_number", "title",
            "file", "verification_code", "is_signed", "metadata",
            "created_at", "download_url",
        ]
        read_only_fields = [
            "id", "document_number", "verification_code",
            "is_signed", "created_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=64)
