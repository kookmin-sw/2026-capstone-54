from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from booth_rag.config import get_settings

router = APIRouter(tags=["pages"])


def _templates(req: Request) -> Jinja2Templates:
    return req.app.state.templates


def _booth_context() -> dict[str, str]:
    s = get_settings()
    return {
        "team_number": s.booth_team_number,
        "team_name": s.booth_team_name,
        "domain_url": s.booth_domain_url,
        "team_page_url": s.booth_team_page_url,
    }


@router.get("/", response_class=HTMLResponse)
async def index(req: Request):
    rag = req.app.state.rag_service
    return _templates(req).TemplateResponse(
        req,
        "chat.html",
        {"booth": _booth_context(), "stats": rag.stats()},
    )


@router.get("/admin", response_class=HTMLResponse)
async def admin_page(req: Request):
    settings = get_settings()
    return _templates(req).TemplateResponse(
        req,
        "admin.html",
        {"booth": _booth_context(), "admin_enabled": settings.admin_enabled},
    )


@router.get("/health")
async def health(req: Request):
    return {"status": "ok", **req.app.state.rag_service.stats()}
