"""
Image Gallery Service
Handles saving generated images to Supabase PostgreSQL database
"""

import logging
import re
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ImageGalleryError(Exception):
    """Custom exception for image gallery errors"""
    pass


class ImageGalleryService:
    """Service for managing image gallery in Supabase PostgreSQL"""
    
    # Supabase connection details
    DB_CONFIG = {
        'host': 'aws-1-ap-southeast-1.pooler.supabase.com',
        'port': 6543,
        'database': 'postgres',
        'user': 'postgres.rbwqlqiedfqnqxnfzkcr',
        'password': 'aiphotofunstudio'
    }
    
    def __init__(self):
        """Initialize connection pool"""
        self.connection = None
    
    def _get_connection(self):
        """Get database connection"""
        try:
            if not self.connection or self.connection.closed:
                self.connection = psycopg2.connect(**self.DB_CONFIG)
            return self.connection
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise ImageGalleryError(f"Database connection failed: {str(e)}")
    
    def _extract_uuid_from_url(self, url: str) -> str:
        """
        Extract UUID from image URL
        Example: https://file-service-cdal.onrender.com/.../8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg
        Returns: 8d76bd3a-053e-4bb5-a2ab-ce147e53f40c
        """
        pattern = r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            return match.group(1)
        # Fallback: generate new UUID
        return str(uuid.uuid4())
    
    def save_image(
        self,
        user_id: str,
        image_url: str,
        refined_prompt: Optional[str] = None,
        intent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Save generated image to database
        
        Args:
            user_id: User identifier
            image_url: Full URL of uploaded image
            refined_prompt: AI-refined prompt used for generation
            intent: Generation intent (image_generate, upscale, relight, etc.)
            metadata: Additional metadata (model, aspect_ratio, style, etc.)
            
        Returns:
            {
                "image_id": "uuid",
                "user_id": "user123",
                "image_url": "https://...",
                "refined_prompt": "...",
                "intent": "image_generate",
                "metadata": {...},
                "created_at": "2025-12-13T10:30:00Z"
            }
            
        Raises:
            ImageGalleryError: When save fails
        """
        try:
            # Extract UUID from URL
            image_id = self._extract_uuid_from_url(image_url)
            
            # Prepare metadata
            if metadata is None:
                metadata = {}
            
            # Get connection
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Insert into database
            query = """
                INSERT INTO image_gallery (
                    image_id, user_id, image_url, refined_prompt, intent, metadata
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (image_id) DO UPDATE SET
                    image_url = EXCLUDED.image_url,
                    refined_prompt = EXCLUDED.refined_prompt,
                    intent = EXCLUDED.intent,
                    metadata = EXCLUDED.metadata,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING image_id, user_id, image_url, refined_prompt, intent, metadata, created_at, updated_at
            """
            
            cursor.execute(query, (
                image_id,
                user_id,
                image_url,
                refined_prompt,
                intent,
                psycopg2.extras.Json(metadata)
            ))
            
            result = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            logger.info(f"Saved image {image_id} for user {user_id}")
            
            return dict(result)
        
        except psycopg2.Error as e:
            logger.error(f"Database error: {str(e)}")
            if self.connection:
                self.connection.rollback()
            raise ImageGalleryError(f"Failed to save image: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise ImageGalleryError(f"Failed to save image: {str(e)}")
    
    def save_multiple_images(
        self,
        user_id: str,
        image_urls: List[str],
        refined_prompt: Optional[str] = None,
        intent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Save multiple generated images
        
        Args:
            user_id: User identifier
            image_urls: List of image URLs
            refined_prompt: AI-refined prompt
            intent: Generation intent
            metadata: Shared metadata
            
        Returns:
            List of saved image records
        """
        saved_images = []
        
        for url in image_urls:
            try:
                result = self.save_image(
                    user_id=user_id,
                    image_url=url,
                    refined_prompt=refined_prompt,
                    intent=intent,
                    metadata=metadata
                )
                saved_images.append(result)
            except ImageGalleryError as e:
                logger.error(f"Failed to save image {url}: {str(e)}")
                # Continue with other images
        
        return saved_images
    
    def get_user_images(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        intent: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get user's image gallery
        
        Args:
            user_id: User identifier
            limit: Max number of images to return
            offset: Pagination offset
            intent: Filter by intent (optional)
            
        Returns:
            List of image records
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if intent:
                query = """
                    SELECT image_id, user_id, image_url, refined_prompt, intent, metadata, created_at
                    FROM image_gallery
                    WHERE user_id = %s AND intent = %s AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """
                cursor.execute(query, (user_id, intent, limit, offset))
            else:
                query = """
                    SELECT image_id, user_id, image_url, refined_prompt, intent, metadata, created_at
                    FROM image_gallery
                    WHERE user_id = %s AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """
                cursor.execute(query, (user_id, limit, offset))
            
            results = cursor.fetchall()
            cursor.close()
            
            return [dict(row) for row in results]
        
        except psycopg2.Error as e:
            logger.error(f"Database error: {str(e)}")
            raise ImageGalleryError(f"Failed to fetch images: {str(e)}")
    
    def delete_image(self, user_id: str, image_id: str) -> bool:
        """
        Soft delete an image
        
        Args:
            user_id: User identifier
            image_id: Image UUID
            
        Returns:
            True if deleted successfully
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                UPDATE image_gallery
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE image_id = %s AND user_id = %s AND deleted_at IS NULL
            """
            
            cursor.execute(query, (image_id, user_id))
            rows_affected = cursor.rowcount
            conn.commit()
            cursor.close()
            
            if rows_affected > 0:
                logger.info(f"Deleted image {image_id} for user {user_id}")
                return True
            else:
                logger.warning(f"Image {image_id} not found for user {user_id}")
                return False
        
        except psycopg2.Error as e:
            logger.error(f"Database error: {str(e)}")
            if self.connection:
                self.connection.rollback()
            raise ImageGalleryError(f"Failed to delete image: {str(e)}")
    
    def close(self):
        """Close database connection"""
        if self.connection and not self.connection.closed:
            self.connection.close()
            logger.info("Database connection closed")
    
    def __del__(self):
        """Cleanup on destruction"""
        self.close()


# Global instance
image_gallery_service = ImageGalleryService()
