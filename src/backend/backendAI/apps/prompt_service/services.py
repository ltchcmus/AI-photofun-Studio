import os
from typing import Dict, Any, List
from core import ResponseFormatter
from google import genai
import time
import json


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GEMINI_API_KEY)


def refine_prompt(payload: Dict[str, Any]) -> Dict[str, Any]:
    raw_prompt = payload.get("prompt", "")

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

    USER_PROMPT: \"\"\"{raw_prompt}\"\"\"
    """

    print("Refine prompt start: ", raw_prompt)
    start = time.time()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    ).text
    processing_time = time.time() - start

    print("Raw response: ", response)
    if response.startswith("```"):
        response = response.replace("```json", "").replace("```", "").strip()

    parsed_response = json.loads(response)

    result = {
        "prompt": parsed_response.get("refined_prompt", "") or raw_prompt,
        "intent": parsed_response.get("intent", ""),
        "metadata": {
            "model": GEMINI_MODEL,
            "processing_time": processing_time,
        },
    }
    print("Refine prompt end: ", parsed_response.get("refined_prompt", ""))

    return ResponseFormatter.success(result=result)

def merge_prompts(original_prompt: str, user_update_prompt: str):
    system_prompt = f"""
    You are an AI assistant specialized in editing and merging image generation prompts.
    The user already has an original image created from an existing prompt, and now provides additional instructions to modify or extend that image. Your job is to merge the two prompts into one updated prompt.

    Inputs:
    - original_prompt: the prompt used to generate the existing image.
    - user_update_prompt: the user's new modification instructions.

    Your tasks:
    1. merged_prompt – Combine the original_prompt and user_update_prompt into a single, clean, well-structured prompt.
    2. Respect the meaning and visual intent of the original_prompt.
    3. Integrate the user_update_prompt modifications accurately, without inventing new details.
    4. Do NOT contradict the original_prompt unless the user's update explicitly overrides something.
    5. Keep the prompt image-generation-friendly, descriptive, and safe.
    6. intent – The detected intent of the user from the following list:
    - image_generate: tạo ảnh mới từ prompt.
    - style_transfer: áp dụng phong cách nghệ thuật cho ảnh.
    - replace_background: thay nền.
    - inpaint: tô lại hoặc xoá/điền nội dung.
    - upscale: tăng độ phân giải.
    - other: nếu không thuộc các loại trên.

    Rules:
    - Do NOT introduce any details not implied by either prompt.
    - If the user_update_prompt is ambiguous, clarify minimally but stay faithful to user intent.
    - Preserve the artistic style of original_prompt unless user explicitly changes it.
    - Output JSON ONLY, in exactly this format:

    {{
    "merged_prompt": "...",
    "intent": "..."
    }}

    Now process the following data:

    original_prompt: \"\"\"{original_prompt}\"\"\"
    user_update_prompt: \"\"\"{user_update_prompt}\"\"\"
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    )

    raw = response.text
    if raw.startswith("```"):
        raw = raw.replace("```json", "").replace("```", "").strip()
    parsed_response = json.loads(raw)


    return parsed_response  # Gemini trả JSON string
