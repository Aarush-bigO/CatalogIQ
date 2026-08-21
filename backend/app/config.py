"""Application configuration using Pydantic Settings."""

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Search and load .env from current dir, backend dir, and root dir
base_dir = Path(__file__).resolve().parent.parent
root_dir = base_dir.parent
for env_path in [base_dir / ".env", root_dir / ".env", Path(".env")]:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    secret_key: str = Field(default="dev-secret-key", alias="SECRET_KEY")

    # Database — SQLite by default (no Docker needed)
    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/product_intelligence.db",
        alias="DATABASE_URL",
    )
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")

    # Mock AI mode (auto-disabled if Gemini API key is provided)
    use_mock_ai: bool = Field(default=False, alias="USE_MOCK_AI")

    # Gemini AI Provider (supports GEMINI_API_KEY, GOOGLE_API_KEY)
    gemini_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_KEY"),
        alias="GEMINI_API_KEY",
    )
    gemini_model: str = Field(default="gemini-3.1-flash-lite", alias="GEMINI_MODEL")

    # Alternative LLM Providers
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")

    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", alias="ANTHROPIC_MODEL")


    # Upload
    max_upload_size_mb: int = Field(default=50, alias="MAX_UPLOAD_SIZE_MB")
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    allowed_extensions: str = Field(
        default="pdf,png,jpg,jpeg,tif,tiff,xlsx,csv,docx,txt",
        alias="ALLOWED_EXTENSIONS",
    )

    @field_validator("allowed_extensions")
    @classmethod
    def parse_extensions(cls, v: str) -> str:
        return v.lower().replace(" ", "")

    @property
    def allowed_extensions_list(self) -> List[str]:
        return self.allowed_extensions.split(",")

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def database_path(self) -> str:
        """Extract the file path from the SQLite URL."""
        url = self.database_url
        if url.startswith("sqlite"):
            return url.split("///")[-1] if "///" in url else ""
        return ""


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance."""
    return Settings()
