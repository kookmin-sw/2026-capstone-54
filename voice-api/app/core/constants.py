"""
Constants for voice API including supported languages and voices.
"""

from typing import TypedDict


class LanguageInfo(TypedDict):
    code: str
    name: str


class VoiceInfo(TypedDict):
    name: str
    gender: str


# Supported languages
LANGUAGES: list[LanguageInfo] = [
    {"code": "ko", "name": "Korean"},
    {"code": "en", "name": "English"},
    {"code": "ja", "name": "Japanese"},
    {"code": "zh", "name": "Chinese"},
    {"code": "es", "name": "Spanish"},
    {"code": "fr", "name": "French"},
    {"code": "de", "name": "German"},
    {"code": "it", "name": "Italian"},
    {"code": "pt", "name": "Portuguese"},
    {"code": "ru", "name": "Russian"},
    {"code": "ar", "name": "Arabic"},
    {"code": "hi", "name": "Hindi"},
    {"code": "th", "name": "Thai"},
    {"code": "vi", "name": "Vietnamese"},
]

# Voices grouped by language
VOICES_BY_LANGUAGE: dict[str, list[VoiceInfo]] = {
    "ko": [
        {"name": "ko-KR-SunHiNeural", "gender": "Female"},
        {"name": "ko-KR-InJoonNeural", "gender": "Male"},
        {"name": "ko-KR-HyunsuMultilingualNeural", "gender": "Male"},
    ],
    "en": [
        {"name": "en-US-AriaNeural", "gender": "Female"},
        {"name": "en-US-GuyNeural", "gender": "Male"},
        {"name": "en-US-JennyNeural", "gender": "Female"},
        {"name": "en-US-AndrewNeural", "gender": "Male"},
        {"name": "en-US-EmmaNeural", "gender": "Female"},
        {"name": "en-US-BrianNeural", "gender": "Male"},
        {"name": "en-US-AvaNeural", "gender": "Female"},
        {"name": "en-US-ChristopherNeural", "gender": "Male"},
        {"name": "en-US-EricNeural", "gender": "Male"},
        {"name": "en-US-MichelleNeural", "gender": "Female"},
    ],
    "ja": [
        {"name": "ja-JP-NanamiNeural", "gender": "Female"},
        {"name": "ja-JP-KeitaNeural", "gender": "Male"},
    ],
    "zh": [
        {"name": "zh-CN-XiaoxiaoNeural", "gender": "Female"},
        {"name": "zh-CN-YunxiNeural", "gender": "Male"},
        {"name": "zh-CN-YunyangNeural", "gender": "Male"},
    ],
    "es": [
        {"name": "es-ES-ElviraNeural", "gender": "Female"},
        {"name": "es-ES-AlvaroNeural", "gender": "Male"},
    ],
    "fr": [
        {"name": "fr-FR-DeniseNeural", "gender": "Female"},
        {"name": "fr-FR-HenriNeural", "gender": "Male"},
    ],
    "de": [
        {"name": "de-DE-KatjaNeural", "gender": "Female"},
        {"name": "de-DE-ConradNeural", "gender": "Male"},
    ],
    "it": [
        {"name": "it-IT-ElsaNeural", "gender": "Female"},
        {"name": "it-IT-DiegoNeural", "gender": "Male"},
    ],
    "pt": [
        {"name": "pt-PT-RaquelNeural", "gender": "Female"},
        {"name": "pt-PT-DuarteNeural", "gender": "Male"},
    ],
    "ru": [
        {"name": "ru-RU-SvetlanaNeural", "gender": "Female"},
        {"name": "ru-RU-DmitryNeural", "gender": "Male"},
    ],
    "ar": [
        {"name": "ar-SA-ZariyahNeural", "gender": "Female"},
        {"name": "ar-SA-HamedNeural", "gender": "Male"},
    ],
    "hi": [
        {"name": "hi-IN-SwaraNeural", "gender": "Female"},
        {"name": "hi-IN-MadhurNeural", "gender": "Male"},
    ],
    "th": [
        {"name": "th-TH-PremwadeeNeural", "gender": "Female"},
        {"name": "th-TH-NiwatNeural", "gender": "Male"},
    ],
    "vi": [
        {"name": "vi-VN-HoaiMyNeural", "gender": "Female"},
        {"name": "vi-VN-NamMinhNeural", "gender": "Male"},
    ],
}

# Default voice for each language (first voice in the list)
DEFAULT_VOICES = {lang: voices[0]["name"] for lang, voices in VOICES_BY_LANGUAGE.items()}


# Voice parameter ranges
RATE_RANGE = {
    "min": "-50%",
    "max": "+100%",
    "default": "+0%",
    "description": "Speaking rate adjustment",
    "examples": ["-50%", "-25%", "+0%", "+25%", "+50%", "+100%"],
}

VOLUME_RANGE = {
    "min": "-50%",
    "max": "+100%",
    "default": "+0%",
    "description": "Volume adjustment",
    "examples": ["-50%", "-25%", "+0%", "+25%", "+50%", "+100%"],
}

PITCH_RANGE = {
    "min": "-50Hz",
    "max": "+50Hz",
    "default": "+0Hz",
    "description": "Pitch adjustment",
    "examples": ["-50Hz", "-25Hz", "+0Hz", "+25Hz", "+50Hz"],
}
