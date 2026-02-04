from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "title", "message", "channel", "category",
            "is_read", "read_at", "action_url", "metadata", "created_at",
        ]
        read_only_fields = ["id", "title", "message", "channel", "category", "created_at"]
