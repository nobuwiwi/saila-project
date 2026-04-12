from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Workspace
from .serializers import WorkspaceSerializer


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        # 自分のワークスペースのみ返す（他ユーザーのリソースは404）
        return Workspace.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        # 最初のワークスペースは自動的にデフォルトにする
        is_first = not Workspace.objects.filter(owner=user).exists()
        serializer.save(owner=user, is_default=is_first)

    @action(detail=True, methods=['post'], url_path='set_default')
    def set_default(self, request, pk=None):
        workspace = self.get_object()

        with transaction.atomic():
            # 既存のデフォルトを解除
            Workspace.objects.filter(owner=request.user, is_default=True).update(is_default=False)
            workspace.is_default = True
            workspace.save(update_fields=['is_default'])

        return Response(WorkspaceSerializer(workspace).data)
