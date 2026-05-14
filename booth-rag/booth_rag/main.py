from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from booth_rag.api import admin, chat, pages, sessions
from booth_rag.config import get_settings
from booth_rag.db.session_store import SessionStore
from booth_rag.rag.service import get_rag_service
from booth_rag.utils.qr_generator import ensure_booth_qrs

PACKAGE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = PACKAGE_DIR / "ui" / "templates"
STATIC_DIR = PACKAGE_DIR / "ui" / "static"


@asynccontextmanager
async def _lifespan(app: FastAPI):
    settings = get_settings()
    store = SessionStore(settings.chat_db_path)
    await store.init()
    rag_service = get_rag_service()
    ensure_booth_qrs(
        STATIC_DIR / "img",
        mefit_url=settings.booth_domain_url,
        team_page_url=settings.booth_team_page_url,
    )
    app.state.session_store = store
    app.state.rag_service = rag_service
    app.state.templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="booth-rag",
        description="MeFit 캡스톤 부스용 RAG + LLM Agent",
        version="0.1.0",
        debug=settings.debug,
        lifespan=_lifespan,
    )
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    app.include_router(pages.router)
    app.include_router(chat.router)
    app.include_router(sessions.router)
    app.include_router(admin.router)
    return app


app = create_app()
