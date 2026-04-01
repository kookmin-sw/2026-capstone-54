"""
Language-related API routes.
"""

from fastapi import APIRouter

from app.api.schemas import LanguageInfo, LanguagesResponse, VoiceOption, VoicesByLanguageResponse
from app.core.constants import LANGUAGES, VOICES_BY_LANGUAGE

router = APIRouter()


@router.get("/languages", response_model=LanguagesResponse)
async def get_languages():
    """
    Get list of supported languages.

    No authentication required - public endpoint.
    """
    languages = [LanguageInfo(**lang) for lang in LANGUAGES]
    return LanguagesResponse(languages=languages)


@router.get("/voices-by-language", response_model=VoicesByLanguageResponse)
async def get_voices_by_language():
    """
    Get voices grouped by language code.

    No authentication required - public endpoint.

    Returns predefined voices for each supported language.
    """
    voices_dict = {
        lang_code: [VoiceOption(**voice) for voice in voices] for lang_code, voices in VOICES_BY_LANGUAGE.items()
    }
    return VoicesByLanguageResponse(voices=voices_dict)
