"""
Parameter-related schemas.
"""

from pydantic import BaseModel, Field


class ParameterRange(BaseModel):
    min: str = Field(..., description="Minimum value")
    max: str = Field(..., description="Maximum value")
    default: str = Field(..., description="Default value")
    description: str = Field(..., description="Parameter description")
    examples: list[str] = Field(..., description="Example values")


class ParametersResponse(BaseModel):
    rate: ParameterRange = Field(..., description="Speaking rate parameter info")
    volume: ParameterRange = Field(..., description="Volume parameter info")
    pitch: ParameterRange = Field(..., description="Pitch parameter info")
