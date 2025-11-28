from fastapi import HTTPException
import httpx
from config.settings import SERVICE_URLS

async def proxy_request(service_name: str, endpoint: str, method: str, payload: dict = None):
    if service_name not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail="Service not found")

    url = f"{SERVICE_URLS[service_name]}{endpoint}"

    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url)
        elif method == "POST":
            response = await client.post(url, json=payload)
        elif method == "PUT":
            response = await client.put(url, json=payload)
        elif method == "DELETE":
            response = await client.delete(url)
        else:
            raise HTTPException(status_code=400, detail="Invalid HTTP method")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()