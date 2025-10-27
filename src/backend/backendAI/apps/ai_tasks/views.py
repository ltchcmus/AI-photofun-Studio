"""
API Views for AI Task Management

Query Redis directly - NO DATABASE
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from celery.result import AsyncResult
from .serializers import (
    TaskSubmitSerializer,
    TaskStatusSerializer,
    TaskResultSerializer,
    TaskSubmitResponseSerializer
)
from .tasks import (
    process_image_generation,
    process_face_swap,
    process_background_removal,
    process_object_removal,
    process_style_transfer
)
import logging

logger = logging.getLogger(__name__)


class TaskSubmitView(APIView):
    """
    Submit new AI task
    
    POST /api/v1/tasks/submit/
    
    Body:
    {
        "task_type": "image_generation",
        "prompt": "beautiful sunset",
        "image": "<base64>",  // optional
        "target_image": "<base64>",  // optional (face_swap)
        "parameters": {"width": 512, "height": 512}
    }
    
    Response:
    {
        "task_id": "abc-123-def",
        "status": "PENDING",
        "message": "Task submitted successfully"
    }
    """
    
    def post(self, request):
        # Validate input
        serializer = TaskSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid input', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        task_type = validated_data['task_type']
        
        try:
            # Route to appropriate task
            if task_type == 'image_generation':
                task = process_image_generation.delay(
                    prompt=validated_data['prompt'],
                    parameters=validated_data.get('parameters', {})
                )
            
            elif task_type == 'face_swap':
                task = process_face_swap.delay(
                    source_image_b64=validated_data['image'],
                    target_image_b64=validated_data['target_image'],
                    parameters=validated_data.get('parameters', {})
                )
            
            elif task_type == 'background_removal':
                task = process_background_removal.delay(
                    image_b64=validated_data['image'],
                    parameters=validated_data.get('parameters', {})
                )
            
            elif task_type == 'object_removal':
                task = process_object_removal.delay(
                    image_b64=validated_data['image'],
                    parameters=validated_data.get('parameters', {})
                )
            
            elif task_type == 'style_transfer':
                task = process_style_transfer.delay(
                    image_b64=validated_data['image'],
                    parameters=validated_data.get('parameters', {})
                )
            
            else:
                return Response(
                    {'error': f'Unknown task_type: {task_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Task submitted: {task.id} (type: {task_type})")
            
            response_serializer = TaskSubmitResponseSerializer(data={
                'task_id': task.id,
                'status': 'PENDING',
                'message': f'{task_type} task submitted successfully'
            })
            response_serializer.is_valid()
            
            return Response(
                response_serializer.data,
                status=status.HTTP_202_ACCEPTED
            )
        
        except Exception as exc:
            logger.error(f"Failed to submit task: {str(exc)}")
            return Response(
                {'error': 'Failed to submit task', 'details': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TaskStatusView(APIView):
    """
    Check task status
    
    GET /api/v1/tasks/{task_id}/status/
    
    Response:
    {
        "task_id": "abc-123",
        "status": "PROCESSING",
        "progress": 50,
        "message": "Generating image",
        "result_available": false
    }
    """
    
    def get(self, request, task_id):
        try:
            result = AsyncResult(task_id)
            
            response_data = {
                'task_id': task_id,
                'status': result.state,
            }
            
            if result.state == 'PENDING':
                response_data['message'] = 'Task is waiting in queue'
                response_data['progress'] = 0
                response_data['result_available'] = False
            
            elif result.state == 'PROCESSING':
                # Get progress from task meta
                info = result.info or {}
                response_data['progress'] = info.get('progress', 0)
                response_data['message'] = info.get('message', 'Task is processing')
                response_data['result_available'] = False
            
            elif result.state == 'SUCCESS':
                response_data['message'] = 'Task completed successfully'
                response_data['progress'] = 100
                response_data['result_available'] = True
            
            elif result.state == 'FAILURE':
                info = result.info or {}
                response_data['error'] = str(info.get('error', result.info))
                response_data['message'] = 'Task failed'
                response_data['progress'] = 0
                response_data['result_available'] = False
            
            elif result.state == 'REVOKED':
                response_data['message'] = 'Task was cancelled'
                response_data['progress'] = 0
                response_data['result_available'] = False
            
            else:
                response_data['message'] = f'Unknown state: {result.state}'
                response_data['progress'] = 0
                response_data['result_available'] = False
            
            # Validate with serializer
            serializer = TaskStatusSerializer(data=response_data)
            serializer.is_valid()
            
            return Response(serializer.data)
        
        except Exception as exc:
            logger.error(f"Failed to get task status: {str(exc)}")
            return Response(
                {'error': 'Failed to get task status', 'details': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TaskResultView(APIView):
    """
    Get task result
    
    GET /api/v1/tasks/{task_id}/result/
    
    Response (success):
    {
        "task_id": "abc-123",
        "status": "SUCCESS",
        "result": {
            "image_data": "<base64>",
            "prompt_used": "beautiful sunset...",
            "metadata": {...}
        }
    }
    
    Response (failure):
    {
        "task_id": "abc-123",
        "status": "FAILURE",
        "error": "Error message"
    }
    """
    
    def get(self, request, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.state == 'SUCCESS':
                response_data = {
                    'task_id': task_id,
                    'status': 'SUCCESS',
                    'result': result.result
                }
                
                serializer = TaskResultSerializer(data=response_data)
                serializer.is_valid()
                
                return Response(serializer.data)
            
            elif result.state == 'FAILURE':
                response_data = {
                    'task_id': task_id,
                    'status': 'FAILURE',
                    'error': str(result.info)
                }
                
                serializer = TaskResultSerializer(data=response_data)
                serializer.is_valid()
                
                return Response(
                    serializer.data,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            else:
                return Response({
                    'task_id': task_id,
                    'status': result.state,
                    'message': 'Task not completed yet. Use /status/ endpoint to check progress.'
                }, status=status.HTTP_202_ACCEPTED)
        
        except Exception as exc:
            logger.error(f"Failed to get task result: {str(exc)}")
            return Response(
                {'error': 'Failed to get task result', 'details': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TaskCancelView(APIView):
    """
    Cancel a task
    
    POST /api/v1/tasks/{task_id}/cancel/
    
    Response:
    {
        "task_id": "abc-123",
        "message": "Task cancelled successfully"
    }
    """
    
    def post(self, request, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.state in ['SUCCESS', 'FAILURE']:
                return Response({
                    'task_id': task_id,
                    'message': f'Task already {result.state.lower()}, cannot cancel'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Revoke task
            result.revoke(terminate=True)
            
            logger.info(f"Task cancelled: {task_id}")
            
            return Response({
                'task_id': task_id,
                'message': 'Task cancelled successfully'
            })
        
        except Exception as exc:
            logger.error(f"Failed to cancel task: {str(exc)}")
            return Response(
                {'error': 'Failed to cancel task', 'details': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
