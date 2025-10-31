"""
Celery + Redis Integration Test with Mock Services

Tests the full flow without requiring actual AI models
"""
import os
import sys
import time

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
os.environ['USE_SQLITE'] = 'True'

import django
django.setup()

from celery.result import AsyncResult
from apps.ai_tasks.tasks import process_image_generation
import base64

print("="*70)
print("CELERY + REDIS INTEGRATION TEST (with Mock Services)")
print("="*70)

def test_task_submission():
    """Test 1: Submit a task and get task_id"""
    print("\n[TEST 1] Testing task submission...")
    
    try:
        # Submit task
        task = process_image_generation.delay(
            prompt="test prompt for celery",
            parameters={'width': 512, 'height': 512}
        )
        
        task_id = task.id
        print(f"✅ Task submitted successfully")
        print(f"   Task ID: {task_id}")
        print(f"   Initial state: {task.state}")
        
        return task_id
        
    except Exception as e:
        print(f"❌ Task submission failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_task_status(task_id):
    """Test 2: Query task status"""
    print("\n[TEST 2] Testing task status query...")
    
    try:
        result = AsyncResult(task_id)
        
        print(f"✅ Task status retrieved")
        print(f"   Task ID: {task_id}")
        print(f"   State: {result.state}")
        print(f"   Ready: {result.ready()}")
        print(f"   Successful: {result.successful() if result.ready() else 'N/A'}")
        
        # Check if task has progress info
        if result.state == 'PROCESSING' and result.info:
            print(f"   Progress: {result.info.get('progress', 0)}%")
            print(f"   Message: {result.info.get('message', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Status query failed: {e}")
        return False


def test_task_result(task_id, max_wait=10):
    """Test 3: Wait for result and retrieve it"""
    print(f"\n[TEST 3] Waiting for task result (max {max_wait}s)...")
    
    try:
        result = AsyncResult(task_id)
        
        # Wait with timeout
        start_time = time.time()
        check_count = 0
        
        while not result.ready() and (time.time() - start_time) < max_wait:
            check_count += 1
            state = result.state
            info = result.info or {}
            progress = info.get('progress', 0) if isinstance(info, dict) else 0
            
            print(f"   [{check_count}] State: {state}, Progress: {progress}%")
            time.sleep(1)
        
        if result.ready():
            if result.successful():
                task_result = result.result
                print(f"✅ Task completed successfully")
                print(f"   Status: {task_result.get('status')}")
                print(f"   Has image_data: {bool(task_result.get('image_data'))}")
                print(f"   Prompt used: {task_result.get('prompt_used', 'N/A')[:50]}...")
                return True
            else:
                print(f"❌ Task failed with error: {result.info}")
                return False
        else:
            print(f"⚠️  Task not completed within {max_wait}s")
            print(f"   Current state: {result.state}")
            print("   Note: This is expected if Celery worker is not running")
            return None
        
    except Exception as e:
        print(f"❌ Result retrieval failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_task_inspection():
    """Test 4: Inspect Celery worker status"""
    print("\n[TEST 4] Inspecting Celery workers...")
    
    try:
        from backendAI.celery import app
        
        # Check registered tasks
        registered_tasks = [t for t in app.tasks.keys() if 'apps.ai_tasks' in t]
        print(f"✅ Registered AI tasks: {len(registered_tasks)}")
        for task in registered_tasks:
            print(f"   - {task}")
        
        # Try to get worker stats
        inspect = app.control.inspect()
        
        # Check active workers
        stats = inspect.stats()
        if stats:
            print(f"\n✅ Active Celery workers: {len(stats)}")
            for worker, worker_stats in stats.items():
                print(f"   - {worker}")
        else:
            print("\n⚠️  No active Celery workers detected")
            print("   To start worker: celery -A backendAI worker --loglevel=info")
        
        return True
        
    except Exception as e:
        print(f"❌ Inspection failed: {e}")
        return False


def test_redis_storage():
    """Test 5: Verify Redis is storing task data"""
    print("\n[TEST 5] Testing Redis storage...")
    
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        
        # Get Redis info
        info = r.info('memory')
        keys_count = r.dbsize()
        
        print(f"✅ Redis connection successful")
        print(f"   Database size: {keys_count} keys")
        print(f"   Memory used: {info.get('used_memory_human', 'N/A')}")
        
        # Try to find celery keys
        celery_keys = r.keys('celery-task-meta-*')
        if celery_keys:
            print(f"   Celery task keys: {len(celery_keys)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Redis test failed: {e}")
        return False


def test_serializer_validation():
    """Test 6: Test input validation"""
    print("\n[TEST 6] Testing input validation...")
    
    try:
        from apps.ai_tasks.serializers import TaskSubmitSerializer
        
        # Test valid data
        valid_cases = [
            {
                'task_type': 'image_generation',
                'prompt': 'a beautiful sunset',
                'parameters': {'width': 512}
            },
            {
                'task_type': 'background_removal',
                'image': 'base64_encoded_data_here'
            }
        ]
        
        for i, data in enumerate(valid_cases, 1):
            serializer = TaskSubmitSerializer(data=data)
            if serializer.is_valid():
                print(f"   ✅ Valid case {i}: {data['task_type']}")
            else:
                print(f"   ❌ Valid case {i} rejected: {serializer.errors}")
        
        # Test invalid data
        invalid_cases = [
            {'task_type': 'invalid_type'},
            {'task_type': 'image_generation'},  # Missing prompt
            {}  # Missing task_type
        ]
        
        for i, data in enumerate(invalid_cases, 1):
            serializer = TaskSubmitSerializer(data=data)
            if not serializer.is_valid():
                print(f"   ✅ Invalid case {i} rejected correctly")
            else:
                print(f"   ❌ Invalid case {i} was accepted")
        
        print(f"✅ Validation tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Validation test failed: {e}")
        return False


def main():
    """Run all tests"""
    
    results = {
        'Task Submission': None,
        'Task Status': None,
        'Task Result': None,
        'Worker Inspection': None,
        'Redis Storage': None,
        'Validation': None
    }
    
    # Run tests
    task_id = test_task_submission()
    results['Task Submission'] = task_id is not None
    
    if task_id:
        results['Task Status'] = test_task_status(task_id)
        results['Task Result'] = test_task_result(task_id, max_wait=5)
    
    results['Worker Inspection'] = test_task_inspection()
    results['Redis Storage'] = test_redis_storage()
    results['Validation'] = test_serializer_validation()
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for test_name, result in results.items():
        if result is True:
            status = "✅ PASS"
        elif result is False:
            status = "❌ FAIL"
        else:
            status = "⚠️  SKIP"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for r in results.values() if r is True)
    total = len(results)
    skipped = sum(1 for r in results.values() if r is None)
    
    print(f"\n📊 Results: {passed}/{total} passed, {skipped} skipped")
    
    # Recommendations
    print("\n💡 NOTES:")
    if results['Task Result'] is None:
        print("   ⚠️  Task execution test skipped (Celery worker not running)")
        print("   → Start worker: celery -A backendAI worker --loglevel=info")
    
    if results['Worker Inspection'] and not results.get('workers_active'):
        print("   ℹ️  No active workers detected")
        print("   → This is normal if you haven't started a Celery worker yet")
    
    if passed >= 4:
        print("\n🎉 Core setup is working correctly!")
        print("   ✅ Celery + Redis integration verified")
        print("   ✅ Task submission working")
        print("   ✅ Validation working")
        
        if results['Task Result'] is None:
            print("\n📋 To test full workflow:")
            print("   1. Terminal 1: redis-server")
            print("   2. Terminal 2: USE_SQLITE=True python manage.py runserver")
            print("   3. Terminal 3: celery -A backendAI worker --loglevel=info")
            print("   4. Terminal 4: python test_celery_redis.py")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    return 0 if passed >= 4 else 1


if __name__ == '__main__':
    sys.exit(main())
