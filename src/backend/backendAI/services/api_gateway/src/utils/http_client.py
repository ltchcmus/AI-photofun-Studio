import httpx

class HttpClient:
    def __init__(self, base_url):
        self.base_url = base_url

    async def get(self, endpoint, params=None):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{endpoint}", params=params)
            response.raise_for_status()
            return response.json()

    async def post(self, endpoint, json=None):
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}{endpoint}", json=json)
            response.raise_for_status()
            return response.json()

    async def put(self, endpoint, json=None):
        async with httpx.AsyncClient() as client:
            response = await client.put(f"{self.base_url}{endpoint}", json=json)
            response.raise_for_status()
            return response.json()

    async def delete(self, endpoint):
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{self.base_url}{endpoint}")
            response.raise_for_status()
            return response.json()