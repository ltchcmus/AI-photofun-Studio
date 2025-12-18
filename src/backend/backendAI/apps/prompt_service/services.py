import os
from typing import Dict, Any, List, Optional
from core import ResponseFormatter
from google import genai
import time
import json
import logging
import random

logger = logging.getLogger(__name__)

# Load API keys from environment variable (comma-separated list)
GEMINI_API_KEYS_STR = os.getenv("GEMINI_API_KEYS", "")
if GEMINI_API_KEYS_STR:
    # Parse comma-separated keys from .env
    GEMINI_API_KEYS = [key.strip() for key in GEMINI_API_KEYS_STR.split(",") if key.strip()]
else:
    # Fallback to single key for backward compatibility
    single_key = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEYS = [single_key] if single_key else []

if not GEMINI_API_KEYS:
    logger.error("[PromptService] No Gemini API keys configured!")
else:
    logger.info(f"[PromptService] Loaded {len(GEMINI_API_KEYS)} Gemini API keys")

# Track current key index (rotates through keys)
_current_key_index = 0

def get_next_gemini_client():
    """
    Get next Gemini client with rotating API key
    Rotates through API keys to avoid rate limits
    """
    global _current_key_index
    api_key = GEMINI_API_KEYS[_current_key_index]
    _current_key_index = (_current_key_index + 1) % len(GEMINI_API_KEYS)
    logger.info(f"[PromptService] Using API key #{_current_key_index + 1}/{len(GEMINI_API_KEYS)}")
    return genai.Client(api_key=api_key)

