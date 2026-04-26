from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.workspaces.models import Workspace
from .models import BusinessCard
from .serializers import BusinessCardListSerializer, BusinessCardDetailSerializer


class BusinessCardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ('retrieve', 'update', 'partial_update', 'create'):
            return BusinessCardDetailSerializer
        return BusinessCardListSerializer

    def get_queryset(self):
        """
        未削除のレコードのみ。
        ?workspace={id} で絞り込み（一覧は必須パラメータ）。
        """
        qs = BusinessCard.objects.filter(owner=self.request.user)

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user

        # 追加可能かチェック（can_add_card() が False なら 403）
        if not user.can_add_card():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                detail='名刺の登録上限に達しています。Proプランへのアップグレードをご検討ください。'
            )

        # workspace の owner 確認（他ユーザーのワークスペースには作成させない → 404）
        workspace_id = serializer.validated_data['workspace'].id
        workspace = Workspace.objects.filter(id=workspace_id, owner=user).first()
        if workspace is None:
            from rest_framework.exceptions import NotFound
            raise NotFound()

        image_obj = self.request.data.get('image')
        thumbnail_content = None
        thumb_filename = None
        main_image_content = None
        main_filename = None
        
        if image_obj:
            try:
                from PIL import Image, ImageOps
                from io import BytesIO
                from django.core.files.base import ContentFile

                img = Image.open(image_obj)
                img = ImageOps.exif_transpose(img)
                # Convert to RGB (in case of PNG with transparency / HEIC)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                try:
                    name_base = image_obj.name.rsplit('.', 1)[0]
                except AttributeError:
                    name_base = 'uploaded'
                    
                # Save transposed main image
                main_io = BytesIO()
                img.save(main_io, format='JPEG', quality=85)
                main_filename = f"{name_base}.jpg"
                main_image_content = ContentFile(main_io.getvalue(), name=main_filename)
                
                # Save thumbnail
                img.thumbnail((200, 120), Image.Resampling.LANCZOS)
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)
                thumb_filename = f"thumb_{name_base}.jpg"
                thumbnail_content = ContentFile(thumb_io.getvalue(), name=thumb_filename)
            except Exception as e:
                pass

        save_kwargs = {
            'owner': user,
            'workspace': workspace,
            'analysis_status': 'pending'
        }
        
        axis_id = self.request.data.get('axis')
        if axis_id:
            from apps.axes.models import UserBusinessAxis
            axis = UserBusinessAxis.objects.filter(id=axis_id, owner=user).first()
            if axis:
                save_kwargs['axis'] = axis

        if main_image_content and main_filename:
            save_kwargs['image'] = main_image_content

        card = serializer.save(**save_kwargs)
        if thumbnail_content and thumb_filename:
            card.thumbnail.save(thumb_filename, thumbnail_content, save=True)

        # Trigger AI analysis asynchronously
        from .tasks import analyze_card
        analyze_card.delay(card.id)


    def destroy(self, request, *args, **kwargs):
        """論理削除（deleted_at をセット）"""
        card = self.get_object()
        card.delete()  # SoftDeleteModel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---------- カスタムアクション ----------

    @action(detail=False, methods=['get'], url_path='trash')
    def trash(self, request):
        """ゴミ箱一覧（論理削除済みの自分の名刺）"""
        qs = BusinessCard.trashed_objects.filter(owner=request.user)
        serializer = BusinessCardListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """ゴミ箱から復元（deleted_at を null に戻す）"""
        # ゴミ箱の中から自分のものを取得
        card = BusinessCard.trashed_objects.filter(
            pk=pk, owner=request.user
        ).first()
        if card is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        card.restore()  # SoftDeleteModel.restore()
        serializer = BusinessCardDetailSerializer(card, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='hard_delete')
    def hard_delete(self, request, pk=None):
        """完全削除（ゴミ箱から物理削除）"""
        card = BusinessCard.trashed_objects.filter(
            pk=pk, owner=request.user
        ).first()
        if card is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        card.hard_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='analyze')
    def analyze(self, request, pk=None):
        """AI解析トリガー（analysis_status を processing に変更）"""
        card = self.get_object()
        card.analysis_status = 'processing'
        card.save(update_fields=['analysis_status', 'updated_at'])

        from .tasks import analyze_card
        analyze_card.delay(card.id)

        serializer = BusinessCardDetailSerializer(card, context={'request': request})
        return Response(serializer.data)
