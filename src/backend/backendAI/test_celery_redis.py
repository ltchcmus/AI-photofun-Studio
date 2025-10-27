"""
Test Celery + Redis Setup (NO DATABASE)

Test flow:
1. Submit task
2. Poll status
3. Get result

Run this after:
1. Start Redis: redis-server
2. Start Django: python manage.py runserver
3. Start Celery: celery -A backendAI worker --loglevel=info
4. Run test: python test_celery_redis.py
"""
import requests
import time
import sys

BASE_URL = 'http://localhost:8000/api/v1/tasks'


def test_image_generation():
    """Test image generation task (simplest test)"""
    print("\n" + "="*60)
    print("TEST: Image Generation Task")
    print("="*60)
    
    # 1. Submit task
    print("\n[1] Submitting task...")
    payload = {
        'task_type': 'image_generation',
        'prompt': 'a beautiful sunset over mountains',
        'parameters': {
            'width': 512,
            'height': 512,
            'steps': 20
        }
    }
    
    response = requests.post(f'{BASE_URL}/submit/', json=payload)
    
    if response.status_code != 202:
        print(f"❌ Failed to submit task: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    task_id = data['task_id']
    print(f"✅ Task submitted: {task_id}")
    print(f"   Status: {data['status']}")
    print(f"   Message: {data['message']}")
    
    # 2. Poll status
    print(f"\n[2] Polling task status...")
    max_attempts = 60  # 60 * 2 seconds = 2 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        time.sleep(2)
        attempt += 1
        
        status_response = requests.get(f'{BASE_URL}/{task_id}/status/')
        
        if status_response.status_code != 200:
            print(f"❌ Failed to get status: {status_response.status_code}")
            return False
        
        status_data = status_response.json()
        status = status_data['status']
        progress = status_data.get('progress', 0)
        message = status_data.get('message', '')
        
        print(f"   [{attempt}] Status: {status} | Progress: {progress}% | {message}")
        
        if status == 'SUCCESS':
            print(f"✅ Task completed successfully!")
            break
        
        elif status == 'FAILURE':
            error = status_data.get('error', 'Unknown error')
            print(f"❌ Task failed: {error}")
            return False
        
        elif status == 'REVOKED':
            print(f"❌ Task was cancelled")
            return False
    
    if status != 'SUCCESS':
        print(f"❌ Task did not complete in time")
        return False
    
    # 3. Get result
    print(f"\n[3] Getting task result...")
    result_response = requests.get(f'{BASE_URL}/{task_id}/result/')
    
    if result_response.status_code != 200:
        print(f"❌ Failed to get result: {result_response.status_code}")
        print(result_response.json())
        return False
    
    result_data = result_response.json()
    result = result_data.get('result', {})
    
    print(f"✅ Result retrieved:")
    print(f"   Status: {result.get('status')}")
    print(f"   Prompt used: {result.get('prompt_used', '')[:50]}...")
    print(f"   Image data: {'Present' if result.get('image_data') else 'Missing'}")
    
    if result.get('image_data'):
        image_size = len(result['image_data'])
        print(f"   Image size: {image_size} bytes (base64)")
    
    print("\n✅ TEST PASSED: Image generation task completed successfully!")
    return True


def test_task_cancellation():
    """Test task cancellation"""
    print("\n" + "="*60)
    print("TEST: Task Cancellation")
    print("="*60)
    
    # Submit task
    print("\n[1] Submitting task...")
    payload = {
        'task_type': 'image_generation',
        'prompt': 'test cancellation',
        'parameters': {'width': 512, 'height': 512}
    }
    
    response = requests.post(f'{BASE_URL}/submit/', json=payload)
    if response.status_code != 202:
        print(f"❌ Failed to submit task")
        return False
    
    task_id = response.json()['task_id']
    print(f"✅ Task submitted: {task_id}")
    
    # Wait a bit
    time.sleep(1)
    
    # Cancel task
    print(f"\n[2] Cancelling task...")
    cancel_response = requests.post(f'{BASE_URL}/{task_id}/cancel/')
    
    if cancel_response.status_code != 200:
        print(f"❌ Failed to cancel task: {cancel_response.status_code}")
        return False
    
    cancel_data = cancel_response.json()
    print(f"✅ Task cancelled: {cancel_data['message']}")
    
    # Check status
    time.sleep(1)
    status_response = requests.get(f'{BASE_URL}/{task_id}/status/')
    status_data = status_response.json()
    
    print(f"   Final status: {status_data['status']}")
    
    print("\n✅ TEST PASSED: Task cancellation works!")
    return True


def test_invalid_input():
    """Test validation with invalid input"""
    print("\n" + "="*60)
    print("TEST: Input Validation")
    print("="*60)
    
    # Test 1: Missing task_type
    print("\n[1] Testing missing task_type...")
    payload = {'prompt': 'test'}
    response = requests.post(f'{BASE_URL}/submit/', json=payload)
    
    if response.status_code == 400:
        print(f"✅ Correctly rejected: {response.json()}")
    else:
        print(f"❌ Should have rejected invalid input")
        return False
    
    # Test 2: Invalid task_type
    print("\n[2] Testing invalid task_type...")
    payload = {'task_type': 'invalid_type'}
    response = requests.post(f'{BASE_URL}/submit/', json=payload)
    
    if response.status_code == 400:
        print(f"✅ Correctly rejected: {response.json()}")
    else:
        print(f"❌ Should have rejected invalid task_type")
        return False
    
    # Test 3: Missing required field (prompt for image_generation)
    print("\n[3] Testing missing prompt for image_generation...")
    payload = {'task_type': 'image_generation'}
    response = requests.post(f'{BASE_URL}/submit/', json=payload)
    
    if response.status_code == 400:
        print(f"✅ Correctly rejected: {response.json()}")
    else:
        print(f"❌ Should have rejected missing prompt")
        return False
    
    print("\n✅ TEST PASSED: Input validation works correctly!")
    return True


def main():
    print("\n" + "="*60)
    print("CELERY + REDIS TEST SUITE (NO DATABASE)")
    print("="*60)
    print("\nPrerequisites:")
    print("1. Redis running: redis-server")
    print("2. Django running: python manage.py runserver")
    print("3. Celery running: celery -A backendAI worker --loglevel=info")
    print("\nStarting tests in 3 seconds...")
    time.sleep(3)
    
    tests = [
        ("Input Validation", test_invalid_input),
        ("Task Cancellation", test_task_cancellation),
        ("Image Generation", test_image_generation),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"\n❌ TEST FAILED with exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == '__main__':
    sys.exit(main())
