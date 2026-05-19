from typing import Dict, Optional
from pydantic import BaseModel, Field


class CorrectionResponse(BaseModel):
    corrected: Dict[str, float] = Field(
        ...,
        description="Corrected probability distribution over all 2^n bitstrings",
    )
    device: Optional[str] = Field(
        default=None,
        description="Device ID used for correction",
    )
    method: str = Field(
        ...,
        description="Correction method applied",
    )
    latency_ms: float = Field(
        ...,
        description="Correction latency in milliseconds",
    )
    noisebridge_version: str = Field(
        ...,
        description="noisebridge package version used",
    )


class DeviceInfo(BaseModel):
    id: str
    name: str
    family: str
    qubits: int
    recommended: bool


class DevicesResponse(BaseModel):
    devices: list[DeviceInfo]
    total: int


class HealthResponse(BaseModel):
    status: str
    noisebridge_version: str
