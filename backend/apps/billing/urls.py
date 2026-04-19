from django.urls import path
from .views import CreateCheckoutSessionView, StripeWebhookView, CreateCustomerPortalSessionView

urlpatterns = [
    path('checkout/', CreateCheckoutSessionView.as_view(), name='checkout'),
    path('portal/', CreateCustomerPortalSessionView.as_view(), name='portal'),
    path('webhook/', StripeWebhookView.as_view(), name='webhook'),
]
