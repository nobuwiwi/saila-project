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
                # 新しいStripe SDK（v7+）はStripeObjectを返すため辞書に変換する
                if hasattr(event, 'to_dict'):
                    event = event.to_dict()
            except ValueError as e:
                logger.warning("Invalid payload for Stripe webhook")
                return Response(status=400)
            except stripe.error.SignatureVerificationError as e:
                logger.warning("Invalid signature for Stripe webhook")
                return Response(status=400)

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
                        user.pro_cancel_at_period_end = False
                        user.save(update_fields=['is_pro', 'stripe_customer_id', 'pro_started_at', 'pro_cancel_at_period_end'])
                        logger.info(f"User {user.email} upgraded to Pro.")

            elif event['type'] in ['customer.subscription.deleted', 'customer.subscription.updated']:
                subscription = event['data']['object']
                customer_id = subscription.get('customer')
                status = subscription.get('status')
                cancel_at_period_end = subscription.get('cancel_at_period_end', False)
                # 新しいbilling_mode:flexibleではcancel_atに日時が入る（cancel_at_period_endはfalseのまま）
                cancel_at = subscription.get('cancel_at')
                is_scheduled_for_cancellation = cancel_at_period_end or (cancel_at is not None)

                logger.info(
                    f"[Webhook] {event['type']} received: "
                    f"customer_id={customer_id}, status={status}, "
                    f"cancel_at_period_end={cancel_at_period_end}, "
                    f"cancel_at={cancel_at}, is_scheduled={is_scheduled_for_cancellation}"
                )

                if customer_id:
                    from apps.accounts.models import User
                    user = User.objects.filter(stripe_customer_id=customer_id).first()

                    # stripe_customer_id が未保存の場合、Stripe APIでメールを取得してフォールバック
                    if not user:
                        logger.warning(
                            f"[Webhook] No user found for stripe_customer_id={customer_id}. "
                            f"Falling back to Stripe customer email lookup."
                        )
                        try:
                            stripe_customer = stripe.Customer.retrieve(customer_id)
                            customer_email = stripe_customer.get('email')
                            if customer_email:
                                user = User.objects.filter(email=customer_email).first()
                                if user:
                                    # 見つかったのでstripe_customer_idを補完保存
                                    user.stripe_customer_id = customer_id
                                    user.save(update_fields=['stripe_customer_id'])
                                    logger.info(
                                        f"[Webhook] Fallback succeeded: user={user.email}, "
                                        f"stripe_customer_id saved."
                                    )
                        except Exception as lookup_error:
                            logger.error(f"[Webhook] Stripe customer lookup failed: {lookup_error}")

                    if user:
                        if event['type'] == 'customer.subscription.deleted' or status in ['canceled', 'unpaid', 'past_due']:
                            user.is_pro = False
                            user.pro_cancel_at_period_end = False
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"[Webhook] User {user.email} subscription downgraded / deleted.")
                        elif is_scheduled_for_cancellation:
                            user.is_pro = True
                            user.pro_cancel_at_period_end = True
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"[Webhook] User {user.email} subscription scheduled for cancellation.")
                        elif status in ['active', 'trialing']:
                            user.is_pro = True
                            user.pro_cancel_at_period_end = False
                            user.save(update_fields=['is_pro', 'pro_cancel_at_period_end'])
                            logger.info(f"[Webhook] User {user.email} subscription active/renewed.")
                        else:
                            logger.warning(
                                f"[Webhook] User {user.email}: no matching condition. "
                                f"status={status}, cancel_at_period_end={cancel_at_period_end}"
                            )
                    else:
                        logger.error(
                            f"[Webhook] User not found for customer_id={customer_id} "
                            f"even after fallback. Skipping update."
                        )

            return Response(status=200)

        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Webhook Unhandled Error: {error_trace}")
            # Stripeダッシュボード上でエラー原因を読めるようにテキストを返す
            return Response({"error": str(e), "trace": error_trace}, status=500)