def call_gemini_with_retry(model: str, contents: str, max_retries: int = 3) -> str:
    """
    Call Gemini API with automatic retry on rate limit errors
    Tries different API keys if one fails
    
    Args:
        model: Gemini model name
        contents: Prompt contents
        max_retries: Maximum number of retry attempts
        
    Returns:
        Response text from Gemini
        
    Raises:
        Exception: If all retries fail
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            client = get_next_gemini_client()
            response = client.models.generate_content(
                model=model,
                contents=contents
            )
            
            # Check if response has text
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            else:
                raise ValueError(f"Empty response from Gemini API: {response}")
            
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"[PromptService] Attempt {attempt + 1}/{max_retries} failed: {error_msg}")
            last_error = e
            
            # If rate limit error, try next key immediately
            if "429" in error_msg or "rate" in error_msg.lower() or "quota" in error_msg.lower():
                logger.warning(f"[PromptService] Rate limit detected, switching to next API key...")
                continue
            else:
                # For other errors, raise immediately
                raise e
    
    # All retries failed
    logger.error(f"[PromptService] All {max_retries} attempts failed")
    raise last_error


GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


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
        
        response = call_gemini_with_retry(
            model=GEMINI_MODEL,
            contents=system_prompt
        )
        
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
            # → {"refined_prompt": "...", "intent": "image_generation", ...}
        """
        system_prompt = f"""
        You are an AI assistant specialized in refining prompts for image generation and manipulation systems.
        Your task is to analyze the user's raw prompt and output two things:
        
        1. refined_prompt – A clearer, more detailed, well-structured version of the user's input prompt.
        2. intent – The detected intent of the user from the following list:
        
        **Available AI Features:**
        - image_generation: Tạo ảnh mới từ mô tả văn bản (text-to-image). Ví dụ: "vẽ một bức tranh hoàng hôn", "tạo ảnh con mèo".
        - upscale: Tăng độ phân giải, làm rõ nét ảnh. Ví dụ: "làm rõ ảnh này", "tăng chất lượng ảnh".
        - remove_background: Xóa nền ảnh, tách đối tượng. Ví dụ: "xóa background", "tách nền ảnh này".
        - relight: Điều chỉnh ánh sáng, thay đổi lighting. Ví dụ: "chiếu sáng từ trái", "ánh sáng mặt trời buổi sáng".
        - style_transfer: Áp dụng phong cách nghệ thuật từ ảnh tham chiếu. Ví dụ: "vẽ theo phong cách anime", "chuyển sang phong cách oil painting".
        - reimagine: Tái tưởng tượng ảnh với biến thể mới (giữ ý tưởng gốc). Ví dụ: "tưởng tượng lại ảnh này", "tạo phiên bản khác của ảnh".
        - image_expand: Mở rộng biên ảnh, thêm nội dung xung quanh. Ví dụ: "mở rộng ảnh sang phải", "expand ảnh về 4 phía".
        - other: Nếu không thuộc các intent trên (chào hỏi, hỏi thông tin, v.v.).

        **Rules:**
        - DO NOT invent details not implied by the user. Only clarify, structure, and enhance descriptiveness.
        - Keep the refined_prompt safe, descriptive, visual, and image-generation-friendly.
        - If the user's intent is unclear or ambiguous, classify as "image_generation".
        - For features requiring images (upscale, remove_background, relight, style_transfer, reimagine, image_expand), the user should have already uploaded an image in the conversation context.
        - Output JSON ONLY, with exactly this schema:

        {{
        "refined_prompt": "...",
        "intent": "..."
        }}

        **Examples:**
        - User: "tạo ảnh một con rồng bay trên trời" → {{"refined_prompt": "A majestic dragon flying in the sky with spread wings, dramatic clouds, fantasy art style", "intent": "image_generation"}}
        - User: "làm rõ ảnh này" → {{"refined_prompt": "Enhance image resolution and clarity", "intent": "upscale"}}
        - User: "xóa background" → {{"refined_prompt": "Remove background from image", "intent": "remove_background"}}
        - User: "thêm ánh sáng mặt trời buổi chiều" → {{"refined_prompt": "Add warm afternoon sunlight with golden hour lighting", "intent": "relight"}}
        - User: "chuyển sang phong cách anime" → {{"refined_prompt": "Transform to anime art style", "intent": "style_transfer"}}
        - User: "mở rộng ảnh sang 2 bên" → {{"refined_prompt": "Expand image borders on left and right sides", "intent": "image_expand"}}
        - User: "tưởng tượng lại ảnh này theo phong cách khác" → {{"refined_prompt": "Reimagine this image with creative variations", "intent": "reimagine"}}

        Now process the following user prompt:

        USER_PROMPT: \"\"\"{prompt}\"\"\"
        """
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context)}"

        print(f"[PromptService] Refine + Detect intent: {prompt}")
        start = time.time()
        
        response = call_gemini_with_retry(
            model=GEMINI_MODEL,
            contents=system_prompt
        )
        
        processing_time = time.time() - start

        print(f"[PromptService] Raw response: {response}")
        if response.startswith("```"):
            response = response.replace("```json", "").replace("```", "").strip()

        parsed_response = json.loads(response)

        result = {
            "refined_prompt": parsed_response.get("refined_prompt", "") or prompt,
            "intent": parsed_response.get("intent", "image_generation"),
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
    conversation_context = payload.get("context", {})  # Get conversation context
    
    context = {
        "style": payload.get("style"),
        "lang": payload.get("lang"),
        "topic": payload.get("topic"),
    }
    
    result = PromptService.refine_and_detect_intent(raw_prompt, context)
    
    # Return raw dict for Celery chain (no ResponseFormatter wrapper)
    return {
        "prompt": result["refined_prompt"],  # Legacy key name
        "intent": result["intent"],
        "metadata": result["metadata"],
        "context": conversation_context,  # Pass through conversation context
    }


def merge_prompts(original_prompt: str, user_update_prompt: str):
    """
    Merge original prompt with user update prompt for image modification
    
    Args:
        original_prompt: The original prompt used to generate the image
        user_update_prompt: User's modification instructions
        
    Returns:
        {
            "merged_prompt": str,
            "intent": str
        }
    """
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
    
    **Available AI Features:**
    - image_generation: Tạo ảnh mới từ mô tả văn bản (text-to-image).
    - upscale: Tăng độ phân giải, làm rõ nét ảnh.
    - remove_background: Xóa nền ảnh, tách đối tượng.
    - relight: Điều chỉnh ánh sáng, thay đổi lighting.
    - style_transfer: Áp dụng phong cách nghệ thuật từ ảnh tham chiếu.
    - reimagine: Tái tưởng tượng ảnh với biến thể mới.
    - image_expand: Mở rộng biên ảnh, thêm nội dung xung quanh.
    - other: Nếu không thuộc các intent trên.

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

    raw = call_gemini_with_retry(
        model="gemini-2.5-flash",
        contents=system_prompt
    )
    if raw.startswith("```"):
        raw = raw.replace("```json", "").replace("```", "").strip()
    parsed_response = json.loads(raw)


    return parsed_response  # Gemini trả JSON string
