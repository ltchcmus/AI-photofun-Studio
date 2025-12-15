#!/usr/bin/env python3
"""
Direct Freepik API Test
Test Freepik API calls directly to see actual responses
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
django.setup()

from core.freepik_client import freepik_client
import json


def test_mystic_api():
    """Test Mystic image generation API"""
    print("\n" + "="*100)
    print(" TEST: Freepik Mystic API")
    print("="*100)
    
    prompt = "a beautiful cat sitting on a couch"
    
    print(f"\n📝 Input:")
    print(f"   Prompt: {prompt}")
    print(f"   Model: realism")
    print(f"   Resolution: 2k")
    
    print(f"\n⏳ Calling Freepik Mystic API...")
    
    try:
        result = freepik_client.generate_image_mystic(
            prompt=prompt,
            model="realism",
            resolution="2k",
            aspect_ratio="square_1_1"
        )
        
        print(f"\n✅ API Response:")
        print(json.dumps(result, indent=2))
        
        print(f"\n📊 Key fields:")
        print(f"   task_id: {result.get('task_id')}")
        print(f"   status: {result.get('status')}")
        
        if 'data' in result:
            print(f"   data.task_id: {result.get('data', {}).get('task_id')}")
            print(f"   data.status: {result.get('data', {}).get('status')}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_remove_background_api():
    """Test Remove Background API (synchronous)"""
    print("\n" + "="*100)
    print(" TEST: Freepik Remove Background API")
    print("="*100)
    
    test_image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    
    print(f"\n📝 Input:")
    print(f"   Image URL: {test_image_url}")
    
    print(f"\n⏳ Calling Freepik Remove Background API...")
    
    try:
        result = freepik_client.remove_background(test_image_url)
        
        print(f"\n✅ API Response:")
        print(json.dumps(result, indent=2))
        
        print(f"\n📊 Key fields:")
        print(f"   no_background: {result.get('no_background', 'Not found')[:100]}...")
        print(f"   original: {result.get('original', 'Not found')[:100]}...")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def main():
    print("\n" + "🔍 " * 50)
    print("   DIRECT FREEPIK API TEST")
    print("🔍 " * 50)
    
    print("\n📋 Select API to test:")
    print("   1. Mystic (Image Generation)")
    print("   2. Remove Background (fastest, synchronous)")
    print("   3. Test Both")
    
    choice = input("\n👉 Enter choice (1-3): ").strip()
    
    if choice == "1":
        test_mystic_api()
    elif choice == "2":
        test_remove_background_api()
    elif choice == "3":
        test_remove_background_api()
        test_mystic_api()
    else:
        print("\n❌ Invalid choice")
        return 1
    
    print("\n" + "="*100)
    print("✅ TEST COMPLETED")
    print("="*100)
    
    return 0


if __name__ == "__main__":
    exit(main())
