import os
import json
from pathlib import Path
from typing import Optional

_CONFIG_PATH = Path.home() / ".fractkit" / "config.json"


def load_config() -> dict:
    if _CONFIG_PATH.exists():
        return json.loads(_CONFIG_PATH.read_text())
    return {}


def save_config(data: dict) -> None:
    _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    _CONFIG_PATH.write_text(json.dumps(data, indent=2))


def get_api_key() -> Optional[str]:
    return os.getenv("FRACTKIT_API_KEY") or load_config().get("api_key")


def get_api_url() -> str:
    return os.getenv("FRACTKIT_API_URL") or load_config().get("api_url") or "https://api.fractkit.io"
