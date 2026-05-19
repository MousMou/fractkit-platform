import time
from fastapi import APIRouter, Depends
from noisebridge import rem_snn_correct, rem_correct, correct as snn_correct_fn
from noisebridge import load_params, __version__ as nb_version
from app.auth.api_key import require_api_key
from app.models.request import CorrectionRequest
from app.models.response import CorrectionResponse

router = APIRouter()


@router.post("/v1/correct", response_model=CorrectionResponse, tags=["correction"])
async def correct(
    body: CorrectionRequest,
    _: str = Depends(require_api_key),
) -> CorrectionResponse:
    """
    Apply quantum noise mitigation to raw QPU measurement counts.

    - **rem_snn** (default): REM confusion matrix → SNN centering matrix. Recommended.
    - **rem**: Readout Error Mitigation only via confusion matrix inversion.
    - **snn**: SNN centering matrix only (no REM).

    Validated results (real hardware):
    - IBM Marrakesh 50q GHZ: +42.9% fidelity
    - IQM Garnet: 97% win rate over 63 circuits
    - Rigetti Cepheus: 1.91x LER improvement
    """
    t0 = time.perf_counter()

    if body.method == "rem_snn":
        corrected = rem_snn_correct(body.counts, n=body.n, device=body.device)
    elif body.method == "rem":
        corrected = rem_correct(body.counts, n=body.n, device=body.device)
    else:  # snn
        params = load_params(body.device) if body.device else {}
        corrected = snn_correct_fn(body.counts, params, n=body.n)

    latency_ms = (time.perf_counter() - t0) * 1000

    return CorrectionResponse(
        corrected=corrected,
        device=body.device,
        method=body.method,
        latency_ms=round(latency_ms, 3),
        noisebridge_version=nb_version,
    )
