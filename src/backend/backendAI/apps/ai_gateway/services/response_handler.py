"""
Response Handler Service

Format và chuẩn bị response trả về frontend theo đúng format chat interface.
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


class ResponseHandlerService:
    """Service để format responses cho chat interface"""
    
    def format_text_response(
        self,
        text: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Format simple text response
        
        Returns:
            dict: Formatted response for frontend
        """
        return {
            'type': 'text',
            'content': text,
            'metadata': metadata or {},
            'timestamp': datetime.now().isoformat(),
        }
    
    def format_image_response(
        self,
        image_url: str,
        prompt: str,
        metadata: Dict
    ) -> Dict:
        """
        Format image generation response
        
        Args:
            image_url: URL to generated image
            prompt: Prompt used for generation
            metadata: Generation metadata (model, params, etc.)
            
        Returns:
            dict: Formatted response for frontend
        """
        return {
            'type': 'image',
            'content': {
                'image_url': image_url,
                'thumbnail_url': image_url,  # TODO: Generate thumbnail
                'prompt': prompt,
                'alt_text': f"Generated image: {prompt[:100]}",
            },
            'metadata': {
                **metadata,
                'can_download': True,
                'can_edit': True,
                'can_regenerate': True,
            },
            'actions': [
                {
                    'id': 'download',
                    'label': 'Download',
                    'icon': 'download',
                },
                {
                    'id': 'regenerate',
                    'label': 'Regenerate',
                    'icon': 'refresh',
                },
                {
                    'id': 'edit',
                    'label': 'Edit',
                    'icon': 'edit',
                },
                {
                    'id': 'variations',
                    'label': 'Create Variations',
                    'icon': 'grid',
                },
            ],
            'timestamp': datetime.now().isoformat(),
        }
    
    def format_processing_response(
        self,
        message: str,
        estimated_time: Optional[float] = None
    ) -> Dict:
        """
        Format response when processing is in progress
        
        Args:
            message: Status message
            estimated_time: Estimated completion time in seconds
            
        Returns:
            dict: Formatted response for frontend
        """
        response = {
            'type': 'processing',
            'content': message,
            'status': 'in_progress',
            'timestamp': datetime.now().isoformat(),
        }
        
        if estimated_time:
            response['metadata'] = {
                'estimated_time': estimated_time,
                'estimated_completion': (
                    datetime.now().timestamp() + estimated_time
                ),
            }
        
        return response
    
    def format_error_response(
        self,
        error_message: str,
        error_code: Optional[str] = None,
        suggestions: Optional[List[str]] = None
    ) -> Dict:
        """
        Format error response with helpful information
        
        Args:
            error_message: Error description
            error_code: Error code for frontend handling
            suggestions: List of suggestions to fix the error
            
        Returns:
            dict: Formatted error response
        """
        return {
            'type': 'error',
            'content': error_message,
            'error_code': error_code or 'UNKNOWN_ERROR',
            'suggestions': suggestions or [],
            'timestamp': datetime.now().isoformat(),
        }
    
    def format_multi_result_response(
        self,
        results: List[Dict],
        description: str
    ) -> Dict:
        """
        Format response with multiple results (e.g., variations)
        
        Args:
            results: List of result items
            description: Description of the results
            
        Returns:
            dict: Formatted multi-result response
        """
        return {
            'type': 'gallery',
            'content': {
                'description': description,
                'items': results,
                'total_count': len(results),
            },
            'timestamp': datetime.now().isoformat(),
        }
    
    def format_intent_confirmation(
        self,
        detected_intent: str,
        confidence: float,
        refined_prompt: str,
        original_prompt: str
    ) -> Dict:
        """
        Format response to confirm detected intent with user
        
        Useful when confidence is medium (0.4-0.7)
        
        Returns:
            dict: Formatted confirmation request
        """
        intent_labels = {
            'image_generation': '🎨 Generate new image',
            'face_swap': '😊 Swap faces',
            'background_removal': '🖼️ Remove background',
            'image_edit': '✏️ Edit image',
            'style_transfer': '🎭 Apply artistic style',
        }
        
        return {
            'type': 'confirmation',
            'content': f"I understand you want to: **{intent_labels.get(detected_intent, detected_intent)}**",
            'metadata': {
                'detected_intent': detected_intent,
                'confidence': confidence,
                'original_prompt': original_prompt,
                'refined_prompt': refined_prompt,
            },
            'actions': [
                {
                    'id': 'confirm',
                    'label': 'Yes, proceed',
                    'primary': True,
                },
                {
                    'id': 'clarify',
                    'label': 'Let me clarify',
                    'primary': False,
                },
            ],
            'timestamp': datetime.now().isoformat(),
        }
    
    def add_suggestions(self, response: Dict, suggestions: List[str]) -> Dict:
        """
        Add follow-up suggestions to response
        
        Args:
            response: Base response dict
            suggestions: List of suggestion texts
            
        Returns:
            dict: Response with suggestions added
        """
        response['suggestions'] = [
            {
                'text': suggestion,
                'action': 'send_message',
            }
            for suggestion in suggestions
        ]
        return response
    
    def create_chat_message_data(
        self,
        message_type: str,
        original_prompt: str,
        refined_prompt: str,
        intent: str,
        confidence: float,
        response_data: Dict,
        processing_time: float,
        generated_image: Optional[ContentFile] = None
    ) -> Dict:
        """
        Create complete chat message data for database storage
        
        Returns:
            dict: Complete message data
        """
        return {
            'message_type': message_type,
            'original_prompt': original_prompt,
            'refined_prompt': refined_prompt,
            'detected_intent': intent,
            'intent_confidence': confidence,
            'response_data': response_data,
            'processing_time': processing_time,
            'generated_image': generated_image,
            'status': 'completed',
        }
    
    def generate_follow_up_suggestions(self, intent: str, success: bool) -> List[str]:
        """
        Generate contextual follow-up suggestions
        
        Args:
            intent: The intent that was processed
            success: Whether the operation succeeded
            
        Returns:
            list: List of suggestion texts
        """
        if intent == 'image_generation' and success:
            return [
                "Create variations of this image",
                "Generate in different style",
                "Make it higher resolution",
                "Edit this image",
            ]
        elif intent == 'face_swap' and success:
            return [
                "Try with another face",
                "Adjust blending",
                "Remove background from result",
            ]
        elif not success:
            return [
                "Try with different prompt",
                "Upload a different image",
                "View examples",
            ]
        
        return [
            "Generate a new image",
            "Edit an existing image",
            "Browse gallery",
        ]
