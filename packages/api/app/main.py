from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routes import correct, devices, health, keys, billing, register, me


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up: import noisebridge so the first request isn't slow
    from noisebridge import list_devices
    list_devices()
    yield


app = FastAPI(
    title="noisebridge API",
    description=(
        "Zero-overhead quantum noise mitigation via SNN centering matrix. "
        "Validated on 6 real QPUs from 3 vendors (IBM + IQM + Rigetti)."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fractkit.io",
        "https://www.fractkit.io",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)

app.include_router(health.router)
app.include_router(register.router)
app.include_router(me.router)
app.include_router(correct.router)
app.include_router(devices.router)
app.include_router(keys.router)
app.include_router(billing.router)

# AWS Lambda handler (Mangum adapter)
handler = Mangum(app, lifespan="on")
