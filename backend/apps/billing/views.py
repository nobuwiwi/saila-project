import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import logging

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            origin = request.headers.get('origin', 'https://your-frontend.railway.app')
            success_url = f"{origin}/billing/success"
            cancel_url = f"{origin}/cards"

            checkout_session = stripe.checkout.Session.create(
                customer_email=request.user.email,
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'jpy',
                            'product_data': {
                                'name': 'Proプラン（月額）',
                            },
                            'unit_amount': 480,
                            'recurring': {
                                'interval': 'month',
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(request.user.id)
            )
            return Response({'url': checkout_session.url})
        except Exception as e:
            logger.error(f"Stripe Checkout Error: {str(e)}")
            return Response({'error': str(e)}, status=500)

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.warning("Invalid payload for Stripe webhook")
            return Response(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.warning("Invalid signature for Stripe webhook")
            return Response(status=400)

        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            client_reference_id = session.get('client_reference_id')
            customer_id = session.get('customer')
            
            if client_reference_id:
                from apps.accounts.models import User
                from django.utils import timezone
                user = User.objects.filter(id=client_reference_id).first()
                if user:
                    user.is_pro = True
                    user.stripe_customer_id = customer_id
                    user.pro_started_at = timezone.now()
                    user.save(update_fields=['is_pro', 'stripe_customer_id', 'pro_started_at'])
                    logger.info(f"User {user.email} upgraded to Pro.")

        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            customer_id = subscription.get('customer')
            if customer_id:
                from apps.accounts.models import User
                user = User.objects.filter(stripe_customer_id=customer_id).first()
                if user:
                    user.is_pro = False
                    user.save(update_fields=['is_pro'])
                    logger.info(f"User {user.email} subscription deleted.")

        return Response(status=200)
