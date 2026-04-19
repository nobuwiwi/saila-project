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

class CreateCustomerPortalSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.stripe_customer_id:
            return Response({'error': 'Stripe customer ID not found'}, status=400)
            
        try:
            origin = request.headers.get('origin', 'https://your-frontend.railway.app')
            return_url = f"{origin}/cards"

            portal_session = stripe.billing_portal.Session.create(
                customer=request.user.stripe_customer_id,
                return_url=return_url,
            )
            return Response({'url': portal_session.url})
        except Exception as e:
            import traceback
            logger.error(f"Stripe Customer Portal Error: {traceback.format_exc()}")
            return Response({'error': str(e)}, status=500)

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
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
                client_reference_id = getattr(session, 'client_reference_id', None)
                customer_id = getattr(session, 'customer', None)
                
                if client_reference_id:
                    from apps.accounts.models import User
                    from django.utils import timezone
                    user = User.objects.filter(id=client_reference_id).first()
                    if user:
                        user.is_pro = True
                        user.stripe_customer_id = customer_id
                        user.pro_started_at = timezone.now()
                        user.pro_cancel_at_period_end = False
                        user.save(update_fields=['is_pro', 'stripe_customer_id', 'pro_started_at', 'pro_cancel_at_period_end'])
                        logger.info(f"User {user.email} upgraded to Pro.")

            elif event['type'] in ['customer.subscription.deleted', 'customer.subscription.updated']:
                subscription = event['data']['object']
                customer_id = getattr(subscription, 'customer', None)
                status = getattr(subscription, 'status', None)
                cancel_at_period_end = getattr(subscription, 'cancel_at_period_end', False)
                
                if customer_id:
                    from apps.accounts.models import User
                    user = User.objects.filter(stripe_customer_id=customer_id).first()
                    if user:
                        if event['type'] == 'customer.subscription.deleted' or status in ['canceled', 'unpaid', 'past_due']:
                            user.is_pro = False
                            user.pro_cancel_at_period_end = False
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"User {user.email} subscription downgraded / deleted.")
                        elif cancel_at_period_end:
                            user.is_pro = True
                            user.pro_cancel_at_period_end = True
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"User {user.email} subscription scheduled for cancellation.")
                        elif status in ['active', 'trialing']:
                            user.is_pro = True
                            user.pro_cancel_at_period_end = False
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"User {user.email} subscription active/renewed.")

            return Response(status=200)

        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Webhook Unhandled Error: {error_trace}")
            # Stripeダッシュボード上でエラー原因を読めるようにテキストを返す
            return Response({"error": str(e), "trace": error_trace}, status=500)

