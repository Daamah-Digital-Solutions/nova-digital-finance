from rest_framework import generics, permissions

from common.permissions import IsAdminUser

from .models import FAQ, Page
from .serializers import FAQSerializer, PageSerializer


class PageDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PageSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Page.objects.filter(is_published=True)


class FAQListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = FAQSerializer
    filterset_fields = ["category"]

    def get_queryset(self):
        return FAQ.objects.filter(is_published=True)


# Admin views
class AdminPageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PageSerializer
    queryset = Page.objects.all()


class AdminPageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PageSerializer
    queryset = Page.objects.all()


class AdminFAQListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = FAQSerializer
    queryset = FAQ.objects.all()


class AdminFAQDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = FAQSerializer
    queryset = FAQ.objects.all()
