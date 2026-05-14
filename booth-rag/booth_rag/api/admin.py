from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Header, HTTPException, Request, UploadFile

from booth_rag.config import get_settings

router = APIRouter(prefix="/api/admin", tags=["admin"])

_ALLOWED_SUFFIXES = {".md", ".markdown", ".mdx", ".txt", ".rst", ".docx"}


def _require_admin(x_admin_token: str = Header(default="")):
    settings = get_settings()
    if not settings.admin_enabled:
        raise HTTPException(status_code=403, detail="Admin disabled (ADMIN_TOKEN not set)")
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


@router.get("/status", dependencies=[Depends(_require_admin)])
async def status(req: Request):
    return req.app.state.rag_service.stats()


@router.post("/upload", dependencies=[Depends(_require_admin)])
async def upload_doc(req: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename missing")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"unsupported file type: {suffix} (allowed: {sorted(_ALLOWED_SUFFIXES)})",
        )
    settings = get_settings()
    dest = settings.uploads_dir / file.filename
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    stats = req.app.state.rag_service.ingest_document_path(dest)
    return {
        "filename": file.filename,
        "stored_at": str(dest.relative_to(settings.data_dir.parent)),
        "chunks_indexed": stats.chunks_indexed,
    }


@router.post("/ingest-codebase", dependencies=[Depends(_require_admin)])
async def ingest_codebase(
    background: BackgroundTasks,
    req: Request,
    max_files: int | None = None,
    dirs: str | None = None,
):
    rag = req.app.state.rag_service
    if rag.is_ingesting:
        raise HTTPException(status_code=409, detail="Ingestion already in progress")

    include_top_dirs = None
    if dirs:
        include_top_dirs = tuple(p.strip() for p in dirs.split(",") if p.strip())

    def _run():
        rag.ingest_codebase(max_files=max_files, include_top_dirs=include_top_dirs)

    background.add_task(_run)
    return {
        "started": True,
        "max_files": max_files,
        "dirs": list(include_top_dirs) if include_top_dirs else None,
        "hint": "Poll /api/admin/progress to watch live updates.",
    }


@router.get("/progress", dependencies=[Depends(_require_admin)])
async def progress(req: Request):
    rag = req.app.state.rag_service
    return {
        "is_ingesting": rag.is_ingesting,
        "last_progress": (
            {
                "phase": rag.last_progress.phase,
                "current": rag.last_progress.current,
                "total": rag.last_progress.total,
                "pct": round(rag.last_progress.pct, 1),
                "message": rag.last_progress.message,
            }
            if rag.last_progress is not None
            else None
        ),
    }


@router.post("/reset", dependencies=[Depends(_require_admin)])
async def reset_index(req: Request):
    req.app.state.rag_service.reset_index()
    return {"reset": True}
