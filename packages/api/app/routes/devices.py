from fastapi import APIRouter, Query
from noisebridge import list_devices, DEVICE_REGISTRY
from app.models.response import DeviceInfo, DevicesResponse

router = APIRouter()


@router.get("/v1/devices", response_model=DevicesResponse, tags=["devices"])
async def get_devices(
    recommended: bool = Query(default=False, description="Return only recommended devices"),
) -> DevicesResponse:
    ids = list_devices(recommended_only=recommended)
    devices = [
        DeviceInfo(
            id=d,
            name=DEVICE_REGISTRY[d].get("name", d),
            family=DEVICE_REGISTRY[d].get("family", "unknown"),
            qubits=DEVICE_REGISTRY[d].get("qubits", 0),
            recommended=DEVICE_REGISTRY[d].get("recommended", False),
        )
        for d in ids
    ]
    return DevicesResponse(devices=devices, total=len(devices))
