from fastapi import APIRouter
from noisebridge import __version__ as nb_version
from app.models.response import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", noisebridge_version=nb_version)
