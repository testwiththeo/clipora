from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import setup_logging
from app.api.v1.router import api_router
import app.models  # noqa: F401 — register all models with SQLAlchemy


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    setup_logging(debug=settings.debug)
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)

# Serve rendered previews and exports as static files
_data_path = Path(settings.data_dir)
_data_path.mkdir(parents=True, exist_ok=True)
app.mount("/data", StaticFiles(directory=str(_data_path)), name="data")
