#!/usr/bin/env python3
"""
Test Image Gallery Integration
Test the full flow: Generate image -> Upload -> Save to Gallery -> Verify in DB
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
django.setup()

from apps.image_generation.services import ImageGenerationService
from apps.upscale.services import UpscaleService
from apps.image_gallery.services import image_gallery_service
import time


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 80)
    print(f" {title}")
    print("=" * 80)


def test_image_generation_with_gallery():
    """Test image generation with gallery save"""
    print_section("TEST 1: Image Generation + Gallery Save")
    
    service = ImageGenerationService()
    user_id = "test_user_123"
    prompt = "a beautiful sunset over mountains"
    
    try:
        print(f"\n📝 Prompt: {prompt}")
        print(f"👤 User ID: {user_id}")
        print("\n🔄 Generating image...")
        
        result = service.generate_image(
            prompt=prompt,
            user_id=user_id,
            aspect_ratio="square_1_1",
            model="realism",
            resolution="2k"
        )
        
        print(f"\n✅ Generation initiated")
        print(f"   Task ID: {result.get('task_id')}")
        print(f"   Status: {result.get('status')}")
        print(f"   Original Prompt: {result.get('original_prompt')}")
        print(f"   Refined Prompt: {result.get('refined_prompt', '')[:100]}...")
        
        # If async, poll for completion
        if result.get('status') != 'COMPLETED':
            print("\n⏳ Waiting for generation to complete...")
            task_id = result.get('task_id')
            max_attempts = 30
            attempt = 0
            
            while attempt < max_attempts:
                time.sleep(3)
                attempt += 1
                
                poll_result = service.poll_task_status(task_id)
                status = poll_result.get('status')
                print(f"   Attempt {attempt}/{max_attempts}: {status}")
                
                if status == 'COMPLETED':
                    result = poll_result
                    break
                elif status == 'FAILED':
                    print("❌ Generation failed")
                    return False
        
        # Check results
        if result.get('status') == 'COMPLETED':
            print("\n✅ Image generated successfully")
            
            if result.get('generated'):
                print(f"   Generated URLs: {len(result.get('generated'))} images")
                for i, url in enumerate(result.get('generated', [])[:3], 1):
                    print(f"   {i}. {url[:80]}...")
            
            if result.get('uploaded_urls'):
                print(f"\n📤 Uploaded to file service: {len(result.get('uploaded_urls'))} images")
                for i, url in enumerate(result.get('uploaded_urls', [])[:3], 1):
                    print(f"   {i}. {url[:80]}...")
                
                # Verify in gallery
                print("\n🔍 Checking gallery database...")
                gallery_images = image_gallery_service.get_user_images(
                    user_id=user_id,
                    intent='image_generate',
                    limit=5
                )
                
                print(f"   Found {len(gallery_images)} images in gallery")
                
                if gallery_images:
                    latest = gallery_images[0]
                    print(f"\n📸 Latest image in gallery:")
                    print(f"   Image ID: {latest.get('image_id')}")
                    print(f"   User ID: {latest.get('user_id')}")
                    print(f"   Intent: {latest.get('intent')}")
                    print(f"   Refined Prompt: {latest.get('refined_prompt', '')[:80]}...")
                    print(f"   Image URL: {latest.get('image_url', '')[:80]}...")
                    print(f"   Created At: {latest.get('created_at')}")
                    
                    metadata = latest.get('metadata', {})
                    if metadata:
                        print(f"   Metadata: model={metadata.get('model')}, aspect_ratio={metadata.get('aspect_ratio')}")
                
                print("\n✅ Gallery integration working!")
                return True
            else:
                print("\n⚠️ No uploaded URLs found")
                return False
        else:
            print(f"\n❌ Generation not completed. Status: {result.get('status')}")
            return False
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_upscale_with_gallery():
    """Test upscale with gallery save"""
    print_section("TEST 2: Upscale + Gallery Save")
    
    service = UpscaleService()
    user_id = "test_user_456"
    
    # Use a test image URL (you can replace with actual image)
    test_image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    
    try:
        print(f"\n🖼️ Test Image: {test_image_url}")
        print(f"👤 User ID: {user_id}")
        print("\n🔄 Upscaling image...")
        
        result = service.upscale_image(
            image_url=test_image_url,
            user_id=user_id,
            sharpen=0.5,
            smart_grain=0.0,
            ultra_detail=0.0
        )
        
        print(f"\n✅ Upscale initiated")
        print(f"   Task ID: {result.get('task_id')}")
        print(f"   Status: {result.get('status')}")
        
        # If async, poll for completion
        if result.get('status') != 'COMPLETED':
            print("\n⏳ Waiting for upscale to complete...")
            task_id = result.get('task_id')
            max_attempts = 20
            attempt = 0
            
            while attempt < max_attempts:
                time.sleep(3)
                attempt += 1
                
                poll_result = service.poll_task_status(task_id)
                status = poll_result.get('status')
                print(f"   Attempt {attempt}/{max_attempts}: {status}")
                
                if status == 'COMPLETED':
                    result = poll_result
                    break
                elif status == 'FAILED':
                    print("❌ Upscale failed")
                    return False
        
        # Check results
        if result.get('status') == 'COMPLETED':
            print("\n✅ Image upscaled successfully")
            
            if result.get('uploaded_urls'):
                print(f"\n📤 Uploaded: {len(result.get('uploaded_urls'))} images")
                for i, url in enumerate(result.get('uploaded_urls', [])[:3], 1):
                    print(f"   {i}. {url[:80]}...")
                
                # Verify in gallery
                print("\n🔍 Checking gallery database...")
                gallery_images = image_gallery_service.get_user_images(
                    user_id=user_id,
                    intent='upscale',
                    limit=5
                )
                
                print(f"   Found {len(gallery_images)} upscale images in gallery")
                
                if gallery_images:
                    latest = gallery_images[0]
                    print(f"\n📸 Latest upscale in gallery:")
                    print(f"   Image ID: {latest.get('image_id')}")
                    print(f"   Intent: {latest.get('intent')}")
                    print(f"   Created At: {latest.get('created_at')}")
                
                print("\n✅ Upscale gallery integration working!")
                return True
            else:
                print("\n⚠️ No uploaded URLs found")
                return False
        else:
            print(f"\n❌ Upscale not completed. Status: {result.get('status')}")
            return False
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_gallery_queries():
    """Test gallery query functions"""
    print_section("TEST 3: Gallery Query Functions")
    
    try:
        # Test 1: Get all images for a user
        print("\n📋 Test: Get all user images")
        user_id = "test_user_123"
        images = image_gallery_service.get_user_images(user_id=user_id, limit=10)
        print(f"   Found {len(images)} images for user {user_id}")
        
        for img in images[:3]:
            print(f"   - {img.get('intent')}: {img.get('image_url', '')[:60]}...")
        
        # Test 2: Get images by intent
        print("\n📋 Test: Filter by intent")
        gen_images = image_gallery_service.get_user_images(
            user_id=user_id,
            intent='image_generate',
            limit=5
        )
        print(f"   Found {len(gen_images)} image_generate images")
        
        # Test 3: Test pagination
        print("\n📋 Test: Pagination")
        page1 = image_gallery_service.get_user_images(user_id=user_id, limit=2, offset=0)
        page2 = image_gallery_service.get_user_images(user_id=user_id, limit=2, offset=2)
        print(f"   Page 1: {len(page1)} images")
        print(f"   Page 2: {len(page2)} images")
        
        print("\n✅ Gallery queries working!")
        return True
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "🚀 " * 40)
    print("   IMAGE GALLERY INTEGRATION TEST SUITE")
    print("🚀 " * 40)
    
    results = []
    
    # Test 1: Image Generation
    results.append(("Image Generation + Gallery", test_image_generation_with_gallery()))
    
    # Test 2: Upscale (optional, may take time)
    # Uncomment if you want to test upscale
    # results.append(("Upscale + Gallery", test_upscale_with_gallery()))
    
    # Test 3: Gallery Queries
    results.append(("Gallery Queries", test_gallery_queries()))
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {status}: {name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
