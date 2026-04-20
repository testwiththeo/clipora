from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Clipora"
    app_version: str = "0.1.0"
    debug: bool = True

    # API
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/clipora.db"

    # Storage
    data_dir: str = "./data"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def data_path(self) -> Path:
        path = Path(self.data_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def episodes_path(self) -> Path:
        path = self.data_path / "episodes"
        path.mkdir(parents=True, exist_ok=True)
        return path

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
