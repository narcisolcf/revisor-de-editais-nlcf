"""
Configuration settings for the Analyzer Service
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_KEY: str = "your-secret-api-key"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Google Cloud Configuration
    GCP_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    
    # Firestore Configuration
    FIRESTORE_COLLECTION: str = "documents"
    CONFIG_COLLECTION: str = "organization_configs"
    
    # File Processing
    MAX_FILE_SIZE: int = 52428800  # 50MB
    TEMP_UPLOAD_DIR: str = "/tmp/licitareview"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Analysis Configuration
    DEFAULT_TIMEOUT: int = 300  # 5 minutes
    MAX_RETRY_ATTEMPTS: int = 3
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Global settings instance
settings = Settings()