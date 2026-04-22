from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserBusinessAxisViewSet, AxisChoicesView

router = DefaultRouter()
router.register(r'', UserBusinessAxisViewSet, basename='axis')

urlpatterns = [
    path('choices/', AxisChoicesView.as_view(), name='axis-choices'),
    path('', include(router.urls)),
]
