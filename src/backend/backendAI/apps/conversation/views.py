# conversation/views.py
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import asyncio

from .service import (
    create_or_get_session,
    get_conversation,
    delete_session,
    process_message,
)
from .serializers import MessageSerializer


def clean_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop('_id', None)
    for m in doc.get('messages', []):
        m.pop('_id', None)
    return doc


@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionListView(View):
    """POST /v1/chat/sessions {userId}"""

    def post(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        user_id = data.get('userId')
        if not user_id:
            return JsonResponse({'error': 'userId is required'}, status=400)

        session = create_or_get_session(user_id)
        payload = {"session_id": session["session_id"]}
        return JsonResponse(payload, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class ChatMessageView(View):
    """POST /v1/chat/sessions/{session_id}/messages"""

    async def post(self, request, session_id):
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        serializer = MessageSerializer(data=data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        result = await process_message(session_id, serializer.validated_data)
        return JsonResponse(result, status=200)


@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionDetailView(View):
    """GET /v1/chat/sessions/{session_id} and DELETE"""

    def get(self, request, session_id):
        convo = get_conversation(session_id)
        if not convo:
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(clean_doc(convo), status=200)

    def delete(self, request, session_id):
        res = delete_session(session_id)
        if not res.deleted_count:
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse({}, status=204)
