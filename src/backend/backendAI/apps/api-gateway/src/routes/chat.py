from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.chat_service import ChatService

router = APIRouter()

class ChatSessionCreateRequest(BaseModel):
    user_id: str
    messages: list[str]

class ChatSessionResponse(BaseModel):
    session_id: str
    messages: list[str]

@router.post("/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(request: ChatSessionCreateRequest):
    try:
        session = ChatService.create_session(request.user_id, request.messages)
        return ChatSessionResponse(session_id=session.id, messages=session.messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str):
    try:
        session = ChatService.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return ChatSessionResponse(session_id=session.id, messages=session.messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    try:
        success = ChatService.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"detail": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))