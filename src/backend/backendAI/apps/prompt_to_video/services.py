import logging
import os
import uuid
from typing import Any, Dict, Optional, Tuple

import requests

from core.file_uploader import FileUploadError, file_uploader
from apps.video_gallery.services import VideoGalleryError, video_gallery_service

logger = logging.getLogger(__name__)


class ModelStudioVideoError(Exception):
    """Custom exception for Model Studio video API errors"""
    pass


class ModelStudioVideoClient:
    DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"

    def __init__(self):
        self.api_key = os.environ.get("MODELSTUDIO_API_KEY", "").strip()
        if not self.api_key:
            raise ModelStudioVideoError("MODELSTUDIO_API_KEY is not set")
        self.timeout = int(os.environ.get("MODELSTUDIO_TIMEOUT", "60"))
        base_url = (
            os.environ.get("MODELSTUDIO_API_BASE")
            or os.environ.get("DASHSCOPE_API_BASE")
            or self.DEFAULT_BASE_URL
        ).rstrip("/")
        if "modelstudio.console.alibabacloud.com" in base_url:
            logger.warning(
                "MODELSTUDIO_API_BASE points to console host; overriding to %s",
                self.DEFAULT_BASE_URL,
            )
            base_url = self.DEFAULT_BASE_URL
        self.base_url = base_url
        self.create_endpoint = f"{self.base_url}/services/aigc/video-generation/video-synthesis"

    def _headers(self, async_enabled: bool = False) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if async_enabled:
            headers["X-DashScope-Async"] = "enable"
        return headers

    def create_task(self, model: str, input_payload: Dict[str, Any], parameters: Dict[str, Any]) -> Tuple[str, str]:
        payload = {
            "model": model,
            "input": input_payload,
            "parameters": parameters,
        }
        try:
            response = requests.post(
                self.create_endpoint,
                headers=self._headers(async_enabled=True),
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as exc:
            raise ModelStudioVideoError(f"Model Studio request failed: {str(exc)}") from exc

        output = data.get("output", {})
        task_id = output.get("task_id")
        if not task_id:
            raise ModelStudioVideoError(f"Model Studio response missing task_id: {data}")

        status = output.get("task_status") or output.get("status") or "UNKNOWN"
        return task_id, status

    def get_task_status(self, task_id: str) -> Tuple[str, Optional[str]]:
        try:
            response = requests.get(
                f"{self.base_url}/tasks/{task_id}",
                headers=self._headers(),
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as exc:
            raise ModelStudioVideoError(f"Model Studio status request failed: {str(exc)}") from exc

        output = data.get("output", {})
        status = output.get("task_status") or output.get("status") or "UNKNOWN"
        video_url = output.get("video_url")
        return status, video_url


class PromptToVideoService:
    DEFAULT_DURATION = 5
    DEFAULT_AUDIO = True
    DEFAULT_SIZE = "1280*720"

    def __init__(self):
        self.client = ModelStudioVideoClient()

    def create_task(self, user_id: str, prompt: str, model: str) -> Dict[str, Any]:
        prompt = prompt.strip()
        parameters = {
            "size": self.DEFAULT_SIZE,
            "duration": self.DEFAULT_DURATION,
            "audio": self.DEFAULT_AUDIO,
        }
        task_id, status = self.client.create_task(
            model=model,
            input_payload={"prompt": prompt},
            parameters=parameters,
        )

        video_id = str(uuid.uuid4())
        metadata = {
            "duration": self.DEFAULT_DURATION,
            "audio": self.DEFAULT_AUDIO,
            "size": self.DEFAULT_SIZE,
            "modelstudio_task_id": task_id,
        }

        video_gallery_service.create_task_record(
            video_id=video_id,
            task_id=task_id,
            user_id=user_id,
            prompt=prompt,
            intent="prompt_to_video",
            model=model,
            status=status,
            metadata=metadata,
        )

        return {
            "task_id": task_id,
            "status": status,
            "video_id": video_id,
        }

    def poll_task(self, task_id: str, user_id: str) -> Dict[str, Any]:
        record = video_gallery_service.get_task_record(task_id)
        if not record:
            raise VideoGalleryError("Task not found")
        if record.get("user_id") != user_id:
            raise VideoGalleryError("user_id does not match task")

        if record.get("video_url"):
            return {
                "task_id": task_id,
                "status": record.get("status", "SUCCEEDED"),
                "video_url": record.get("video_url"),
                "video_id": str(record.get("video_id")),
            }

        status, raw_video_url = self.client.get_task_status(task_id)

        if status == "SUCCEEDED":
            if not raw_video_url:
                raise ModelStudioVideoError("Model Studio response missing video_url")

            try:
                uploaded_url = file_uploader.upload_video_from_url(
                    raw_video_url,
                    custom_id=str(record.get("video_id")),
                )
            except FileUploadError as exc:
                logger.error("Video upload failed: %s", str(exc))
                raise

            metadata = record.get("metadata") or {}
            metadata.update({"modelstudio_video_url": raw_video_url})

            video_gallery_service.update_video_result(
                task_id=task_id,
                video_url=uploaded_url,
                status=status,
                metadata=metadata,
            )

            return {
                "task_id": task_id,
                "status": status,
                "video_url": uploaded_url,
                "video_id": str(record.get("video_id")),
            }

        if status in ("FAILED", "CANCELED", "UNKNOWN"):
            metadata = record.get("metadata") or {}
            metadata.update({"modelstudio_status": status})
            video_gallery_service.update_video_result(
                task_id=task_id,
                video_url=record.get("video_url"),
                status=status,
                metadata=metadata,
            )

        return {
            "task_id": task_id,
            "status": status,
            "video_url": None,
            "video_id": str(record.get("video_id")),
        }
