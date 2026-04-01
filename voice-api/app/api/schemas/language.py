"""
Language-related schemas.
"""

from pydantic import BaseModel, Field


class LanguageInfo(BaseModel):
    code: str = Field(..., description="Language code (e.g., 'ko', 'en')")
    name: str = Field(..., description="Language name")


class VoiceOption(BaseModel):
    name: str = Field(..., description="Voice name (e.g., 'ko-KR-SunHiNeural')")
    gender: str = Field(..., description="Voice gender (Male/Female)")


class LanguagesResponse(BaseModel):
    languages: list[LanguageInfo] = Field(..., description="List of supported languages")


class VoicesByLanguageResponse(BaseModel):
    voices: dict[str, list[VoiceOption]] = Field(..., description="Voices grouped by language code")
