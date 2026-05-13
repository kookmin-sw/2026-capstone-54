"""
Parameter-related API routes.
"""

from fastapi import APIRouter

from app.api.schemas import ParameterRange, ParametersResponse
from app.core.constants import PITCH_RANGE, RATE_RANGE, VOLUME_RANGE

router = APIRouter()


@router.get("/parameters", response_model=ParametersResponse)
async def get_parameters():
    """
    Get information about available voice parameters (rate, volume, pitch).

    No authentication required - public endpoint.
    """
    return ParametersResponse(
        rate=ParameterRange(**RATE_RANGE),
        volume=ParameterRange(**VOLUME_RANGE),
        pitch=ParameterRange(**PITCH_RANGE),
    )
