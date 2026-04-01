import base64
import os
import tempfile

import edge_tts


async def list_voices():
    """
    Get list of all available voices from edge-tts.
    Returns list of voice objects with name, gender, and language info.
    """
    voices = await edge_tts.list_voices()
    return voices


async def generate_audio(
    text: str,
    language: str = "ko",
    voice: str | None = None,
    rate: str = "+0%",
    volume: str = "+0%",
    pitch: str = "+0Hz",
) -> str:
    """
    Generate audio from text using edge-tts with customizable options.

    edge-tts is a free, open-source TTS library using Microsoft Edge's TTS API.
    No API key required.

    Supports 322 voices across 142 languages/locales!

    Args:
        text: Text to convert to speech
        language: Language code (ko, en, ja, zh, es, fr, de, etc.)
        voice: Specific voice name (e.g., "ko-KR-SunHiNeural", "en-US-AriaNeural")
               If not provided, uses default voice for the language
        rate: Speaking rate adjustment (-50% to +100%, default: +0%)
        volume: Volume adjustment (-50% to +100%, default: +0%)
        pitch: Pitch adjustment (-50Hz to +50Hz, default: +0Hz)
    """
    from app.core.constants import DEFAULT_VOICES

    # Select voice based on language if not specified
    if not voice:
        voice = DEFAULT_VOICES.get(language, "en-US-AriaNeural")

    # Create edge-tts communicate object with options
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        volume=volume,
        pitch=pitch,
    )

    # Create temporary file for audio
    fd, temp_path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)

    try:
        # Generate and save audio
        await communicate.save(temp_path)

        # Read audio file and encode to base64
        with open(temp_path, "rb") as f:
            audio_bytes = f.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return audio_b64

    except Exception as e:
        # Log error and raise
        print(f"TTS generation failed: {str(e)}")
        raise Exception(f"Failed to generate audio: {str(e)}") from e

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
