"""
AI Gateway Pipeline

Orchestrates the entire flow:
1. Classify intent
2. Refine prompt (via Prompt Refinement Service)
3. Route to appropriate service (image generation, face swap, etc.)
4. Format response
5. Return to frontend
"""
import logging
import time
import uuid
import requests
from typing import Dict, Tuple, Optional
from django.core.files.base import ContentFile
from django.conf import settings

from .services import (
    IntentClassificationService,
    ResponseHandlerService,
)

logger = logging.getLogger(__name__)


class AIGatewayPipeline:
    """Main pipeline controller for AI Gateway"""
    
    def __init__(self):
        # Initialize services (only orchestration services, not business logic)
        self.intent_classifier = IntentClassificationService()
        self.response_handler = ResponseHandlerService()
        
        # URL for Prompt Refinement Service
        self.prompt_refinement_url = self._get_prompt_refinement_url()
        
        logger.info("AI Gateway Pipeline initialized")
    
    def _get_prompt_refinement_url(self) -> str:
        """Get the URL for prompt refinement service"""
        # In production, this might be a different host/port
        # For now, use internal Django routing
        base_url = getattr(settings, 'INTERNAL_API_BASE_URL', 'http://localhost:8000')
        return f"{base_url}/api/v1/prompt-refinement"
    
    def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        uploaded_image = None,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Main pipeline entry point
        
        Args:
            message: User message/prompt
            session_id: Chat session ID
            uploaded_image: Optional uploaded image file
            context: Additional context data
            
        Returns:
            dict: Complete response with all data
        """
        start_time = time.time()
        pipeline_id = str(uuid.uuid4())[:8]
        
        logger.info(f"[{pipeline_id}] Pipeline started - Message: {message[:100]}")
        
        try:
            # Step 1: Classify Intent
            logger.info(f"[{pipeline_id}] Step 1: Classifying intent...")
            intent, intent_confidence = self.intent_classifier.classify_intent(
                message,
                has_image=(uploaded_image is not None),
                context=context
            )
            logger.info(f"[{pipeline_id}] Intent: {intent} (confidence: {intent_confidence:.2f})")
            
            # Step 2: Validate and Refine Prompt (via Prompt Refinement Service)
            logger.info(f"[{pipeline_id}] Step 2: Calling Prompt Refinement Service...")
            refinement_result = self._call_prompt_refinement_service(
                message,
                context
            )
            
            if not refinement_result['success']:
                return self._create_error_response(
                    refinement_result.get('error', 'Failed to refine prompt'),
                    pipeline_id
                )
            
            refined_prompt = refinement_result['refined_prompt']
            refine_confidence = refinement_result.get('confidence_score', 0.5)
            logger.info(f"[{pipeline_id}] Refined prompt: {refined_prompt[:100]}")
            
            # Step 3: Route to appropriate service
            logger.info(f"[{pipeline_id}] Step 3: Routing to service '{intent}'...")
            service_result = self._route_to_service(
                intent,
                refined_prompt,
                uploaded_image,
                context
            )
            
            # Step 4: Format Response
            logger.info(f"[{pipeline_id}] Step 4: Formatting response...")
            formatted_response = self._format_final_response(
                intent,
                message,
                refined_prompt,
                intent_confidence,
                service_result
            )
            
            # Add pipeline metadata
            total_time = time.time() - start_time
            formatted_response['pipeline_metadata'] = {
                'pipeline_id': pipeline_id,
                'total_processing_time': total_time,
                'intent': intent,
                'intent_confidence': intent_confidence,
                'refine_confidence': refine_confidence,
                'session_id': session_id,
            }
            
            logger.info(f"[{pipeline_id}] Pipeline completed in {total_time:.2f}s")
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"[{pipeline_id}] Pipeline error: {str(e)}", exc_info=True)
            return self._create_error_response(
                f"An error occurred while processing your request: {str(e)}",
                pipeline_id
            )
    
    def _call_prompt_refinement_service(
        self,
        prompt: str,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Call the Prompt Refinement Service via internal API
        
        Args:
            prompt: Original user prompt
            context: Additional context
            
        Returns:
            dict: {
                'success': bool,
                'refined_prompt': str,
                'negative_prompt': str,
                'confidence_score': float,
                'error': str (if failed)
            }
        """
        try:
            # Use direct service call instead of HTTP for better performance
            # Import here to avoid circular imports
            from apps.prompt_refinement.service import get_service
            
            service = get_service()
            
            # Call the service directly
            result = service.refine_prompt(
                original_prompt=prompt,
                context=context,
                method='auto',
                save_to_db=True
            )
            
            # Extract negative prompt
            _, negative_prompt = service.extract_negative_prompt(result['refined_prompt'])
            
            return {
                'success': True,
                'refined_prompt': result['refined_prompt'],
                'negative_prompt': negative_prompt,
                'confidence_score': result['confidence_score'],
                'method_used': result['method_used'],
                'suggestions': result.get('suggestions', []),
            }
            
        except Exception as e:
            logger.error(f"Error calling prompt refinement service: {str(e)}", exc_info=True)
            # Fallback: return original prompt
            return {
                'success': True,
                'refined_prompt': prompt,
                'negative_prompt': '',
                'confidence_score': 0.5,
                'error': str(e)
            }
    
    def _route_to_service(
        self,
        intent: str,
        refined_prompt: str,
        uploaded_image = None,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Route to appropriate service based on intent
        
        Returns:
            dict: Service result with data
        """
        if intent == 'image_generation':
            return self._handle_image_generation(refined_prompt, context)
        
        elif intent == 'face_swap':
            if not uploaded_image:
                return {
                    'success': False,
                    'error': 'Face swap requires an uploaded image'
                }
            return self._handle_face_swap(refined_prompt, uploaded_image, context)
        
        elif intent == 'background_removal':
            if not uploaded_image:
                return {
                    'success': False,
                    'error': 'Background removal requires an uploaded image'
                }
            return self._handle_background_removal(uploaded_image, context)
        
        elif intent == 'image_edit':
            if not uploaded_image:
                return {
                    'success': False,
                    'error': 'Image editing requires an uploaded image'
                }
            return self._handle_image_edit(refined_prompt, uploaded_image, context)
        
        elif intent == 'style_transfer':
            if not uploaded_image:
                return {
                    'success': False,
                    'error': 'Style transfer requires an uploaded image'
                }
            return self._handle_style_transfer(refined_prompt, uploaded_image, context)
        
        else:
            # General/unknown intent
            return {
                'success': True,
                'type': 'text',
                'message': self._generate_helpful_response(intent, refined_prompt)
            }
    
    def _handle_image_generation(self, prompt: str, context: Optional[Dict]) -> Dict:
        """Handle image generation request by calling Image Generation Service"""
        try:
            # Import service
            from apps.image_generation.service import get_service
            service = get_service()
            
            # Extract parameters from context
            params = {
                'width': context.get('width', 512) if context else 512,
                'height': context.get('height', 512) if context else 512,
                'num_inference_steps': context.get('steps', 50) if context else 50,
                'guidance_scale': context.get('guidance_scale', 7.5) if context else 7.5,
            }
            
            # Call image generation service
            result = service.generate_image(
                prompt=prompt,
                negative_prompt=context.get('negative_prompt', '') if context else '',
                save_to_db=True,
                **params
            )
            
            if result['success']:
                return {
                    'success': True,
                    'type': 'image',
                    'image_url': result.get('image_url'),
                    'metadata': result.get('metadata', {}),
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Image generation failed')
                }

            
            return {
                'success': True,
                'type': 'image',
                'image_bytes': image_bytes,
                'metadata': metadata,
            }
            
        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to generate image: {str(e)}"
            }
    
    def _handle_face_swap(self, prompt: str, image, context: Optional[Dict]) -> Dict:
        """Handle face swap request"""
        # TODO: Integrate with face_swap app
        return {
            'success': False,
            'error': 'Face swap integration coming soon'
        }
    
    def _handle_background_removal(self, image, context: Optional[Dict]) -> Dict:
        """Handle background removal request"""
        # TODO: Integrate with background_removal app
        return {
            'success': False,
            'error': 'Background removal integration coming soon'
        }
    
    def _handle_image_edit(self, prompt: str, image, context: Optional[Dict]) -> Dict:
        """Handle image editing request"""
        # TODO: Integrate with image_processing app
        return {
            'success': False,
            'error': 'Image editing integration coming soon'
        }
    
    def _handle_style_transfer(self, prompt: str, image, context: Optional[Dict]) -> Dict:
        """Handle style transfer request"""
        # TODO: Integrate with style_transfer app
        return {
            'success': False,
            'error': 'Style transfer integration coming soon'
        }
    
    def _format_final_response(
        self,
        intent: str,
        original_prompt: str,
        refined_prompt: str,
        confidence: float,
        service_result: Dict
    ) -> Dict:
        """Format the final response for frontend"""
        
        if not service_result.get('success'):
            # Error response
            return self.response_handler.format_error_response(
                error_message=service_result.get('error', 'Unknown error'),
                error_code='SERVICE_ERROR',
                suggestions=self.response_handler.generate_follow_up_suggestions(
                    intent, False
                )
            )
        
        # Success response
        result_type = service_result.get('type')
        
        if result_type == 'image':
            # Save image and get URL (placeholder for now)
            image_url = '/media/generated/placeholder.png'  # TODO: Save actual image
            
            response = self.response_handler.format_image_response(
                image_url=image_url,
                prompt=refined_prompt,
                metadata=service_result.get('metadata', {})
            )
            
            # Add follow-up suggestions
            suggestions = self.response_handler.generate_follow_up_suggestions(
                intent, True
            )
            response = self.response_handler.add_suggestions(response, suggestions)
            
            return response
        
        elif result_type == 'text':
            return self.response_handler.format_text_response(
                text=service_result.get('message', ''),
                metadata={'intent': intent, 'confidence': confidence}
            )
        
        else:
            return self.response_handler.format_text_response(
                text="I've processed your request.",
                metadata={'intent': intent}
            )
    
    def _create_error_response(self, error_message: str, pipeline_id: str) -> Dict:
        """Create standardized error response"""
        return self.response_handler.format_error_response(
            error_message=error_message,
            error_code='PIPELINE_ERROR',
            suggestions=[
                "Try rephrasing your message",
                "Check if you need to upload an image",
                "View examples of what I can do",
            ]
        )
    
    def _generate_helpful_response(self, intent: str, prompt: str) -> str:
        """Generate helpful text response for general queries"""
        
        responses = {
            'general': """I'm an AI assistant that can help you with:
            
🎨 **Image Generation** - Create images from text descriptions
😊 **Face Swap** - Swap faces between photos
🖼️ **Background Removal** - Remove backgrounds from images
✏️ **Image Editing** - Modify and enhance your images
🎭 **Style Transfer** - Apply artistic styles to images

What would you like to create today?""",
        }
        
        return responses.get(intent, responses['general'])
    
    def estimate_processing_time(self, intent: str, params: Dict) -> float:
        """
        Estimate total processing time for request
        
        Returns:
            float: Estimated time in seconds
        """
        base_times = {
            'image_generation': 10.0,
            'face_swap': 5.0,
            'background_removal': 3.0,
            'image_edit': 2.0,
            'style_transfer': 8.0,
        }
        
        base_time = base_times.get(intent, 5.0)
        
        # Add refinement time
        refine_time = 1.0
        
        # Add routing overhead
        overhead = 0.5
        
        return base_time + refine_time + overhead


# Global pipeline instance
_pipeline_instance = None

def get_pipeline() -> AIGatewayPipeline:
    """Get singleton pipeline instance"""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = AIGatewayPipeline()
    return _pipeline_instance
