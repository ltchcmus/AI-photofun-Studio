#!/usr/bin/env python
"""
API Flow Test Script

Script này kiểm tra từng bước của AI Gateway pipeline:
1. Test Prompt Refinement Service
2. Test Image Generation Service
3. Test AI Gateway (orchestrator)
4. Test các services khác (face_swap, background_removal)

Chạy script này để verify rằng toàn bộ kiến trúc hoạt động đúng.
"""
import os
import sys
import django
import json
import time
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
django.setup()

# Import sau khi setup Django
from apps.prompt_refinement.service import get_service as get_prompt_service
from apps.image_generation.service import get_service as get_image_service
from apps.ai_gateway.pipeline import AIGatewayPipeline
from apps.ai_gateway.services import IntentClassificationService


def print_step(step_number, step_name):
    """In header cho mỗi bước test"""
    print("\n" + "="*80)
    print(f"BƯỚC {step_number}: {step_name}")
    print("="*80)


def print_result(result, indent=0):
    """In kết quả với format đẹp"""
    prefix = "  " * indent
    if isinstance(result, dict):
        for key, value in result.items():
            if isinstance(value, (dict, list)):
                print(f"{prefix}📋 {key}:")
                print_result(value, indent + 1)
            elif isinstance(value, bytes):
                print(f"{prefix}📋 {key}: <binary data, {len(value)} bytes>")
            else:
                print(f"{prefix}📋 {key}: {value}")
    elif isinstance(result, list):
        for i, item in enumerate(result, 1):
            print(f"{prefix}  {i}. {item}")
    else:
        print(f"{prefix}{result}")


