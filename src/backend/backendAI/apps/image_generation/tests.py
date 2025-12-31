# image_generation/tests.py
"""
Unit tests for Image Generation app

Tests cover:
- Serializer validation
- View layer with mocked AI services
- Status polling logic
"""
from django.test import TestCase, RequestFactory
from rest_framework.test import APITestCase
from unittest.mock import patch, MagicMock
import json

from .serializers import ImageGenerationInputSerializer
from .views import ImageGenerationView, ImageGenerationStatusView
from .services import ImageGenerationError


class ImageGenerationInputSerializerTest(TestCase):
    """Test ImageGenerationInputSerializer validation"""

    def test_valid_input_minimal(self):
        """Should validate with minimal required fields"""
        data = {
            'prompt': 'A beautiful sunset over mountains',
            'user_id': 'user_123'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['prompt'], 'A beautiful sunset over mountains')
        self.assertEqual(serializer.validated_data['user_id'], 'user_123')

    def test_valid_input_with_aspect_ratio(self):
        """Should validate with optional aspect_ratio"""
        data = {
            'prompt': 'A beautiful sunset',
            'user_id': 'user_123',
            'aspect_ratio': 'landscape_16_9'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['aspect_ratio'], 'landscape_16_9')

    def test_valid_input_with_style_reference_url(self):
        """Should validate with style reference URL"""
        data = {
            'prompt': 'Apply this style to a sunset',
            'user_id': 'user_123',
            'style_reference_url': 'https://example.com/style.jpg'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['style_reference_url'], 
            'https://example.com/style.jpg'
        )

    def test_invalid_missing_prompt(self):
        """Should fail validation without prompt"""
        data = {
            'user_id': 'user_123'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('prompt', serializer.errors)

    def test_invalid_missing_user_id(self):
        """Should fail validation without user_id"""
        data = {
            'prompt': 'A beautiful sunset'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('user_id', serializer.errors)

    def test_prompt_max_length(self):
        """Should fail validation when prompt exceeds max length"""
        data = {
            'prompt': 'A' * 2001,  # Exceeds 2000 char limit
            'user_id': 'user_123'
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('prompt', serializer.errors)

    def test_valid_input_with_all_optional_fields(self):
        """Should validate with all optional fields"""
        data = {
            'prompt': 'A beautiful sunset',
            'user_id': 'user_123',
            'aspect_ratio': 'square_1_1',
            'style_reference_url': 'https://example.com/style.jpg',
            'style_reference_data': 'base64encodeddata=='
        }
        serializer = ImageGenerationInputSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())


class ImageGenerationViewTest(TestCase):
    """Test ImageGenerationView (POST /v1/features/image-generation/)"""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = ImageGenerationView.as_view()

    @patch('apps.image_generation.views.PromptService')
    @patch('apps.image_generation.views.ImageGenerationService')
    def test_generate_image_success(self, MockImageService, MockPromptService):
        """Should generate image successfully"""
        # Setup mock prompt service
        mock_prompt_instance = MagicMock()
        mock_prompt_instance.refine_and_detect_intent.return_value = {
            'refined_prompt': 'A stunning sunset over majestic mountains with vibrant orange and purple sky',
            'intent': 'image_generation'
        }
        MockPromptService.return_value = mock_prompt_instance
        
        # Setup mock image service
        mock_image_instance = MagicMock()
        mock_image_instance.generate_image.return_value = {
            'task_id': 'task_uuid_123',
            'status': 'PROCESSING',
            'refined_prompt': 'A stunning sunset...'
        }
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.post(
            '/v1/features/image-generation/',
            data=json.dumps({
                'prompt': 'A beautiful sunset',
                'user_id': 'user_123'
            }),
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)
        self.assertIn('result', response_data)
        self.assertIn('task_id', response_data['result'])

    def test_generate_image_validation_error(self):
        """Should return validation error for missing fields"""
        request = self.factory.post(
            '/v1/features/image-generation/',
            data=json.dumps({'prompt': 'Hello'}),  # Missing user_id
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)

    @patch('apps.image_generation.views.PromptService')
    @patch('apps.image_generation.views.ImageGenerationService')
    def test_generate_image_service_error(self, MockImageService, MockPromptService):
        """Should handle image generation service error"""
        # Setup mock prompt service
        mock_prompt_instance = MagicMock()
        mock_prompt_instance.refine_and_detect_intent.return_value = {
            'refined_prompt': 'Refined prompt',
            'intent': 'image_generation'
        }
        MockPromptService.return_value = mock_prompt_instance
        
        # Setup mock image service to raise error
        mock_image_instance = MagicMock()
        mock_image_instance.generate_image.side_effect = ImageGenerationError("API quota exceeded")
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.post(
            '/v1/features/image-generation/',
            data=json.dumps({
                'prompt': 'A beautiful sunset',
                'user_id': 'user_123'
            }),
            content_type='application/json'
        )
        
        response = self.view(request)
        
        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)


class ImageGenerationStatusViewTest(TestCase):
    """Test ImageGenerationStatusView (GET /v1/features/image-generation/status/{task_id})"""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = ImageGenerationStatusView.as_view()

    @patch('apps.image_generation.views.ImageGenerationService')
    @patch('apps.image_generation.views.image_gallery_service')
    def test_get_status_completed(self, mock_gallery, MockImageService):
        """Should return completed status with image URL"""
        mock_image_instance = MagicMock()
        mock_image_instance.poll_task_status.return_value = {
            'task_id': 'task_uuid_123',
            'status': 'COMPLETED',
            'uploaded_urls': ['https://storage.example.com/image.jpg'],
            'prompt': 'A beautiful sunset',
            'model': 'realism'
        }
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.get(
            '/v1/features/image-generation/status/task_uuid_123/',
            {'user_id': 'user_123'}
        )
        
        response = self.view(request, task_id='task_uuid_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)
        self.assertEqual(response_data['result']['status'], 'COMPLETED')
        self.assertIn('image_url', response_data['result'])

    @patch('apps.image_generation.views.ImageGenerationService')
    def test_get_status_processing(self, MockImageService):
        """Should return processing status"""
        mock_image_instance = MagicMock()
        mock_image_instance.poll_task_status.return_value = {
            'task_id': 'task_uuid_123',
            'status': 'PROCESSING'
        }
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.get(
            '/v1/features/image-generation/status/task_uuid_123/'
        )
        
        response = self.view(request, task_id='task_uuid_123')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['code'], 1000)
        self.assertEqual(response_data['result']['status'], 'PROCESSING')

    @patch('apps.image_generation.views.ImageGenerationService')
    def test_get_status_error(self, MockImageService):
        """Should handle polling error"""
        mock_image_instance = MagicMock()
        mock_image_instance.poll_task_status.side_effect = ImageGenerationError("Task not found")
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.get(
            '/v1/features/image-generation/status/nonexistent/'
        )
        
        response = self.view(request, task_id='nonexistent')
        
        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['code'], 1000)

    @patch('apps.image_generation.views.ImageGenerationService')
    @patch('apps.image_generation.views.image_gallery_service')
    def test_get_status_saves_to_gallery(self, mock_gallery, MockImageService):
        """Should save completed image to gallery when user_id provided"""
        mock_image_instance = MagicMock()
        mock_image_instance.poll_task_status.return_value = {
            'task_id': 'task_uuid_123',
            'status': 'COMPLETED',
            'uploaded_urls': ['https://storage.example.com/image.jpg'],
            'prompt': 'A beautiful sunset',
            'model': 'realism',
            'aspect_ratio': '1:1'
        }
        MockImageService.return_value = mock_image_instance
        
        request = self.factory.get(
            '/v1/features/image-generation/status/task_uuid_123/',
            {'user_id': 'user_123'}
        )
        
        response = self.view(request, task_id='task_uuid_123')
        
        self.assertEqual(response.status_code, 200)
        # Verify gallery save was called
        mock_gallery.save_image.assert_called_once()
