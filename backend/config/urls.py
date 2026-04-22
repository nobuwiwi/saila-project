from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from rest_framework_simplejwt.views import TokenRefreshView

def health_check(request):
    return JsonResponse({"status": "ok"})

def home(request):
    return HttpResponse("Hello, Saila!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/workspaces/', include('apps.workspaces.urls')),
    path('api/cards/', include('apps.cards.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/axes/', include('apps.axes.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', home),
]
