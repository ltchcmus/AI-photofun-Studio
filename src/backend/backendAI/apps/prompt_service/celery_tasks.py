from celery import shared_task
from .services import refine_prompt


@shared_task(name="prompt_service.process_prompt_task")
def process_prompt_task(payload: dict) -> dict:
    return refine_prompt(payload)
