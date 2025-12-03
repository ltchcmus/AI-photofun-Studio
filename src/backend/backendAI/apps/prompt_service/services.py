import os
from typing import Dict, Any, List
from core import APIResponse


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GEMINI_API_KEY)


def refine_prompt(payload: Dict[str, Any]) -> Dict[str, Any]:
    raw_prompt = payload.get("prompt", "").strip()
    style = payload.get("style")
    topic = payload.get("topic")
    lang = payload.get("lang")

    system_prompt = f"""
    You are an AI assistant specialized in refining prompts for image generation systems.
    Your task is to analyze the user's raw prompt and output two things:
    1. refined_prompt – A clearer, more detailed, well-structured version of the user's input prompt.
    2. intent – The detected intent of the user from the following list:
    - image_generate: tạo ảnh mới từ prompt.
    - style_transfer: áp dụng phong cách nghệ thuật cho ảnh.
    - replace_background: thay nền.
    - edit_image: chỉnh sửa 1 phần của ảnh.
    - inpaint: tô lại hoặc xoá/điền nội dung.
    - upscale: tăng độ phân giải.
    - other: nếu không thuộc các loại trên.

    Rules:
    - DO NOT invent details not implied by the user. Only clarify, structure, unify formatting.
    - Keep the refined_prompt safe, descriptive, visual, and image-generation-friendly.
    - If the user intent is unclear, classify as “image_generate”.
    - Output JSON ONLY, with exactly this schema:

    {{
    "refined_prompt": "...",
    "intent": "..."
    }}

    Now process the following user prompt:

    USER_PROMPT: \"\"\"{user_prompt}\"\"\"
    """

    start = time.time()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    )
    processing_time = time.time() - start

    if raw.startswith("```"):
        raw = raw.replace("```json", "").replace("```", "").strip()

    parsed_response = json.loads(raw)

    result = {
        "prompt": response.get("refined_prompt", "") or raw_prompt,
        "intent": response.get("intent", ""),
        "metadata": {
            "model": DEFAULT_MODEL,
            "processing_time": processing_time,
        },
    }

    return APIResponse.success(result=result)
