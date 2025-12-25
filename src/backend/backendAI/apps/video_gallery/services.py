"""
Video Gallery Service
Handles saving generated videos to Supabase PostgreSQL database
"""

import logging
import os
from typing import Any, Dict, Optional

import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor
from django.conf import settings

logger = logging.getLogger(__name__)


class VideoGalleryError(Exception):
    """Custom exception for video gallery errors"""
    pass


def _load_db_config() -> Dict[str, Any]:
    db = getattr(settings, "DATABASES", {}).get("default", {})
    options = db.get("OPTIONS") or {}
    config = {
        "host": db.get("HOST") or os.environ.get("SUPABASE_DB_HOST", "localhost"),
        "port": db.get("PORT") or os.environ.get("SUPABASE_DB_PORT", "5432"),
        "database": db.get("NAME") or os.environ.get("SUPABASE_DB_NAME", "postgres"),
        "user": db.get("USER") or os.environ.get("SUPABASE_DB_USER", "postgres"),
        "password": db.get("PASSWORD") or os.environ.get("SUPABASE_DB_PASSWORD", ""),
    }
    sslmode = options.get("sslmode") or os.environ.get("SUPABASE_DB_SSLMODE")
    if sslmode:
        config["sslmode"] = sslmode
    return config


class VideoGalleryService:
    """Service for managing video gallery in Supabase PostgreSQL"""
    def __init__(self):
        self.db_config = _load_db_config()

    def _get_connection(self):
        try:
            return psycopg2.connect(**self.db_config)
        except psycopg2.Error as exc:
            logger.error("Database connection failed: %s", str(exc))
            raise VideoGalleryError(f"Database connection failed: {str(exc)}")

    def get_task_record(self, task_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT video_id, user_id, video_url, prompt, intent, model, task_id, status, metadata
                    FROM video_gallery
                    WHERE task_id = %s
                """
                cursor.execute(query, (task_id,))
                result = cursor.fetchone()

            return dict(result) if result else None
        except psycopg2.Error as exc:
            logger.error("Database error: %s", str(exc))
            raise VideoGalleryError(f"Failed to fetch video task: {str(exc)}")
        finally:
            conn.close()

    def create_task_record(
        self,
        video_id: str,
        task_id: str,
        user_id: str,
        prompt: str,
        intent: str,
        model: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            if metadata is None:
                metadata = {}

            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    INSERT INTO video_gallery (
                        video_id, user_id, video_url, prompt, intent, model, task_id, status, metadata
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (task_id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        prompt = EXCLUDED.prompt,
                        intent = EXCLUDED.intent,
                        model = EXCLUDED.model,
                        status = EXCLUDED.status,
                        metadata = EXCLUDED.metadata,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING video_id, user_id, video_url, prompt, intent, model, task_id, status, metadata, created_at
                """

                cursor.execute(
                    query,
                    (
                        video_id,
                        user_id,
                        None,
                        prompt,
                        intent,
                        model,
                        task_id,
                        status,
                        psycopg2.extras.Json(metadata),
                    ),
                )

                result = cursor.fetchone()

            conn.commit()
            return dict(result)
        except psycopg2.Error as exc:
            logger.error("Database error: %s", str(exc))
            conn.rollback()
            raise VideoGalleryError(f"Failed to save video task: {str(exc)}")
        finally:
            conn.close()

    def update_video_result(
        self,
        task_id: str,
        video_url: Optional[str],
        status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            if metadata is None:
                metadata = {}

            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    UPDATE video_gallery
                    SET video_url = %s,
                        status = %s,
                        metadata = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = %s
                    RETURNING video_id, user_id, video_url, prompt, intent, model, task_id, status, metadata, updated_at
                """

                cursor.execute(
                    query,
                    (
                        video_url,
                        status,
                        psycopg2.extras.Json(metadata),
                        task_id,
                    ),
                )
                result = cursor.fetchone()

            conn.commit()
            return dict(result) if result else None
        except psycopg2.Error as exc:
            logger.error("Database error: %s", str(exc))
            conn.rollback()
            raise VideoGalleryError(f"Failed to update video task: {str(exc)}")
        finally:
            conn.close()

    def close(self):
        return

    def __del__(self):
        self.close()


video_gallery_service = VideoGalleryService()
