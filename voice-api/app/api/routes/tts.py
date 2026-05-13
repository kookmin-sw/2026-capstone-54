"""
TTS (Text-to-Speech) API routes.
"""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.api.schemas import TTSRequest, TTSResponse
from app.core.constants import DEFAULT_VOICES
from app.services.tts import generate_audio

router = APIRouter()


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(
    request: TTSRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Convert text to speech and return base64 encoded audio.

    Requires Bearer token authentication.

    Supports customization options:
    - voice: Specific voice name (defaults to language-based voice)
    - rate: Speaking rate (-50% to +100%)
    - volume: Volume level (-50% to +100%)
    - pitch: Pitch adjustment (-50Hz to +50Hz)
    """
    audio_b64 = await generate_audio(
        text=request.text,
        language=request.language,
        voice=request.voice,
        rate=request.rate,
        volume=request.volume,
        pitch=request.pitch,
    )

    # Determine which voice was used
    voice_used = request.voice
    if not voice_used:
        voice_used = DEFAULT_VOICES.get(request.language, "en-US-AriaNeural")

    return TTSResponse(
        text=request.text,
        audio_base64=audio_b64,
        voice=voice_used,
        rate=request.rate,
        volume=request.volume,
        pitch=request.pitch,
    )
