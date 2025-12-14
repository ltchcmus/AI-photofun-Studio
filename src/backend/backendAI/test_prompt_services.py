#!/usr/bin/env python3
"""
Test Script for Prompt Refinement Integration
Tests all AI services with prompt refinement functionality
"""

import os
import sys
from unittest.mock import patch

# Set Django settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'backendAI.settings'
os.environ['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY', 'AIzaSyCiQ2hcLmWS5tWqEgDD304RTSBKpSSvT2o')
os.environ['FREEPIK_API_KEY'] = os.getenv('FREEPIK_API_KEY', 'FPSX66c28e0d80af9f0e2e80d89ee01e834c')

sys.path.insert(0, os.getcwd())

from django.conf import settings

if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES={'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}},
        INSTALLED_APPS=['django.contrib.contenttypes'],
        SECRET_KEY='test-key',
        FREEPIK_API_KEY=os.environ['FREEPIK_API_KEY'],
        GEMINI_API_KEY=os.environ['GEMINI_API_KEY'],
    )


def test_prompt_service():
    """Test PromptService core functionality"""
    from apps.prompt_service.services import PromptService
    
    print('='*60)
    print('TEST 1: PromptService.refine_only()')
    print('='*60)
    result = PromptService.refine_only('make a beautiful sunset')
    print(f'✓ Input: "make a beautiful sunset"')
    print(f'✓ Output: "{result[:100]}..."')
    assert isinstance(result, str)
    assert len(result) > 0
    
    print('\n' + '='*60)
    print('TEST 2: PromptService.refine_and_detect_intent()')
    print('='*60)
    
    test_cases = [
        ('tạo ảnh một con mèo', 'image_generate'),
        ('làm rõ ảnh này', 'upscale'),
        ('xóa background', 'remove_background'),
        ('thêm ánh sáng mặt trời', 'relight'),
        ('chuyển sang anime style', 'style_transfer'),
        ('mở rộng ảnh sang 2 bên', 'image_expand'),
        ('tưởng tượng lại ảnh này', 'reimagine'),
    ]
    
    for prompt, expected_intent in test_cases:
        result = PromptService.refine_and_detect_intent(prompt)
        print(f'\n✓ Input: "{prompt}"')
        print(f'  - Refined: "{result["refined_prompt"][:60]}..."')
        print(f'  - Intent: {result["intent"]} (expected: {expected_intent})')
        assert result['intent'] == expected_intent, f"Expected {expected_intent}, got {result['intent']}"
    
    print('\n✅ All PromptService tests passed!')


def test_ai_services():
    """Test AI services with prompt refinement"""
    mock_response = {
        'task_id': 'mock-task-123',
        'status': 'CREATED',
        'generated': [],
        'relit': [],
        'reimagined': [],
        'expanded': []
    }
    
    print('\n' + '='*60)
    print('TEST 3: AI Services with Prompt Refinement')
    print('='*60)
    
    # Test RelightService
    print('\n--- RelightService ---')
    with patch('core.freepik_client.FreepikClient.relight_image', return_value=mock_response):
        from apps.relight.services import RelightService
        service = RelightService()
        result = service.relight_image(
            image_url='https://example.com/test.jpg',
            prompt='add sunset lighting',
            user_id='test_user'
        )
        print(f'✓ Original: "{result["original_prompt"]}"')
        print(f'✓ Refined: "{result["refined_prompt"][:60]}..."')
        assert result['original_prompt'] == 'add sunset lighting'
        assert result['refined_prompt'] != result['original_prompt']
    
    # Test ReimagineService with prompt
    print('\n--- ReimagineService (with prompt) ---')
    with patch('core.freepik_client.FreepikClient.reimagine_flux', return_value=mock_response):
        from apps.reimagine.services import ReimagineService
        service = ReimagineService()
        result = service.reimagine_image(
            image_url='https://example.com/test.jpg',
            user_id='test_user',
            prompt='make it vibrant'
        )
        print(f'✓ Original: "{result["original_prompt"]}"')
        print(f'✓ Refined: "{result["refined_prompt"]}"')
        assert result['original_prompt'] == 'make it vibrant'
        assert result['refined_prompt'] != result['original_prompt']
    
    # Test ReimagineService without prompt
    print('\n--- ReimagineService (no prompt) ---')
    with patch('core.freepik_client.FreepikClient.reimagine_flux', return_value=mock_response):
        from apps.reimagine.services import ReimagineService
        service = ReimagineService()
        result = service.reimagine_image(
            image_url='https://example.com/test.jpg',
            user_id='test_user'
        )
        print(f'✓ Original: {result["original_prompt"]}')
        print(f'✓ Refined: {result["refined_prompt"]}')
        assert result['original_prompt'] is None
        assert result['refined_prompt'] is None
    
    # Test ImageExpandService
    print('\n--- ImageExpandService ---')
    with patch('core.freepik_client.FreepikClient.expand_image', return_value=mock_response):
        from apps.image_expand.services import ImageExpandService
        service = ImageExpandService()
        result = service.expand_image(
            image_url='https://example.com/test.jpg',
            user_id='test_user',
            prompt='extend with mountains',
            left=100, right=100
        )
        print(f'✓ Original: "{result["original_prompt"]}"')
        print(f'✓ Refined: "{result["refined_prompt"][:60]}..."')
        assert result['original_prompt'] == 'extend with mountains'
        assert result['refined_prompt'] != result['original_prompt']
    
    # Test ImageGenerationService
    print('\n--- ImageGenerationService ---')
    with patch('core.freepik_client.FreepikClient.generate_image_mystic', return_value=mock_response):
        from apps.image_generation.services import ImageGenerationService
        service = ImageGenerationService()
        result = service.generate_image(
            prompt='a dragon in the sky',
            user_id='test_user'
        )
        print(f'✓ Original: "{result["original_prompt"]}"')
        print(f'✓ Refined: "{result["refined_prompt"][:60]}..."')
        assert result['original_prompt'] == 'a dragon in the sky'
        assert result['refined_prompt'] != result['original_prompt']
    
    print('\n✅ All AI service tests passed!')


def main():
    """Run all tests"""
    try:
        print('\n' + '🔬 TESTING PROMPT REFINEMENT INTEGRATION '.center(60, '='))
        print()
        
        test_prompt_service()
        test_ai_services()
        
        print('\n' + '='*60)
        print('🎉 ALL TESTS PASSED! 🎉'.center(60))
        print('='*60)
        print('\n✅ Summary:')
        print('  • PromptService: refine_only() + refine_and_detect_intent() ✓')
        print('  • Intent Detection: All 7 intents working ✓')
        print('  • RelightService: Prompt refinement ✓')
        print('  • ReimagineService: Optional prompt refinement ✓')
        print('  • ImageExpandService: Optional prompt refinement ✓')
        print('  • ImageGenerationService: Prompt refinement ✓')
        print('\n✅ All services preserve original_prompt + refined_prompt')
        print('✅ Response format consistent across all services')
        print('='*60 + '\n')
        
        return 0
    
    except Exception as e:
        print(f'\n❌ TEST FAILED: {e}')
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
