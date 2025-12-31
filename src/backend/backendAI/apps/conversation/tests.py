# conversation/tests.py
"""
Unit tests for Conversation app

Tests cover:
- Serializer validation
- View layer with mocked service functions
- Helper functions like clean_doc
"""
from django.test import TestCase, RequestFactory
from rest_framework.test import APITestCase
from unittest.mock import patch, MagicMock
from datetime import datetime
import json

from .serializers import MessageInputSerializer, ConversationSerializer
from .views import ChatSessionListView, ChatSessionDetailView, ChatMessageView, clean_doc


class CleanDocFunctionTest(TestCase):
    """Test the clean_doc helper function"""

    def test_clean_doc_removes_id(self):
        """Should remove _id from document"""
        doc = {'_id': 'mongo_id_123', 'session_id': 'session_123', 'messages': []}
        result = clean_doc(doc)
        
        self.assertNotIn('_id', result)
        self.assertEqual(result['session_id'], 'session_123')

    def test_clean_doc_removes_message_ids(self):
        """Should remove _id from nested messages"""
        doc = {
            '_id': 'mongo_id_123',
            'session_id': 'session_123',
            'messages': [
                {'_id': 'msg_id_1', 'message_id': 'uuid_1', 'prompt': 'Hello'},
                {'_id': 'msg_id_2', 'message_id': 'uuid_2', 'prompt': 'World'}
            ]
        }
        result = clean_doc(doc)
        
        self.assertNotIn('_id', result)
        for msg in result['messages']:
            self.assertNotIn('_id', msg)
            self.assertIn('message_id', msg)

    def test_clean_doc_handles_none(self):
        """Should handle None input"""
        result = clean_doc(None)
        self.assertIsNone(result)

    def test_clean_doc_handles_empty_messages(self):
        """Should handle document with no messages key"""
        doc = {'_id': 'mongo_id_123', 'session_id': 'session_123'}
        result = clean_doc(doc)
        
        self.assertNotIn('_id', result)
        self.assertNotIn('messages', result)