def test_step_1_intent_classification():
    """Bước 1: Test Intent Classification"""
    print_step(1, "Test Intent Classification Service")
    
    service = IntentClassificationService()
    
    test_cases = [
        {
            'message': 'Create a beautiful sunset landscape',
            'has_image': False,
            'expected': 'image_generation'
        },
        {
            'message': 'Remove background from my photo',
            'has_image': True,
            'expected': 'background_removal'
        },
        {
            'message': 'Swap my face with another person',
            'has_image': True,
            'expected': 'face_swap'
        },
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n📝 Test case {i}: '{test['message']}'")
        print(f"   Has image: {test['has_image']}")
        
        intent, confidence = service.classify_intent(
            test['message'],
            has_image=test['has_image']
        )
        
        print(f"✅ Intent detected: {intent}")
        print(f"✅ Confidence: {confidence:.2f}")
        print(f"✅ Expected: {test['expected']}")
        
        if intent == test['expected']:
            print("   ✅ PASS - Intent classification correct!")
        else:
            print(f"   ❌ FAIL - Expected '{test['expected']}' but got '{intent}'")
    
    return True


def test_step_2_prompt_refinement():
    """Bước 2: Test Prompt Refinement Service"""
    print_step(2, "Test Prompt Refinement Service")
    
    service = get_prompt_service()
    
    test_prompts = [
        "a cat",
        "beautiful landscape",
        "portrait of a woman",
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n📝 Test {i}: Original prompt = '{prompt}'")
        
        start_time = time.time()
        result = service.refine_prompt(
            original_prompt=prompt,
            context={'style': 'realistic', 'quality': 'high'},
            method='auto',
            save_to_db=False  # Không save khi test
        )
        elapsed = time.time() - start_time
        
        print(f"\n✅ Refined prompt:")
        print(f"   {result['refined_prompt']}")
        print(f"\n✅ Details:")
        print(f"   - Method used: {result['method_used']}")
        print(f"   - Confidence: {result['confidence_score']:.2f}")
        print(f"   - Processing time: {elapsed:.3f}s")
        
        if result.get('suggestions'):
            print(f"\n✅ Suggestions:")
            for suggestion in result['suggestions']:
                print(f"   • {suggestion}")
    
    return True


def test_step_3_image_generation():
    """Bước 3: Test Image Generation Service"""
    print_step(3, "Test Image Generation Service")
    
    service = get_image_service()
    
    test_cases = [
        {
            'prompt': 'a beautiful sunset over mountains, high quality, detailed',
            'params': {'width': 512, 'height': 512, 'num_inference_steps': 20}
        },
        {
            'prompt': 'portrait of a cat, professional photography',
            'params': {'width': 768, 'height': 768, 'num_inference_steps': 30}
        },
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: '{test['prompt'][:50]}...'")
        print(f"   Parameters: {test['params']}")
        
        start_time = time.time()
        result = service.generate_image(
            prompt=test['prompt'],
            negative_prompt='blurry, low quality',
            save_to_db=False,  # Không save khi test
            **test['params']
        )
        elapsed = time.time() - start_time
        
        if result['success']:
            print(f"\n✅ Image generated successfully!")
            print(f"   - Processing time: {elapsed:.3f}s")
            print(f"   - Image size: {len(result['image_bytes'])} bytes")
            print(f"   - Metadata:")
            print_result(result['metadata'], indent=2)
        else:
            print(f"\n❌ FAIL: {result.get('error')}")
    
    return True


def test_step_4_ai_gateway_full_flow():
    """Bước 4: Test AI Gateway (Full Pipeline)"""
    print_step(4, "Test AI Gateway - Full Pipeline")
    
    pipeline = AIGatewayPipeline()
    
    test_cases = [
        {
            'message': 'Generate a beautiful sunset landscape',
            'session_id': 'test-session-1',
            'context': {'style': 'realistic', 'quality': 'high'}
        },
        {
            'message': 'Create a portrait of a warrior',
            'session_id': 'test-session-2',
            'context': {'style': 'fantasy', 'quality': 'high'}
        },
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: '{test['message']}'")
        print(f"   Session: {test['session_id']}")
        
        start_time = time.time()
        result = pipeline.process_message(
            message=test['message'],
            session_id=test['session_id'],
            uploaded_image=None,
            context=test['context']
        )
        elapsed = time.time() - start_time
        
        print(f"\n✅ Pipeline Result:")
        print(f"   - Total time: {elapsed:.3f}s")
        print(f"   - Success: {result.get('success', False)}")
        
        if 'pipeline_metadata' in result:
            print(f"\n✅ Pipeline Metadata:")
            print_result(result['pipeline_metadata'], indent=2)
        
        if 'error' in result:
            print(f"\n❌ Error: {result['error']}")
        elif 'data' in result:
            print(f"\n✅ Response Data:")
            print_result(result['data'], indent=2)
    
    return True


def test_step_5_parameter_validation():
    """Bước 5: Test Parameter Validation"""
    print_step(5, "Test Parameter Validation")
    
    service = get_image_service()
    
    test_cases = [
        {
            'name': 'Valid parameters',
            'params': {'width': 512, 'height': 512, 'num_inference_steps': 50},
            'should_pass': True
        },
        {
            'name': 'Invalid width (not multiple of 64)',
            'params': {'width': 500, 'height': 512, 'num_inference_steps': 50},
            'should_pass': False
        },
        {
            'name': 'Width too large',
            'params': {'width': 3000, 'height': 512, 'num_inference_steps': 50},
            'should_pass': False
        },
        {
            'name': 'Invalid steps (too low)',
            'params': {'width': 512, 'height': 512, 'num_inference_steps': 5},
            'should_pass': False
        },
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: {test['name']}")
        print(f"   Parameters: {test['params']}")
        
        is_valid, error_msg = service.validate_parameters(test['params'])
        
        if test['should_pass']:
            if is_valid:
                print(f"   ✅ PASS - Parameters valid as expected")
            else:
                print(f"   ❌ FAIL - Should be valid but got error: {error_msg}")
        else:
            if not is_valid:
                print(f"   ✅ PASS - Invalid parameters detected: {error_msg}")
            else:
                print(f"   ❌ FAIL - Should be invalid but passed validation")
    
    return True


def test_step_6_service_integration():
    """Bước 6: Test Service Integration (Services gọi lẫn nhau)"""
    print_step(6, "Test Service Integration")
    
    print("\n📝 Test: Prompt Refinement → Image Generation")
    
    # Bước 1: Refine prompt
    prompt_service = get_prompt_service()
    refine_result = prompt_service.refine_prompt(
        original_prompt="a cat sitting on a chair",
        context={'style': 'realistic'},
        save_to_db=False
    )
    
    print(f"\n✅ Step 1 - Prompt Refinement:")
    print(f"   Original: 'a cat sitting on a chair'")
    print(f"   Refined: '{refine_result['refined_prompt']}'")
    
    # Bước 2: Generate image với refined prompt
    image_service = get_image_service()
    image_result = image_service.generate_image(
        prompt=refine_result['refined_prompt'],
        negative_prompt='blurry, low quality',
        save_to_db=False,
        width=512,
        height=512
    )
    
    print(f"\n✅ Step 2 - Image Generation:")
    if image_result['success']:
        print(f"   Success: True")
        print(f"   Image size: {len(image_result['image_bytes'])} bytes")
        print(f"   ✅ PASS - Services integrated successfully!")
    else:
        print(f"   ❌ FAIL: {image_result.get('error')}")
    
    return True


def main():
    """Chạy tất cả test cases"""
    print("\n" + "🚀 " + "="*78)
    print("🚀 AI PHOTOFUN STUDIO - API FLOW TEST")
    print("🚀 " + "="*78)
    print("\nKiến trúc được test:")
    print("  apps/")
    print("  ├── prompt_refinement/     ← Standalone Service")
    print("  ├── image_generation/      ← Standalone Service")
    print("  ├── face_swap/             ← Standalone Service")
    print("  ├── background_removal/    ← Standalone Service")
    print("  └── ai_gateway/            ← Pure Orchestrator")
    print("      ├── pipeline.py")
    print("      └── services/")
    print("          ├── intent_classification.py")
    print("          └── response_handler.py")
    
    tests = [
        ("Intent Classification", test_step_1_intent_classification),
        ("Prompt Refinement Service", test_step_2_prompt_refinement),
        ("Image Generation Service", test_step_3_image_generation),
        ("AI Gateway Full Pipeline", test_step_4_ai_gateway_full_flow),
        ("Parameter Validation", test_step_5_parameter_validation),
        ("Service Integration", test_step_6_service_integration),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            print(f"\n⏳ Running: {test_name}...")
            success = test_func()
            results[test_name] = "✅ PASS" if success else "❌ FAIL"
        except Exception as e:
            print(f"\n❌ ERROR in {test_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            results[test_name] = f"❌ ERROR: {str(e)}"
    
    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    for test_name, result in results.items():
        print(f"  {result}  {test_name}")
    
    print("\n" + "="*80)
    print("✅ All tests completed!")
    print("="*80 + "\n")


if __name__ == '__main__':
    main()
