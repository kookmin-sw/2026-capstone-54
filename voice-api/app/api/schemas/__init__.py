"""
API schemas package.
"""

from app.api.schemas.language import LanguageInfo, LanguagesResponse, VoiceOption, VoicesByLanguageResponse
from app.api.schemas.parameter import ParameterRange, ParametersResponse
from app.api.schemas.tts import TTSRequest, TTSResponse
from app.api.schemas.voice import VoiceInfo, VoicesResponse

__all__ = [
    # Language schemas
    "LanguageInfo",
    "LanguagesResponse",
    "VoiceOption",
    "VoicesByLanguageResponse",
    # Parameter schemas
    "ParameterRange",
    "ParametersResponse",
    # TTS schemas
    "TTSRequest",
    "TTSResponse",
    # Voice schemas
    "VoiceInfo",
    "VoicesResponse",
]
