from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    # API Settings
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://mefit.kr",
        "https://www.mefit.kr",
        "https://api.mefit.kr",   
    ]

    # Backend API for token verification
    BACKEND_API_URL: str = "http://localhost:8000"  # Default for local development
    TOKEN_VERIFY_ENDPOINT: str = "/api/v1/users/tokens/verify/"


settings = Settings()
