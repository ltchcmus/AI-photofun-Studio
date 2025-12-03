import os
import base64
import httpx
from celery import shared_task
from .services import mock_generate_base64
from core import ResponseCode
from core import APIResponse


@shared_task(name="image_service.generate_image_task")
def generate_image_task(refined_prompt: str, size: str = "1024x1024") -> dict:
    if refined_prompt.get("code") == ResponseCode.ERROR:
        return refined_prompt, APIResponse.error()

    return refined_prompt, mock_generate_base64(refined_prompt, size)
