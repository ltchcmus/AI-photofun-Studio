# conversation/views.py
from rest_framework.views import APIView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from core import ResponseFormatter, APIResponse
import json
import asyncio

from .service import (
    create_or_get_session,
    get_conversation,
    delete_session,
    process_message,
)
from .serializers import MessageInputSerializer


def clean_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop('_id', None)
    for m in doc.get('messages', []):
        m.pop('_id', None)
    return doc


@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionListView(APIView):
    """POST /v1/chat/sessions {userId}"""

    def post(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return APIResponse.error(message='Invalid JSON')
        
        user_id = data.get('user_id') or data.get('userId')
        if not user_id:
            return APIResponse.error(message='user_id is required')

        session = create_or_get_session(user_id)
        result = clean_doc(session)
        return APIResponse.success(result=result)


@method_decorator(csrf_exempt, name='dispatch')
class ChatMessageView(APIView):
    """POST /v1/chat/sessions/{session_id}/messages"""

    def post(self, request, session_id):
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return APIResponse.error(message='Invalid JSON')

        print("ChatMessageView - POST request:", data)

        serializer = MessageInputSerializer(data=data)
        if not serializer.is_valid():
            return APIResponse.error(message=serializer.errors)

        result = process_message(session_id, serializer.validated_data)
        # If service returned a formatter dict, wrap into APIResponse
        if isinstance(result, dict) and 'code' in result and 'message' in result:
            return APIResponse.success(result=result.get('result'))
        return APIResponse.success(result=result)


@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionDetailView(APIView):
    """GET /v1/chat/sessions/{session_id} and DELETE"""

    def get(self, request, session_id):
        convo = get_conversation(session_id)
        if not convo:
            return APIResponse.error()

        result = clean_doc(convo)
        return APIResponse.success(result=result)

    def delete(self, request, session_id):
        res = delete_session(session_id)
        if not res.deleted_count:
            return APIResponse.error()

        return APIResponse.success()

@method_decorator(csrf_exempt, name='dispatch')
class ChatMessageDetailView(APIView):
    """GET /v1/chat/sessions/{session_id}/{message_id}"""

    def get(self, request, session_id, message_id):
        print("ChatMessageDetailView - GET request:", request)
        convo = get_conversation(session_id)
        if not convo:
            return APIResponse.error(message='Conversation not found')

        messages = convo.get("messages", [])
        target = next(
            (m for m in reversed(messages) if m.get("message_id") == message_id),
            None
        )

        if not target:
            return APIResponse.error(message='Message not found')

        target.pop("_id", None)

        return APIResponse.success(result=target)

from django.shortcuts import render

def chat_client(request):
    return render(request, "conversation/chat.html")