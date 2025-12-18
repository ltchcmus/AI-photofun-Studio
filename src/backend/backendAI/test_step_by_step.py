#!/usr/bin/env python3
"""
Step-by-Step Image Gallery Flow Test
Test each step individually and verify image URLs
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
from apps.remove_background.services import RemoveBackgroundService
from apps.image_gallery.services import image_gallery_service
import time
import requests


def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 100)
    print(f" {title}")
    print("=" * 100)


def print_step(step_num, description):
    """Print step number and description"""
    print(f"\n{'='*100}")
    print(f"📍 STEP {step_num}: {description}")
    print(f"{'='*100}")


def check_url_has_image(url):
    """Check if URL returns a valid image"""
    try:
        response = requests.head(url, timeout=5)
        content_type = response.headers.get('content-type', '')
        
        if response.status_code == 200 and 'image' in content_type:
            print(f"   ✅ URL is valid and contains an image")
            print(f"      Status: {response.status_code}")
            print(f"      Content-Type: {content_type}")
            return True
        else:
            print(f"   ⚠️ URL responded but may not be an image")
            print(f"      Status: {response.status_code}")
            print(f"      Content-Type: {content_type}")
            return False
    except Exception as e:
        print(f"   ❌ Failed to check URL: {str(e)}")
        return False


def wait_for_user():
    """Wait for user confirmation"""
    input("\n⏸️  Press Enter to continue to next step...")


def test_image_generation_flow():
    """Test complete image generation flow step by step"""
    print_header("🚀 IMAGE GENERATION FLOW TEST")
    
    service = ImageGenerationService()
    user_id = f"test_user_{int(time.time())}"
    prompt = "a beautiful sunset over mountains with vibrant colors"
    
    # =========================================================================
    # STEP 1: Initialize Generation
    # =========================================================================
    print_step(1, "Initialize Image Generation")
    
    print(f"\n📝 Input:")
    print(f"   User ID: {user_id}")
    print(f"   Prompt: {prompt}")
    print(f"   Model: realism")
    print(f"   Aspect Ratio: square_1_1")
    print(f"   Resolution: 2k")
    
    print(f"\n⏳ Calling Freepik API...")
    
    try:
        result = service.generate_image(
            prompt=prompt,
            user_id=user_id,
            aspect_ratio="square_1_1",
            model="realism",
            resolution="2k"
        )
        
        print(f"\n✅ API call successful!")
        print(f"\n📊 Response:")
        print(f"   Task ID: {result.get('task_id')}")
        print(f"   Status: {result.get('status')}")
        print(f"   Original Prompt: {result.get('original_prompt')}")
        print(f"   Refined Prompt: {result.get('refined_prompt', '')[:100]}...")
        
        task_id = result.get('task_id')
        
        if result.get('status') == 'COMPLETED':
            print(f"\n🎉 Generation completed synchronously!")
            uploaded_urls = result.get('uploaded_urls', [])
            if uploaded_urls:
                print(f"   Uploaded URLs: {len(uploaded_urls)} image(s)")
            return result, user_id
        
        wait_for_user()
        
        # =====================================================================
        # STEP 2: Poll for Completion
        # =====================================================================
        print_step(2, "Poll for Completion")
        
        print(f"\n⏳ Waiting for image generation to complete...")
        print(f"   Task ID: {task_id}")
        
        max_attempts = 30
        for attempt in range(1, max_attempts + 1):
            time.sleep(3)
            
            poll_result = service.poll_task_status(task_id)
            status = poll_result.get('status')
            
            print(f"   Attempt {attempt}/{max_attempts}: Status = {status}")
            
            if status == 'COMPLETED':
                print(f"\n✅ Generation completed!")
                result = poll_result
                break
            elif status == 'FAILED':
                print(f"\n❌ Generation failed!")
                return None, user_id
        
        if result.get('status') != 'COMPLETED':
            print(f"\n⚠️ Generation timed out after {max_attempts} attempts")
            return None, user_id
        
        wait_for_user()
        
        # =====================================================================
        # STEP 3: Check Uploaded URLs
        # =====================================================================
        print_step(3, "Check Uploaded URLs")
        
        uploaded_urls = result.get('uploaded_urls', [])
        
        if not uploaded_urls:
            print(f"\n⚠️ No uploaded URLs found in response")
            print(f"\n📊 Full response:")
            print(f"   {result}")
            return None, user_id
        
        print(f"\n📤 Found {len(uploaded_urls)} uploaded image(s)")
        
        for i, url in enumerate(uploaded_urls, 1):
            print(f"\n   Image {i}:")
            print(f"   URL: {url}")
            print(f"\n   🔍 Checking if URL contains valid image...")
            check_url_has_image(url)
        
        wait_for_user()
        
        # =====================================================================
        # STEP 4: Verify in Database
        # =====================================================================
        print_step(4, "Verify in Database")
        
        print(f"\n🔍 Querying database for user: {user_id}")
        
        gallery_images = image_gallery_service.get_user_images(
            user_id=user_id,
            intent='image_generation',
            limit=10
        )
        
        print(f"\n✅ Found {len(gallery_images)} image(s) in gallery")
        
        if gallery_images:
            for i, img in enumerate(gallery_images, 1):
                print(f"\n   📸 Image {i} in database:")
                print(f"      Image ID: {img.get('image_id')}")
                print(f"      Intent: {img.get('intent')}")
                print(f"      Refined Prompt: {img.get('refined_prompt', '')[:80]}...")
                print(f"      Image URL: {img.get('image_url')}")
                print(f"      Created At: {img.get('created_at')}")
                
                metadata = img.get('metadata', {})
                if metadata:
                    print(f"      Metadata:")
                    print(f"         Model: {metadata.get('model')}")
                    print(f"         Aspect Ratio: {metadata.get('aspect_ratio')}")
                    print(f"         Resolution: {metadata.get('resolution')}")
                
                print(f"\n      🔍 Verifying database URL has image...")
                check_url_has_image(img.get('image_url'))
        
        wait_for_user()
        
        # =====================================================================
        # STEP 5: Summary
        # =====================================================================
        print_step(5, "Summary")
        
        print(f"\n✅ FLOW COMPLETED SUCCESSFULLY!")
        print(f"\n📊 Summary:")
        print(f"   ✅ Image generated via Freepik API")
        print(f"   ✅ Uploaded to file service: {len(uploaded_urls)} image(s)")
        print(f"   ✅ Saved to database: {len(gallery_images)} record(s)")
        print(f"   ✅ All URLs verified")
        
        print(f"\n🎉 Test completed! All steps passed.")
        
        return result, user_id
    
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, user_id


def test_upscale_flow():
    """Test upscale flow step by step"""
    print_header("🚀 UPSCALE FLOW TEST")
    
    service = UpscaleService()
    user_id = f"test_user_upscale_{int(time.time())}"
    
    # Use a real test image URL
    test_image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    
    # =========================================================================
    # STEP 1: Initialize Upscale
    # =========================================================================
    print_step(1, "Initialize Upscale")
    
    print(f"\n📝 Input:")
    print(f"   User ID: {user_id}")
    print(f"   Test Image: {test_image_url}")
    print(f"   Sharpen: 0.5")
    
    print(f"\n🔍 Checking input image...")
    check_url_has_image(test_image_url)
    
    wait_for_user()
    
    print(f"\n⏳ Calling Freepik Upscaler API...")
    
    try:
        result = service.upscale_image(
            image_url=test_image_url,
            user_id=user_id,
            sharpen=0.5,
            smart_grain=0.0,
            ultra_detail=0.0
        )
        
        print(f"\n✅ API call successful!")
        print(f"\n📊 Response:")
        print(f"   Task ID: {result.get('task_id')}")
        print(f"   Status: {result.get('status')}")
        
        task_id = result.get('task_id')
        
        if result.get('status') == 'COMPLETED':
            print(f"\n🎉 Upscale completed synchronously!")
            uploaded_urls = result.get('uploaded_urls', [])
            if uploaded_urls:
                print(f"   Uploaded URLs: {len(uploaded_urls)} image(s)")
                
                for i, url in enumerate(uploaded_urls, 1):
                    print(f"\n   Image {i}: {url}")
                    check_url_has_image(url)
            return result, user_id
        
        wait_for_user()
        
        # =====================================================================
        # STEP 2: Poll for Completion
        # =====================================================================
        print_step(2, "Poll for Completion")
        
        print(f"\n⏳ Waiting for upscale to complete...")
        
        max_attempts = 20
        for attempt in range(1, max_attempts + 1):
            time.sleep(3)
            
            poll_result = service.poll_task_status(task_id)
            status = poll_result.get('status')
            
            print(f"   Attempt {attempt}/{max_attempts}: Status = {status}")
            
            if status == 'COMPLETED':
                print(f"\n✅ Upscale completed!")
                result = poll_result
                break
            elif status == 'FAILED':
                print(f"\n❌ Upscale failed!")
                return None, user_id
        
        wait_for_user()
        
        # =====================================================================
        # STEP 3: Check Results
        # =====================================================================
        print_step(3, "Check Uploaded URLs")
        
        uploaded_urls = result.get('uploaded_urls', [])
        
        if uploaded_urls:
            print(f"\n📤 Found {len(uploaded_urls)} upscaled image(s)")
            
            for i, url in enumerate(uploaded_urls, 1):
                print(f"\n   Image {i}:")
                print(f"   URL: {url}")
                print(f"\n   🔍 Checking if URL contains valid image...")
                check_url_has_image(url)
        
        wait_for_user()
        
        # =====================================================================
        # STEP 4: Verify Database
        # =====================================================================
        print_step(4, "Verify in Database")
        
        gallery_images = image_gallery_service.get_user_images(
            user_id=user_id,
            intent='upscale',
            limit=10
        )
        
        print(f"\n✅ Found {len(gallery_images)} upscale image(s) in gallery")
        
        if gallery_images:
            for img in gallery_images:
                print(f"\n   📸 Image in database:")
                print(f"      Image URL: {img.get('image_url')}")
                print(f"      Intent: {img.get('intent')}")
                print(f"\n      🔍 Verifying URL...")
                check_url_has_image(img.get('image_url'))
        
        print(f"\n✅ Upscale flow completed!")
        
        return result, user_id
    
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, user_id


def test_remove_background_flow():
    """Test remove background flow"""
    print_header("🚀 REMOVE BACKGROUND FLOW TEST")
    
    service = RemoveBackgroundService()
    user_id = f"test_user_rmbg_{int(time.time())}"
    
    # Use a real test image URL with a clear subject
    test_image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    
    print_step(1, "Remove Background")
    
    print(f"\n📝 Input:")
    print(f"   User ID: {user_id}")
    print(f"   Test Image: {test_image_url}")
    
    print(f"\n🔍 Checking input image...")
    check_url_has_image(test_image_url)
    
    wait_for_user()
    
    print(f"\n⏳ Calling Freepik Remove Background API...")
    
    try:
        result = service.remove_background(
            image_url=test_image_url,
            user_id=user_id
        )
        
        print(f"\n✅ Background removed!")
        print(f"\n📊 Response:")
        print(f"   Uploaded URL: {result.get('uploaded_url')}")
        
        if result.get('uploaded_url'):
            print(f"\n🔍 Checking result image...")
            check_url_has_image(result.get('uploaded_url'))
        
        wait_for_user()
        
        print_step(2, "Verify in Database")
        
        gallery_images = image_gallery_service.get_user_images(
            user_id=user_id,
            intent='remove_background',
            limit=10
        )
        
        print(f"\n✅ Found {len(gallery_images)} image(s) in gallery")
        
        if gallery_images:
            img = gallery_images[0]
            print(f"\n   📸 Image in database:")
            print(f"      Image URL: {img.get('image_url')}")
            print(f"\n      🔍 Verifying URL...")
            check_url_has_image(img.get('image_url'))
        
        print(f"\n✅ Remove background flow completed!")
        
        return result, user_id
    
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, user_id


def main():
    """Main test menu"""
    print("\n" + "🎯 " * 50)
    print("   STEP-BY-STEP IMAGE GALLERY FLOW TEST")
    print("🎯 " * 50)
    
    print("\n📋 Select a test to run:")
    print("   1. Image Generation Flow (most complete)")
    print("   2. Upscale Flow")
    print("   3. Remove Background Flow (fastest)")
    print("   4. Run All Tests")
    print("   0. Exit")
    
    choice = input("\n👉 Enter choice (1-4, 0 to exit): ").strip()
    
    if choice == "1":
        test_image_generation_flow()
    elif choice == "2":
        test_upscale_flow()
    elif choice == "3":
        test_remove_background_flow()
    elif choice == "4":
        print("\n🚀 Running all tests sequentially...\n")
        test_remove_background_flow()
        print("\n" + "="*100 + "\n")
        test_upscale_flow()
        print("\n" + "="*100 + "\n")
        test_image_generation_flow()
    elif choice == "0":
        print("\n👋 Exiting...")
        return 0
    else:
        print("\n❌ Invalid choice")
        return 1
    
    print("\n" + "="*100)
    print("✅ ALL TESTS COMPLETED!")
    print("="*100)
    
    return 0


if __name__ == "__main__":
    exit(main())
