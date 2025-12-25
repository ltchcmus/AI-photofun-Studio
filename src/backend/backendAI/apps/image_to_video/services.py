import logging
import uuid
from typing import Any, Dict

from core.file_uploader import FileUploadError, file_uploader
from core.image_input_handler import ImageInputHandler
from apps.video_gallery.services import VideoGalleryError, video_gallery_service
from apps.prompt_to_video.services import ModelStudioVideoClient, ModelStudioVideoError

logger = logging.getLogger(__name__)


class ImageToVideoService:
    DEFAULT_DURATION = 5
    DEFAULT_AUDIO = True
    DEFAULT_RESOLUTION = "720P"

    def __init__(self):
        self.client = ModelStudioVideoClient()

    def create_task(
        self,
        user_id: str,
        prompt: str,
        model: str,
        image_data: str = None,
        image_url: str = None,
        image_file=None,
    ) -> Dict[str, Any]:
        prompt = prompt.strip()
        processed_url, source_type = ImageInputHandler.process_image_input(
            image_data=image_data,
            image_url=image_url,
            image_file=image_file,
        )

        parameters = {
            "resolution": self.DEFAULT_RESOLUTION,
            "duration": self.DEFAULT_DURATION,
            "audio": self.DEFAULT_AUDIO,
        }

        task_id, status = self.client.create_task(
            model=model,
            input_payload={"prompt": prompt, "img_url": processed_url},
            parameters=parameters,
        )

        video_id = str(uuid.uuid4())
        metadata = {
            "duration": self.DEFAULT_DURATION,
            "audio": self.DEFAULT_AUDIO,
            "resolution": self.DEFAULT_RESOLUTION,
            "modelstudio_task_id": task_id,
            "input_image_url": processed_url,
            "input_source": source_type,
        }

        video_gallery_service.create_task_record(
            video_id=video_id,
            task_id=task_id,
            user_id=user_id,
            prompt=prompt,
            intent="image_to_video",
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