class MessageInputSerializerTest(TestCase):
    """Test MessageInputSerializer validation"""

    def test_valid_message_with_prompt(self):
        """Should validate message with prompt"""
        data = {
            'user_id': 'user_123',
            'prompt': 'Generate a beautiful sunset'
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['prompt'], 'Generate a beautiful sunset')

    def test_valid_message_with_selected_messages(self):
        """Should validate message with selected_messages instead of prompt"""
        data = {
            'user_id': 'user_123',
            'prompt': '',
            'selected_messages': ['msg_id_1', 'msg_id_2']
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())

    def test_invalid_message_missing_user_id(self):
        """Should fail validation without user_id"""
        data = {
            'prompt': 'Generate a beautiful sunset'
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('user_id', serializer.errors)

    def test_invalid_message_missing_prompt_and_selected(self):
        """Should fail validation without prompt or selected_messages"""
        data = {
            'user_id': 'user_123'
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())

    def test_valid_message_with_additional_images(self):
        """Should validate message with additional_images"""
        data = {
            'user_id': 'user_123',
            'prompt': 'Apply style transfer',
            'additional_images': ['https://example.com/style.jpg']
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(len(serializer.validated_data['additional_images']), 1)

    def test_valid_message_with_feature_params(self):
        """Should validate message with feature_params"""
        data = {
            'user_id': 'user_123',
            'prompt': 'Upscale image',
            'feature_params': {'flavor': 'x2'}
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['feature_params']['flavor'], 'x2')

    def test_valid_message_with_image_url(self):
        """Should validate message with direct image_url"""
        data = {
            'user_id': 'user_123',
            'prompt': 'Remove background',
            'image_url': 'https://example.com/image.jpg'
        }
        serializer = MessageInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['image_url'], 'https://example.com/image.jpg')


class ChatSessionListViewTest(TestCase):
    """Test ChatSessionListView (POST /v1/chat/sessions)"""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = ChatSessionListView.as_view()

    @patch('apps.conversation.views.create_or_get_session')
    def test_create_session_success(self, mock_create):
        """Should create session successfully"""
        mock_create.return_value = {
            '_id': 'mongo_id',
            'session_id': 'session_123',
            'user_id': 'user_123',
            'messages': []
        }
        
        request = self.factory.post(
            '/v1/chat/sessions/',
            data=json.dumps({'user_id': 'user_123'}),
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)
        self.assertIn('result', response_data)
        self.assertEqual(response_data['result']['session_id'], 'session_123')

    def test_create_session_missing_user_id(self):
        """Should return error when user_id is missing"""
        request = self.factory.post(
            '/v1/chat/sessions/',
            data=json.dumps({}),
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)

    def test_create_session_invalid_json(self):
        """Should return error for invalid JSON"""
        request = self.factory.post(
            '/v1/chat/sessions/',
            data='invalid json',
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)


class ChatSessionDetailViewTest(TestCase):
    """Test ChatSessionDetailView (GET/DELETE /v1/chat/sessions/{session_id})"""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = ChatSessionDetailView.as_view()

    @patch('apps.conversation.views.get_conversation')
    def test_get_session_success(self, mock_get):
        """Should get session successfully"""
        mock_get.return_value = {
            '_id': 'mongo_id',
            'session_id': 'session_123',
            'user_id': 'user_123',
            'messages': [
                {'_id': 'msg_id', 'message_id': 'uuid_1', 'prompt': 'Hello'}
            ]
        }
        
        request = self.factory.get('/v1/chat/sessions/session_123/')
        response = self.view(request, session_id='session_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)
        # Check _id was removed by clean_doc
        self.assertNotIn('_id', response_data['result'])

    @patch('apps.conversation.views.get_conversation')
    def test_get_session_not_found(self, mock_get):
        """Should return error when session not found"""
        mock_get.return_value = None
        
        request = self.factory.get('/v1/chat/sessions/nonexistent/')
        response = self.view(request, session_id='nonexistent')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)

    @patch('apps.conversation.views.delete_session')
    def test_delete_session_success(self, mock_delete):
        """Should delete session successfully"""
        mock_delete.return_value = MagicMock(deleted_count=1)
        
        request = self.factory.delete('/v1/chat/sessions/session_123/')
        response = self.view(request, session_id='session_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)

    @patch('apps.conversation.views.delete_session')
    def test_delete_session_not_found(self, mock_delete):
        """Should return error when session doesn't exist"""
        mock_delete.return_value = MagicMock(deleted_count=0)
        
        request = self.factory.delete('/v1/chat/sessions/nonexistent/')
        response = self.view(request, session_id='nonexistent')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)


class ChatMessageViewTest(TestCase):
    """Test ChatMessageView (POST /v1/chat/sessions/{session_id}/messages)"""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = ChatMessageView.as_view()

    @patch('apps.conversation.views.process_message')
    def test_send_message_success(self, mock_process):
        """Should send message and return processing status"""
        mock_process.return_value = {
            'status': 'PROCESSING',
            'message_id': 'msg_uuid_123'
        }
        
        request = self.factory.post(
            '/v1/chat/sessions/session_123/messages/',
            data=json.dumps({
                'user_id': 'user_123',
                'prompt': 'Generate a beautiful sunset'
            }),
            content_type='application/json'
        )
        
        response = self.view(request, session_id='session_123')
        
        self.assertEqual(response.status_code, 200)

    def test_send_message_invalid_json(self):
        """Should return error for invalid JSON"""
        request = self.factory.post(
            '/v1/chat/sessions/session_123/messages/',
            data='invalid json',
            content_type='application/json'
        )
        
        response = self.view(request, session_id='session_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)

    def test_send_message_missing_required_fields(self):
        """Should return validation error for missing fields"""
        request = self.factory.post(
            '/v1/chat/sessions/session_123/messages/',
            data=json.dumps({'prompt': 'Hello'}),  # Missing user_id
            content_type='application/json'
        )
        
        response = self.view(request, session_id='session_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)
