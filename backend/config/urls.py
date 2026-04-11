from django.contrib import admin
from django.urls import path
from django.http import JsonResponse, HttpResponse

def health_check(request):
    return JsonResponse({"status": "ok"})

def home(request):
    return HttpResponse("Hello, Saila!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('', home),
]
