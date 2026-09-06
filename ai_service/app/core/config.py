import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartTriage AI Decision Support Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "gemini-1.5-flash")

    # Backend communication
    BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "http://backend:8000/api/v1")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
