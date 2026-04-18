import os
from google.cloud import vision

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Google Cloud Vision API を使用して画像データ（バイト列）からテキストを抽出する。
    
    環境変数 `GOOGLE_CLOUD_VISION_API_KEY` が設定されている前提で動作します。
    """
    api_key = os.environ.get('GOOGLE_CLOUD_VISION_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_CLOUD_VISION_API_KEY is not set.")
    
    # Vision API クライアントの初期化（APIキーを使用）
    client = vision.ImageAnnotatorClient(
        client_options={"api_key": api_key}
    )

    image = vision.Image(content=image_bytes)

    # テキスト検出の実行
    response = client.text_detection(image=image)
    
    if response.error.message:
        raise Exception(
            '{}\nFor more info on error messages, check: '
            'https://cloud.google.com/apis/design/errors'.format(
                response.error.message))

    texts = response.text_annotations
    if texts:
        # texts[0] は画像全体のテキストを含む
        return texts[0].description

    return ""
