from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import IntegrityError

from .models import UserBusinessAxis
from .serializers import UserBusinessAxisSerializer

class UserBusinessAxisViewSet(viewsets.ModelViewSet):
    serializer_class = UserBusinessAxisSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return UserBusinessAxis.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(owner=self.request.user)
        except IntegrityError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'axis': 'この事業軸はすでに登録されています。'})

class AxisChoicesView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        choices = [
            {"value": key, "label": label}
            for key, label in UserBusinessAxis.BUSINESS_AXIS_CHOICES
        ]
        return Response(choices)
