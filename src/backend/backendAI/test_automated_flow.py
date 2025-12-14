#!/usr/bin/env python3
"""
Automated Image Gallery Flow Test
Test complete flow without manual input
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
django.setup()

from apps.remove_background.services import RemoveBackgroundService
from apps.image_gallery.services import image_gallery_service
import requests


def check_url(url, description=""):
    """Check if URL is accessible and returns image"""
    try:
        response = requests.head(url, timeout=10)
        content_type = response.headers.get('content-type', '')
        
        if response.status_code == 200:
            if 'image' in content_type:
                print(f"   ✅ {description}: Valid image URL")
                print(f"      URL: {url[:80]}...")
                print(f"      Content-Type: {content_type}")
                return True
            else:
                print(f"   ⚠️ {description}: URL accessible but not an image")
                print(f"      Content-Type: {content_type}")
                return False
        else:
            print(f"   ❌ {description}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ {description}: {str(e)}")
        return False


def test_remove_background_complete():
    """Complete remove background test"""
    print("\n" + "=" * 100)
    print(" 🚀 REMOVE BACKGROUND - COMPLETE FLOW TEST")
    print("=" * 100)
    
    service = RemoveBackgroundService()
    user_id = "test_auto_user_123"
    test_image = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    
    print(f"\n📝 Test Configuration:")
    print(f"   User ID: {user_id}")
    print(f"   Test Image: {test_image}")
    
    # Step 1: Check input image
    print(f"\n" + "─" * 100)
    print(f"📍 STEP 1: Verify Input Image")
    print("─" * 100)
    
    if not check_url(test_image, "Input image"):
        print("\n❌ Input image not accessible. Aborting test.")
        return False
    
    # Step 2: Call remove background service
    print(f"\n" + "─" * 100)
    print(f"📍 STEP 2: Remove Background")
    print("─" * 100)
    
    print(f"\n⏳ Calling Freepik Remove Background API...")
    
    try:
        result = service.remove_background(
            image_url=test_image,
            user_id=user_id
        )
        
        print(f"\n✅ Background removed successfully!")
        
        uploaded_url = result.get('uploaded_url')
        
        if not uploaded_url:
            print(f"\n❌ No uploaded_url in response")
            print(f"   Response: {result}")
            return False
        
        print(f"\n📤 Uploaded URL: {uploaded_url}")
        
    except Exception as e:
        print(f"\n❌ Remove background failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Verify uploaded URL
    print(f"\n" + "─" * 100)
    print(f"📍 STEP 3: Verify Uploaded Image")
    print("─" * 100)
    
    if not check_url(uploaded_url, "Uploaded image"):
        print(f"\n❌ Uploaded URL not accessible")
        return False
    
    # Step 4: Check database
    print(f"\n" + "─" * 100)
    print(f"📍 STEP 4: Verify Database Record")
    print("─" * 100)
    
    print(f"\n🔍 Querying database for user: {user_id}")
    
    try:
        gallery_images = image_gallery_service.get_user_images(
            user_id=user_id,
            intent='remove_background',
            limit=5
        )
        
        print(f"\n✅ Found {len(gallery_images)} images in gallery")
        
        if not gallery_images:
            print(f"\n❌ No images found in database")
            return False
        
        # Check latest image
        latest = gallery_images[0]
        
        print(f"\n📸 Latest image in database:")
        print(f"   Image ID: {latest.get('image_id')}")
        print(f"   User ID: {latest.get('user_id')}")
        print(f"   Intent: {latest.get('intent')}")
        print(f"   Image URL: {latest.get('image_url')[:80]}...")
        print(f"   Created At: {latest.get('created_at')}")
        
        db_url = latest.get('image_url')
        
        # Verify database URL
        print(f"\n🔍 Verifying database URL:")
        if not check_url(db_url, "Database URL"):
            print(f"\n⚠️ Database URL not accessible")
            return False
        
        # Verify URLs match
        if uploaded_url == db_url:
            print(f"\n✅ Uploaded URL matches database URL")
        else:
            print(f"\n⚠️ URL mismatch:")
            print(f"   Uploaded: {uploaded_url}")
            print(f"   Database: {db_url}")
        
    except Exception as e:
        print(f"\n❌ Database check failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Summary
    print(f"\n" + "=" * 100)
    print(f" ✅ TEST SUMMARY")
    print("=" * 100)
    
    print(f"\n✅ All steps passed:")
    print(f"   ✅ Input image verified")
    print(f"   ✅ Background removed via Freepik API")
    print(f"   ✅ Image uploaded to file service")
    print(f"   ✅ Uploaded image URL accessible")
    print(f"   ✅ Image saved to database")
    print(f"   ✅ Database URL accessible")
    
    print(f"\n🎉 COMPLETE FLOW TEST PASSED!")
    
    return True


if __name__ == "__main__":
    success = test_remove_background_complete()
    exit(0 if success else 1)
