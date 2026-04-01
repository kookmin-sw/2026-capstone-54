"""
Voice-related API routes.
"""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.api.schemas import VoiceInfo, VoicesResponse
from app.services.tts import list_voices

router = APIRouter()


@router.get("/voices", response_model=VoicesResponse)
async def get_voices(
    current_user: dict = Depends(get_current_user),
):
    """
    Get list of all available voices from edge-tts.

    Requires Bearer token authentication.

    Returns 322 voices across 142 languages/locales.
    This endpoint queries edge-tts directly for the complete voice list.
    """
    voices_data = await list_voices()

    voices = [
        VoiceInfo(
            name=v["Name"],
            gender=v.get("Gender", "Unknown"),
            locale=v.get("Locale", ""),
            short_name=v.get("ShortName", ""),
            suggested_codec=v.get("SuggestedCodec", ""),
            friendly_name=v.get("FriendlyName", ""),
            status=v.get("Status", ""),
        )
        for v in voices_data
    ]

    return VoicesResponse(voices=voices)
