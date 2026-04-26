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

        if not user.can_add_workspace():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                detail='ワークスペースの作成上限に達しています。Proプランへのアップグレードをご検討ください。'
            )

        # 最初のワークスペースは自動的にデフォルトにする
        is_first = not Workspace.objects.filter(owner=user).exists()
        
        axis_ids = serializer.validated_data.pop('axis_ids', [])
        workspace = serializer.save(owner=user, is_default=is_first)
        
        if axis_ids:
            from apps.axes.models import UserBusinessAxis
            axes = UserBusinessAxis.objects.filter(id__in=axis_ids, owner=user)
            workspace.axes.set(axes)

    def perform_update(self, serializer):
        axis_ids = serializer.validated_data.pop('axis_ids', None)
        workspace = serializer.save()
        
        if axis_ids is not None:
            from apps.axes.models import UserBusinessAxis
            axes = UserBusinessAxis.objects.filter(id__in=axis_ids, owner=self.request.user)
            workspace.axes.set(axes)

    @action(detail=True, methods=['post'], url_path='set_default')
    def set_default(self, request, pk=None):
        workspace = self.get_object()

        with transaction.atomic():
            # 既存のデフォルトを解除
            Workspace.objects.filter(owner=request.user, is_default=True).update(is_default=False)
            workspace.is_default = True
            workspace.save(update_fields=['is_default'])

        return Response(WorkspaceSerializer(workspace).data)
