import os
import json

PROMPT_TEMPLATE = """
以下のテキストは名刺をOCRで読み取った結果です。
このテキストから、次のキーを持つJSONフォーマットの構造化データとして抽出してください。
該当する情報が存在しない場合は、null ではなく空文字列 ("") を設定してください。

【抽出する情報（JSONのキー）】
- company_name: 会社名
- full_name: 氏名
- title: 役職
- email: メールアドレス
- phone: 電話番号（固定電話など）
- mobile: 携帯電話番号
- address: 住所
- website: ウェブサイトURL
- department: 部署名
- notes: AIが補足した情報など（自由記述）

【制約事項】
- 結果はJSONフォーマットのみを出力してください。マークダウンの記号や、その他のテキストは一切含めないでください。

--- OCRテキスト ---
{text}
"""

def parse_business_card(ocr_text: str) -> dict:
    if not ocr_text or not ocr_text.strip():
        return {}

    provider = os.environ.get('LLM_PROVIDER', 'gemini').lower()
    prompt = PROMPT_TEMPLATE.format(text=ocr_text)

    try:
        if provider == 'openai':
            return _parse_with_openai(prompt)
        else:
            return _parse_with_gemini(prompt)
    except Exception as e:
        raise Exception(f"LLM parsing failed: {e}")

def _parse_with_gemini(prompt: str) -> dict:
    from google import genai
    from google.genai import types
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    client = genai.Client(api_key=api_key)
    # 応答の安定性のため gemini-2.0-flash を使用
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        )
    )
    
    return _extract_json(response.text)

def _parse_with_openai(prompt: str) -> dict:
    from openai import OpenAI
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set.")
        
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts structured data from business cards and returns exactly valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" }
    )
    
    content = response.choices[0].message.content
    return _extract_json(content)

def _extract_json(text: str) -> dict:
    if not text:
        return {}
        
    text = text.strip()
    if text.startswith('```json'):
        text = text[len('```json'):]
    if text.startswith('```'):
        text = text[len('```'):]
    if text.endswith('```'):
        text = text[:-3]
        
    text = text.strip()
    return json.loads(text)
