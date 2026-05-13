"""
API routes package.
"""

from fastapi import APIRouter

from app.api.routes import language, parameter, tts, voice

# Create main API router
router = APIRouter()

# Include sub-routers
router.include_router(language.router, tags=["Languages"])
router.include_router(parameter.router, tags=["Parameters"])
router.include_router(voice.router, tags=["Voices"])
router.include_router(tts.router, tags=["TTS"])

__all__ = ["router"]
