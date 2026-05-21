from typing import Dict, Optional
from pydantic import BaseModel, Field, model_validator


class CorrectionRequest(BaseModel):
    counts: Dict[str, int] = Field(
        ...,
        description="Raw measurement counts from QPU, e.g. {'00': 122, '11': 128}",
        examples=[{"00": 122, "01": 3, "10": 3, "11": 128}],
    )
    n: int = Field(
        ...,
        ge=1,
        le=127,
        description="Number of qubits (up to 127 — matches Rigetti Cepheus-108Q, IBM Eagle/Heron)",
    )
    device: Optional[str] = Field(
        default=None,
        description="Device ID from noisebridge registry, e.g. 'iqm_garnet'",
    )
    method: str = Field(
        default="rem_snn",
        description="Correction method: 'rem_snn' (recommended), 'rem', or 'snn'",
    )

    @model_validator(mode="after")
    def validate_counts_not_empty(self) -> "CorrectionRequest":
        if not self.counts:
            raise ValueError("counts must not be empty")
        if any(v < 0 for v in self.counts.values()):
            raise ValueError("counts values must be non-negative")
        if self.method not in ("rem_snn", "rem", "snn"):
            raise ValueError("method must be 'rem_snn' (recommended) or 'rem'")
        return self
