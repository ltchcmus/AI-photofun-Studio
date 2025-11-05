# conversation/views.py
"""
Conversation API views.

Note: We avoid importing DRF's APIView at module level to prevent requiring
Django settings during import. Instead, we use a lazy import pattern.
"""
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .serializers import MessageSerializer, ConversationSerializer
from .service import create_or_get_session, add_message, get_conversation
from .service import list_sessions, edit_message, delete_message


def clean_conversation_for_response(doc: dict) -> dict:
    """Remove internal MongoDB fields before returning to client."""
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop('_id', None)
    # Remove ObjectId from messages if present
    for m in doc.get('messages', []):
        m.pop('_id', None)
    return doc


@method_decorator(csrf_exempt, name='dispatch')
class ConversationListView(View):
    """
    GET: List all sessions (summary only, no messages).
    POST: Create a new conversation session.
    
    GET params: ?limit=50&skip=0
    POST body: {"session_id": "unique-session-id"}
    """
    
    def get(self, request):
        """List all conversation sessions with pagination."""
        try:
            limit = int(request.GET.get('limit', 50))
            skip = int(request.GET.get('skip', 0))
            limit = min(limit, 100)  # Max 100 items per request
        except (ValueError, TypeError):
            return JsonResponse(
                {'error': 'Invalid limit or skip parameter'}, 
                status=400
            )
        
        sessions = list_sessions(limit=limit, skip=skip)
        for doc in sessions:
            doc.pop('_id', None)
        
        return JsonResponse({
            'count': len(sessions),
            'limit': limit,
            'skip': skip,
            'results': sessions
        }, status=200)
    
    def post(self, request):
        """Create a new conversation session."""
        try:
            data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        session_id = data.get('session_id')
        if not session_id:
            return JsonResponse(
                {'error': 'session_id is required'}, 
                status=400
            )
        
        session = create_or_get_session(session_id)
        payload = clean_conversation_for_response(session)
        return JsonResponse(payload, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class ConversationDetailView(View):
    """
    GET: Retrieve a specific conversation with all messages.
    """
    
    def get(self, request, session_id):
        """Get conversation details by session_id."""
        convo = get_conversation(session_id)
        if not convo:
            return JsonResponse(
                {'error': 'Conversation not found'}, 
                status=404
            )
        
        payload = clean_conversation_for_response(convo)
        serializer = ConversationSerializer(payload)
        return JsonResponse(serializer.data, status=200)


@method_decorator(csrf_exempt, name='dispatch')
class ConversationMessageView(View):
    """
    POST: Add a new message to a conversation.
    
    POST body:
    {
        "role": "user",
        "content": "Your message here",
        "image_url": "https://...",  // optional
        "selected_prompts": ["prompt1", "prompt2"],  // optional
        "metadata": {}  // optional
    }
    """
    
    def post(self, request, session_id):
        """Add a message to the conversation."""
        try:
            data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        serializer = MessageSerializer(data=data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)
        
        message = serializer.validated_data
        create_or_get_session(session_id)
        created = add_message(session_id, message)
        
        return JsonResponse(created, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class MessageDetailView(View):
    """
    PATCH: Edit a specific message.
    DELETE: Delete a specific message.
    
    PATCH body: {"content": "updated text", "metadata": {...}}
    """
    
    def patch(self, request, session_id, message_id):
        """Edit a message in the conversation."""
        try:
            updates = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        if not updates:
            return JsonResponse(
                {'error': 'No updates provided'}, 
                status=400
            )
        
        updated = edit_message(session_id, message_id, updates)
        if not updated:
            return JsonResponse(
                {'error': 'Message or conversation not found'}, 
                status=404
            )
        
        payload = clean_conversation_for_response(updated)
        return JsonResponse(payload, status=200)
    
    def delete(self, request, session_id, message_id):
        """Delete a message from the conversation."""
        updated = delete_message(session_id, message_id)
        if not updated:
            return JsonResponse(
                {'error': 'Message or conversation not found'}, 
                status=404
            )
        
        payload = clean_conversation_for_response(updated)
        return JsonResponse(payload, status=200)
