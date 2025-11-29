from fastapi import Request, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Callable

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def auth_middleware(request: Request, call_next: Callable):
    token = request.headers.get("Authorization")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Here you would typically verify the token and extract user information
    # For example:
    # user = verify_token(token)
    # if not user:
    #     raise HTTPException(status_code=401, detail="Invalid token")
    
    response = await call_next(request)
    return response