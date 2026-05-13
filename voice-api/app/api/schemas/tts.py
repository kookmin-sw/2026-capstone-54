"""
TTS (Text-to-Speech) related schemas.
"""

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    language: str = Field(
        default="ko",
        description="Language code (e.g., 'ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', etc.)",
        examples=["ko", "en", "ja", "zh", "es", "fr", "de"],
    )
    voice: str | None = Field(
        default=None,
        description="Specific voice name (e.g., 'ko-KR-SunHiNeural', 'en-US-AriaNeural'). If not provided, uses default voice for the language.",
        examples=["ko-KR-SunHiNeural", "ko-KR-InJoonNeural", "en-US-AriaNeural", "en-US-GuyNeural"],
    )
    rate: str = Field(
        default="+0%",
        description="Speaking rate adjustment (-50% to +100%)",
        examples=["-50%", "+0%", "+50%", "+100%"],
        pattern=r"^[+-]\d+%$",
    )
    volume: str = Field(
        default="+0%",
        description="Volume adjustment (-50% to +100%)",
        examples=["-50%", "+0%", "+50%", "+100%"],
        pattern=r"^[+-]\d+%$",
    )
    pitch: str = Field(
        default="+0Hz",
        description="Pitch adjustment (-50Hz to +50Hz)",
        examples=["-50Hz", "+0Hz", "+25Hz", "+50Hz"],
        pattern=r"^[+-]\d+Hz$",
    )


class TTSResponse(BaseModel):
    text: str = Field(..., description="Original text")
    audio_base64: str = Field(..., description="Base64 encoded audio data")
    voice: str = Field(..., description="Voice used for generation")
    rate: str = Field(..., description="Speaking rate used")
    volume: str = Field(..., description="Volume used")
    pitch: str = Field(..., description="Pitch used")
