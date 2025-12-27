from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.response_utils import APIResponse
from .serializers import PromptRefineRequestSerializer, PromptRefineResponseSerializer
from .celery_tasks import process_prompt_task
from .services import PromptService


class PromptRefineView(APIView):
    def post(self, request):
        req_ser = PromptRefineRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return APIResponse.error(message="Validation failed", result=req_ser.errors)

        task = process_prompt_task.delay(req_ser.validated_data)
        return APIResponse.success(
            result={
                "status": "PROCESSING",
                "request_id": task.id,
            },
            message="Prompt processing task started",
            status_code=status.HTTP_202_ACCEPTED
        )


class TestParameterExtractionView(APIView):
    """
    Test endpoint for parameter extraction without calling Freepik API
    
    POST /api/v1/prompt-service/test-extract
    {
        "prompt": "Upscale this photo"
    }
    
    Response:
    {
        "code": 1,
        "message": "Parameter extraction successful",
        "result": {
            "refined_prompt": "Upscale this photograph with enhanced details",
            "intent": "upscale",
            "extracted_params": {
                "flavor": "photo"
            },
            "metadata": {
                "model": "gemini-2.5-flash",
                "processing_time": 1.234
            }
        }
    }
    """
    
    def post(self, request):
        # Get prompt from request
        prompt = request.data.get('prompt')
        
        if not prompt:
            return APIResponse.error(
                message="Prompt is required",
                result={"error": "Missing 'prompt' field"}
            )
        
        # Get optional context
        context = request.data.get('context', {})
        
        try:
            # Call PromptService directly (synchronous, no Celery)
            result = PromptService.refine_and_detect_intent(prompt, context)
            
            return APIResponse.success(
                message="Parameter extraction successful",
                result=result
            )
            
        except Exception as e:
            import traceback
            return APIResponse.error(
                message=f"Parameter extraction failed: {str(e)}",
                result={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
