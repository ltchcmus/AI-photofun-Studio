"""
AI Gateway Views

Main API endpoints for chat-based AI interactions
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import ChatSession, ChatMessage
from .serializers import ChatRequestSerializer, ChatResponseSerializer
from .pipeline import get_pipeline

logger = logging.getLogger(__name__)


class ChatGatewayViewSet(viewsets.ViewSet):
    """
    ViewSet for chat-based AI interactions
    
    Endpoints:
    - POST /chat/ - Process a chat message
    - GET /sessions/ - List user's chat sessions
    - GET /sessions/{id}/ - Get session details with messages
    - DELETE /sessions/{id}/ - Delete a session
    """
    
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pipeline = get_pipeline()
    
    @action(detail=False, methods=['post'], url_path='chat')
    def chat(self, request):
        """
        Process a chat message through the AI pipeline
        
        Request Body:
        - message: str (required) - User's message/prompt
        - session_id: str (optional) - Chat session ID
        - image: file (optional) - Uploaded image for processing
        - context: dict (optional) - Additional context data
        
        Returns:
        - ChatResponseSerializer with formatted response
        """
        # Validate request
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid request',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        message = data['message']
        session_id = data.get('session_id')
        uploaded_image = request.FILES.get('image')
        context = data.get('context', {})
        
        logger.info(f"Processing chat message: {message[:100]}")
        
        try:
            # Get or create session
            if session_id:
                try:
                    session = ChatSession.objects.get(session_id=session_id)
                except ChatSession.DoesNotExist:
                    session = ChatSession.objects.create(session_id=session_id)
            else:
                session = ChatSession.objects.create()
                session_id = session.session_id
            
            # Save user message
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=message,
                image=uploaded_image if uploaded_image else None
            )
            
            # Process through pipeline
            pipeline_result = self.pipeline.process_message(
                message=message,
                session_id=session_id,
                uploaded_image=uploaded_image,
                context=context
            )
            
            # Save assistant response
            assistant_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=pipeline_result.get('message', ''),
                metadata=pipeline_result.get('metadata', {})
            )
            
            # Save generated image if present
            if 'image_bytes' in pipeline_result:
                from django.core.files.base import ContentFile
                image_file = ContentFile(
                    pipeline_result['image_bytes'],
                    name=f"generated_{assistant_message.id}.png"
                )
                assistant_message.image = image_file
                assistant_message.save()
                
                # Update response with actual image URL
                if 'data' in pipeline_result and 'image_url' in pipeline_result['data']:
                    pipeline_result['data']['image_url'] = assistant_message.image.url
            
            # Add session_id to response
            pipeline_result['session_id'] = session_id
            pipeline_result['message_id'] = str(assistant_message.id)
            
            # Validate response format
            response_serializer = ChatResponseSerializer(data=pipeline_result)
            if not response_serializer.is_valid():
                logger.error(f"Invalid pipeline response: {response_serializer.errors}")
                return Response(
                    {
                        'error': 'Invalid response format',
                        'details': response_serializer.errors
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                response_serializer.validated_data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'Failed to process message',
                    'message': str(e),
                    'type': 'error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='sessions')
    def list_sessions(self, request):
        """
        List all chat sessions
        
        Returns:
        - List of sessions with basic info
        """
        try:
            sessions = ChatSession.objects.all().order_by('-updated_at')[:50]
            
            sessions_data = []
            for session in sessions:
                last_message = session.messages.order_by('-created_at').first()
                
                sessions_data.append({
                    'session_id': session.session_id,
                    'created_at': session.created_at.isoformat(),
                    'updated_at': session.updated_at.isoformat(),
                    'message_count': session.messages.count(),
                    'last_message': last_message.content[:100] if last_message else None,
                    'metadata': session.metadata,
                })
            
            return Response(
                {
                    'sessions': sessions_data,
                    'total': len(sessions_data)
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error listing sessions: {str(e)}")
            return Response(
                {'error': 'Failed to list sessions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='')
    def get_session(self, request, pk=None):
        """
        Get session details with all messages
        
        Args:
            pk: session_id
            
        Returns:
        - Session data with messages
        """
        try:
            session = ChatSession.objects.get(session_id=pk)
            messages = session.messages.order_by('created_at')
            
            messages_data = []
            for msg in messages:
                msg_data = {
                    'id': str(msg.id),
                    'role': msg.role,
                    'content': msg.content,
                    'created_at': msg.created_at.isoformat(),
                    'metadata': msg.metadata,
                }
                
                if msg.image:
                    msg_data['image_url'] = msg.image.url
                
                messages_data.append(msg_data)
            
            return Response(
                {
                    'session_id': session.session_id,
                    'created_at': session.created_at.isoformat(),
                    'updated_at': session.updated_at.isoformat(),
                    'metadata': session.metadata,
                    'messages': messages_data,
                },
                status=status.HTTP_200_OK
            )
            
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return Response(
                {'error': 'Failed to get session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='')
    def delete_session(self, request, pk=None):
        """
        Delete a chat session and all its messages
        
        Args:
            pk: session_id
        """
        try:
            session = ChatSession.objects.get(session_id=pk)
            session.delete()
            
            return Response(
                {'message': 'Session deleted successfully'},
                status=status.HTTP_200_OK
            )
            
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            return Response(
                {'error': 'Failed to delete session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def capabilities(self, request):
        """
        Get available AI capabilities and their descriptions
        
        Returns:
        - List of available features
        """
        capabilities = [
            {
                'id': 'image_generation',
                'name': 'Image Generation',
                'description': 'Generate images from text descriptions',
                'requires_image': False,
                'example': 'Create a portrait of a cat wearing a crown',
            },
            {
                'id': 'face_swap',
                'name': 'Face Swap',
                'description': 'Swap faces between two images',
                'requires_image': True,
                'example': 'Swap my face with this photo',
            },
            {
                'id': 'background_removal',
                'name': 'Background Removal',
                'description': 'Remove background from images',
                'requires_image': True,
                'example': 'Remove the background from this image',
            },
            {
                'id': 'image_edit',
                'name': 'Image Editing',
                'description': 'Edit and modify images',
                'requires_image': True,
                'example': 'Make this image brighter and more colorful',
            },
            {
                'id': 'style_transfer',
                'name': 'Style Transfer',
                'description': 'Apply artistic styles to images',
                'requires_image': True,
                'example': 'Apply Van Gogh style to this photo',
            },
        ]
        
        return Response(
            {'capabilities': capabilities},
            status=status.HTTP_200_OK
        )
