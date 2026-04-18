import logging
from celery import shared_task
from django.utils import timezone
from .models import BusinessCard
from .services.ocr import extract_text_from_image
from .services.parser import parse_business_card

logger = logging.getLogger(__name__)

@shared_task
def analyze_card(card_id):
    """
    非同期で名刺画像のOCR読み取りと、LLMによるパースを行うタスク。
    """
    try:
        card = BusinessCard.objects.get(id=card_id)
    except BusinessCard.DoesNotExist:
        logger.error(f"Card {card_id} not found.")
        return

    # 処理開始のマーク
    card.analysis_status = 'processing'
    card.save(update_fields=['analysis_status', 'updated_at'])

    try:
        if not card.image:
            raise ValueError("No image attached to the card.")

        # 画像データ読み込み
        with card.image.open('rb') as f:
            image_bytes = f.read()

        # 1. OCRでテキスト抽出
        ocr_text = extract_text_from_image(image_bytes)
        card.raw_ocr_text = ocr_text

        # 2. LLMでJSONパース
        parsed_data = parse_business_card(ocr_text)

        # 成功
        card.parsed_data = parsed_data
        card.analysis_status = 'done'
        
    except Exception as e:
        logger.exception(f"Error analyzing card {card_id}: {e}")
        card.analysis_status = 'failed'
        
    finally:
        card.save(update_fields=['raw_ocr_text', 'parsed_data', 'analysis_status', 'updated_at'])
