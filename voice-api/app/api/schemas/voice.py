"""
Voice-related schemas for edge-tts voice listing.
"""

from pydantic import BaseModel, Field


class VoiceInfo(BaseModel):
    """
    Detailed voice information from edge-tts.
    This is used for the /voices endpoint that returns all 322 voices.
    """

    name: str = Field(..., description="Voice name (e.g., 'ko-KR-SunHiNeural')")
    gender: str = Field(..., description="Voice gender (Male/Female)")
    locale: str = Field(..., description="Locale code (e.g., 'ko-KR', 'en-US')")
    short_name: str = Field(..., description="Short name")
    suggested_codec: str = Field(..., description="Suggested audio codec")
    friendly_name: str = Field(..., description="Human-readable name")
    status: str = Field(..., description="Voice status")


class VoicesResponse(BaseModel):
    voices: list[VoiceInfo] = Field(..., description="List of available voices")
