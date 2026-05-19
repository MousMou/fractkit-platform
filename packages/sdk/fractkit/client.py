import httpx
from typing import Optional
from .config import get_api_key, get_api_url


class FractKitClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or get_api_key()
        self.base_url = (base_url or get_api_url()).rstrip("/")
        if not self.api_key:
            raise ValueError(
                "No API key found. Set FRACTKIT_API_KEY or run: fractkit config set-key <key>"
            )

    def _headers(self) -> dict:
        return {"X-API-Key": self.api_key, "Content-Type": "application/json"}

    def correct(self, counts: dict, n: int, device: str, method: str = "rem_snn") -> dict:
        resp = httpx.post(
            f"{self.base_url}/v1/correct",
            json={"counts": counts, "n": n, "device": device, "method": method},
            headers=self._headers(),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def devices(self, recommended_only: bool = False) -> list:
        resp = httpx.get(
            f"{self.base_url}/v1/devices",
            params={"recommended_only": recommended_only},
            headers=self._headers(),
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()

    def health(self) -> dict:
        resp = httpx.get(f"{self.base_url}/health", timeout=10)
        resp.raise_for_status()
        return resp.json()
