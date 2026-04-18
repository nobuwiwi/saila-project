from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessCardViewSet

router = DefaultRouter()
router.register(r'', BusinessCardViewSet, basename='card')

urlpatterns = [
    path('', include(router.urls)),
]
