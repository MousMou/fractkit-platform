"""
API tests for noisebridge Cloud API.
Uses FastAPI TestClient (synchronous) — no live server needed.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID_KEY = "test-api-key-123"
HEADERS = {"X-API-Key": VALID_KEY}

# IQM Garnet Bell state — real hardware counts (2026-05-12)
IQM_BELL = {"counts": {"00": 122, "01": 3, "10": 3, "11": 128}, "n": 2, "device": "iqm_garnet"}

# IBM Marrakesh GHZ-5q — real hardware counts
IBM_GHZ5 = {
    "counts": {"00000": 484, "11111": 471, "00001": 8, "10000": 6, "01000": 5},
    "n": 5,
    "device": "ibm_fakemarrakesh",
}


# ── /health ────────────────────────────────────────────────────────────────────

def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "noisebridge_version" in data


# ── /v1/devices ────────────────────────────────────────────────────────────────

def test_devices_returns_list():
    r = client.get("/v1/devices")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    assert len(data["devices"]) == data["total"]

def test_devices_recommended_filter():
    r = client.get("/v1/devices?recommended=true")
    assert r.status_code == 200
    data = r.json()
    assert all(d["recommended"] for d in data["devices"])

def test_devices_schema():
    r = client.get("/v1/devices")
    device = r.json()["devices"][0]
    assert {"id", "name", "family", "qubits", "recommended"} <= device.keys()


# ── /v1/correct — authentication ──────────────────────────────────────────────

def test_correct_missing_key_returns_401():
    r = client.post("/v1/correct", json=IQM_BELL)
    assert r.status_code == 401

def test_correct_empty_key_returns_401():
    r = client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": ""})
    assert r.status_code == 401

def test_correct_valid_key_accepted():
    r = client.post("/v1/correct", json=IQM_BELL, headers=HEADERS)
    assert r.status_code == 200


# ── /v1/correct — rem_snn (default) ───────────────────────────────────────────

def test_correct_rem_snn_iqm_bell():
    r = client.post("/v1/correct", json=IQM_BELL, headers=HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert {"corrected", "method", "latency_ms", "noisebridge_version"} <= data.keys()
    assert data["method"] == "rem_snn"
    probs = data["corrected"]
    assert abs(sum(probs.values()) - 1.0) < 1e-6
    assert all(v >= 0.0 for v in probs.values())

def test_correct_rem_snn_returns_all_bitstrings():
    r = client.post("/v1/correct", json=IQM_BELL, headers=HEADERS)
    probs = r.json()["corrected"]
    assert set(probs.keys()) == {"00", "01", "10", "11"}

def test_correct_rem_snn_ibm_ghz5():
    r = client.post("/v1/correct", json=IBM_GHZ5, headers=HEADERS)
    assert r.status_code == 200
    probs = r.json()["corrected"]
    assert len(probs) == 32
    assert abs(sum(probs.values()) - 1.0) < 1e-6

def test_correct_latency_reported():
    r = client.post("/v1/correct", json=IQM_BELL, headers=HEADERS)
    assert r.json()["latency_ms"] >= 0.0

def test_correct_no_device():
    body = {"counts": {"00": 122, "11": 128}, "n": 2}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 200
    assert abs(sum(r.json()["corrected"].values()) - 1.0) < 1e-6

def test_correct_device_echoed_in_response():
    r = client.post("/v1/correct", json=IQM_BELL, headers=HEADERS)
    assert r.json()["device"] == "iqm_garnet"


# ── /v1/correct — method variants ─────────────────────────────────────────────

def test_correct_method_rem():
    body = {**IQM_BELL, "method": "rem"}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 200
    assert r.json()["method"] == "rem"
    assert abs(sum(r.json()["corrected"].values()) - 1.0) < 1e-6

def test_correct_method_snn():
    body = {**IQM_BELL, "method": "snn"}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 200
    assert r.json()["method"] == "snn"
    assert abs(sum(r.json()["corrected"].values()) - 1.0) < 1e-6

def test_correct_all_three_methods_produce_valid_probs():
    for method in ("rem_snn", "rem", "snn"):
        body = {**IQM_BELL, "method": method}
        r = client.post("/v1/correct", json=body, headers=HEADERS)
        assert r.status_code == 200, f"method={method} failed"
        probs = r.json()["corrected"]
        assert abs(sum(probs.values()) - 1.0) < 1e-6, f"probs don't sum to 1 for method={method}"


# ── /v1/correct — validation errors ───────────────────────────────────────────

def test_correct_empty_counts_returns_422():
    r = client.post("/v1/correct", json={"counts": {}, "n": 2}, headers=HEADERS)
    assert r.status_code == 422

def test_correct_invalid_method_returns_422():
    body = {**IQM_BELL, "method": "zne"}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 422

def test_correct_n_zero_returns_422():
    body = {"counts": {"0": 100}, "n": 0}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 422

def test_correct_negative_counts_returns_422():
    body = {"counts": {"00": -5, "11": 100}, "n": 2}
    r = client.post("/v1/correct", json=body, headers=HEADERS)
    assert r.status_code == 422
