import os
from typing import Dict, Any, List, Optional
from core import ResponseFormatter
from google import genai
import time
import json


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GEMINI_API_KEY)


class PromptService:
    """
    Centralized Prompt Processing Service
    
    Supports 2 modes:
    1. FULL mode (chat flow): Refine prompt + Detect intent
    2. REFINE_ONLY mode (direct flow): Only refine prompt, skip intent detection
    """
    
    @staticmethod
    def refine_only(prompt: str, context: Optional[Dict] = None) -> str:
        """
        Mode 1: Refine prompt only (for direct feature access)
        
        Args:
            prompt: Raw user prompt
            context: Optional context (style, mood, etc.)
        
        Returns:
            Refined prompt string (NO intent detection)
        
        Usage:
            refined = PromptService.refine_only("make a sunset")
            # → "A vibrant sunset over mountains with warm orange and pink hues"
        """
        system_prompt = f"""
        You are an AI assistant specialized in refining prompts for image generation.
        
        Your task: Transform the user's raw prompt into a clearer, more detailed version.
        
        Rules:
        - DO NOT invent details not implied by the user
        - Only clarify, structure, and enhance descriptiveness
        - Keep it safe, visual, and image-generation-friendly
        - Output ONLY the refined prompt text (no JSON, no extra formatting)
        - Maximum 500 characters
        
        USER PROMPT: "{prompt}"
        """
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context)}"
        
        print(f"[PromptService] Refine only: {prompt}")
        start = time.time()
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=system_prompt
        ).text.strip()
        
        processing_time = time.time() - start
        print(f"[PromptService] Refined ({processing_time:.2f}s): {response}")
        
        return response
    
    @staticmethod
    def refine_and_detect_intent(prompt: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Mode 2: Refine prompt + Detect intent (for conversation flow)
        
        Args:
            prompt: Raw user prompt
            context: Optional context
        
        Returns:
            {
                "refined_prompt": str,
                "intent": str,
                "metadata": dict
            }
        
        Usage:
            result = PromptService.refine_and_detect_intent("make a sunset")
            # → {"refined_prompt": "...", "intent": "image_generate", ...}
        """
        system_prompt = f"""
        You are an AI assistant specialized in refining prompts for image generation systems.
        Your task is to analyze the user's raw prompt and output two things:
        1. refined_prompt – A clearer, more detailed, well-structured version of the user's input prompt.
        2. intent – The detected intent of the user from the following list:
        - image_generate: tạo ảnh mới từ prompt.
        - upscale: tăng độ phân giải.
        - remove_background: xóa nền ảnh.
        - relight: điều chỉnh ánh sáng.
        - style_transfer: áp dụng phong cách nghệ thuật cho ảnh.
        - reimagine: tưởng tượng lại ảnh với prompt mới.
        - image_expand: mở rộng biên ảnh.
        - other: nếu không thuộc các loại trên.

        Rules:
        - DO NOT invent details not implied by the user. Only clarify, structure, unify formatting.
        - Keep the refined_prompt safe, descriptive, visual, and image-generation-friendly.
        - If the user intent is unclear, classify as "image_generate".
        - Output JSON ONLY, with exactly this schema:

        {{
        "refined_prompt": "...",
        "intent": "..."
        }}

        Now process the following user prompt:

        USER_PROMPT: \"\"\"{prompt}\"\"\"
        """
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context)}"

        print(f"[PromptService] Refine + Detect intent: {prompt}")
        start = time.time()
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=system_prompt
        ).text
        
        processing_time = time.time() - start

        print(f"[PromptService] Raw response: {response}")
        if response.startswith("```"):
            response = response.replace("```json", "").replace("```", "").strip()

        parsed_response = json.loads(response)

        result = {
            "refined_prompt": parsed_response.get("refined_prompt", "") or prompt,
            "intent": parsed_response.get("intent", "image_generate"),
            "metadata": {
                "model": GEMINI_MODEL,
                "processing_time": processing_time,
            },
        }
        
        print(f"[PromptService] Result: {result}")
        return result


# ==================== LEGACY FUNCTIONS (Backward Compatibility) ====================

def refine_prompt(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Legacy function for backward compatibility
    Wraps PromptService.refine_and_detect_intent()
    
    Used by: Celery tasks, conversation service
    """
    raw_prompt = payload.get("prompt", "")
    context = {
        "style": payload.get("style"),
        "lang": payload.get("lang"),
        "topic": payload.get("topic"),
    }
    
    result = PromptService.refine_and_detect_intent(raw_prompt, context)
    
    return ResponseFormatter.success(result={
        "prompt": result["refined_prompt"],  # Legacy key name
        "intent": result["intent"],
        "metadata": result["metadata"],
    })

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
