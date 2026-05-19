import json
import pytest
import respx
import httpx
from click.testing import CliRunner
from fractkit.cli import cli


BASE = "https://api.fractkit.io"
KEY = "test-key-abc"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("FRACTKIT_API_KEY", KEY)
    monkeypatch.setenv("FRACTKIT_API_URL", BASE)


@pytest.fixture
def runner():
    return CliRunner()


# ── config ───────────────────────────────────────────────────────────────────

def test_config_set_and_show(runner, tmp_path, monkeypatch):
    monkeypatch.setattr("fractkit.config._CONFIG_PATH", tmp_path / "config.json")
    monkeypatch.delenv("FRACTKIT_API_KEY", raising=False)
    result = runner.invoke(cli, ["config", "set-key", "my-secret-key"])
    assert result.exit_code == 0
    assert "saved" in result.output

    result = runner.invoke(cli, ["config", "show"])
    assert result.exit_code == 0
    assert "my-secre" in result.output


# ── correct ──────────────────────────────────────────────────────────────────

CORRECT_RESPONSE = {
    "raw_counts": {"00": 480, "11": 520},
    "corrected_counts": {"00": 0.45, "11": 0.55},
    "method": "rem_snn",
    "device": "ibm_marrakesh",
    "latency_ms": 0.8,
}


@respx.mock
def test_correct_table_output(runner):
    respx.post(f"{BASE}/v1/correct").mock(return_value=httpx.Response(200, json=CORRECT_RESPONSE))
    result = runner.invoke(cli, [
        "correct",
        "--counts", '{"00":480,"11":520}',
        "--n", "2",
        "--device", "ibm_marrakesh",
    ])
    assert result.exit_code == 0, result.output
    assert "00" in result.output
    assert "11" in result.output


@respx.mock
def test_correct_json_output(runner):
    respx.post(f"{BASE}/v1/correct").mock(return_value=httpx.Response(200, json=CORRECT_RESPONSE))
    result = runner.invoke(cli, [
        "correct",
        "--counts", '{"00":480,"11":520}',
        "--n", "2",
        "--device", "ibm_marrakesh",
        "--json-output",
    ])
    assert result.exit_code == 0
    data = json.loads(result.output)
    assert "corrected_counts" in data


@respx.mock
def test_correct_invalid_counts_json(runner):
    result = runner.invoke(cli, [
        "correct", "--counts", "not-json", "--n", "2", "--device", "ibm_marrakesh"
    ])
    assert result.exit_code != 0 or "Invalid" in result.output


@respx.mock
def test_correct_api_error(runner):
    respx.post(f"{BASE}/v1/correct").mock(return_value=httpx.Response(401, json={"detail": "Unauthorized"}))
    result = runner.invoke(cli, [
        "correct", "--counts", '{"00":500,"11":500}', "--n", "2", "--device", "ibm_marrakesh"
    ])
    assert result.exit_code != 0


# ── devices ──────────────────────────────────────────────────────────────────

DEVICES_RESPONSE = [
    {"id": "ibm_marrakesh", "name": "IBM Marrakesh", "vendor": "IBM", "n_qubits": 156, "recommended": True},
    {"id": "iqm_garnet", "name": "IQM Garnet", "vendor": "IQM", "n_qubits": 20, "recommended": True},
]


@respx.mock
def test_devices_table(runner):
    respx.get(f"{BASE}/v1/devices").mock(return_value=httpx.Response(200, json=DEVICES_RESPONSE))
    result = runner.invoke(cli, ["devices"])
    assert result.exit_code == 0
    assert "ibm_marrakesh" in result.output
    assert "IQM" in result.output


@respx.mock
def test_devices_json(runner):
    respx.get(f"{BASE}/v1/devices").mock(return_value=httpx.Response(200, json=DEVICES_RESPONSE))
    result = runner.invoke(cli, ["devices", "--json-output"])
    assert result.exit_code == 0
    data = json.loads(result.output)
    assert len(data) == 2


# ── benchmark ────────────────────────────────────────────────────────────────

@respx.mock
def test_benchmark(runner):
    respx.post(f"{BASE}/v1/correct").mock(return_value=httpx.Response(200, json=CORRECT_RESPONSE))
    result = runner.invoke(cli, ["benchmark", "--device", "ibm_marrakesh", "--rounds", "3"])
    assert result.exit_code == 0
    assert "avg" in result.output


@respx.mock
def test_benchmark_json(runner):
    respx.post(f"{BASE}/v1/correct").mock(return_value=httpx.Response(200, json=CORRECT_RESPONSE))
    result = runner.invoke(cli, ["benchmark", "--device", "ibm_marrakesh", "--rounds", "2", "--json-output"])
    assert result.exit_code == 0
    data = json.loads(result.output)
    assert "avg_ms" in data
    assert data["rounds"] == 2


# ── export-obsidian ──────────────────────────────────────────────────────────

def test_export_obsidian(runner, tmp_path):
    result_data = {
        "device": "ibm_marrakesh",
        "method": "rem_snn",
        "raw_counts": {"00": 480, "11": 520},
        "corrected_counts": {"00": 0.45, "11": 0.55},
        "latency_ms": 0.8,
    }
    result_file = tmp_path / "result.json"
    result_file.write_text(json.dumps(result_data))

    result = runner.invoke(cli, [
        "export-obsidian",
        str(result_file),
        "--vault", str(tmp_path),
        "--folder", "Benchmarks",
    ])
    assert result.exit_code == 0
    notes = list((tmp_path / "Benchmarks").glob("*.md"))
    assert len(notes) == 1
    content = notes[0].read_text()
    assert "ibm_marrakesh" in content
    assert "rem_snn" in content
    assert "0.4500" in content


# ── no api key ───────────────────────────────────────────────────────────────

def test_no_api_key_exits(runner, monkeypatch, tmp_path):
    monkeypatch.delenv("FRACTKIT_API_KEY", raising=False)
    monkeypatch.setattr("fractkit.config._CONFIG_PATH", tmp_path / "config.json")
    result = runner.invoke(cli, ["devices"])
    assert result.exit_code != 0 or "No API key" in result.output
