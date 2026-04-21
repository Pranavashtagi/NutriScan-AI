import os
import json
import base64
import requests
from dotenv import load_dotenv

try:
    load_dotenv()
except Exception:
    pass

def analyze_food_image(image_path):
    """
    Analyze a food image using the Groq Llama 4 Scout Vision API.
    Returns a list of detected food items with nutritional info, or None on failure.
    """
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        return None

    if not os.path.exists(image_path):
        return None

    ext = image_path.rsplit('.', 1)[-1].lower()
    mime_map = {'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'}
    mime_type = mime_map.get(ext, 'image/jpeg')

    with open(image_path, 'rb') as f:
        encoded_image = base64.b64encode(f.read()).decode('utf-8')

    prompt = (
        "Analyze this image and identify all food items. "
        "For each item, estimate the quantity and provide nutritional information (calories, protein, fat, carbs). "
        "Return ONLY a valid JSON array with this exact structure:\n"
        '[{"name": "food name", "quantity": "estimated quantity", '
        '"calories": 100, "protein": 10, "fat": 5, "carbs": 20}]\n'
        "If NO food is detected, return an empty array []. "
        "Do not include any markdown or extra text."
    )

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded_image}"}}
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            return None

        content = response.json()['choices'][0]['message']['content'].strip()

        # Strip markdown code fences if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content.strip())

    except Exception:
        return None
