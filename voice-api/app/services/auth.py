import aiohttp
from fastapi import HTTPException, status

from app.core.config import settings


async def verify_token(token: str) -> dict:
    """Verify Bearer token with backend API."""
    url = f"{settings.BACKEND_API_URL}{settings.TOKEN_VERIFY_ENDPOINT}"

    print(f"[DEBUG] Verifying token with backend: {url}")
    print(f"[DEBUG] BACKEND_API_URL: {settings.BACKEND_API_URL}")

    timeout = aiohttp.ClientTimeout(total=10.0)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            # Django REST Framework SimpleJWT expects {"token": "..."} in body
            async with session.post(url, json={"token": token}) as response:
                print(f"[DEBUG] Backend response status: {response.status}")

                if response.status == 200:
                    # Token is valid, return empty dict (we don't need user data for now)
                    return {}
                elif response.status == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired token",
                    )
                else:
                    text = await response.text()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Token verification failed: {text}",
                    )
        except aiohttp.ClientConnectorError as e:
            print(f"[ERROR] Connection error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Backend service unavailable: {str(e)}",
            ) from e
        except aiohttp.ClientError as e:
            print(f"[ERROR] Request error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Backend request error: {str(e)}",
            ) from e
