import json
import sys
import time
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich import print as rprint

from .client import FractKitClient
from .config import get_api_key, get_api_url, load_config, save_config

console = Console()


def _client() -> FractKitClient:
    try:
        return FractKitClient()
    except ValueError as e:
        console.print(f"[red]Error:[/red] {e}")
        sys.exit(1)


@click.group()
@click.version_option(package_name="fractkit")
def cli():
    """FractKit — quantum noise mitigation CLI powered by noisebridge."""


# ── config ──────────────────────────────────────────────────────────────────

@cli.group()
def config():
    """Manage CLI configuration (API key, endpoint)."""


@config.command("set-key")
@click.argument("key")
def config_set_key(key: str):
    """Save your API key to ~/.fractkit/config.json."""
    data = load_config()
    data["api_key"] = key
    save_config(data)
    console.print("[green]API key saved.[/green]")


@config.command("set-url")
@click.argument("url")
def config_set_url(url: str):
    """Override the API base URL (default: https://api.fractkit.io)."""
    data = load_config()
    data["api_url"] = url
    save_config(data)
    console.print(f"[green]API URL set to {url}[/green]")


@config.command("show")
def config_show():
    """Show current configuration."""
    table = Table(title="FractKit Config")
    table.add_column("Setting", style="cyan")
    table.add_column("Value")
    key = get_api_key()
    table.add_row("api_key", f"{key[:8]}…" if key else "[red]not set[/red]")
    table.add_row("api_url", get_api_url())
    console.print(table)


# ── correct ──────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--counts", required=True, help='JSON counts dict, e.g. \'{"00":480,"11":520}\'')
@click.option("--n", required=True, type=int, help="Number of qubits")
@click.option("--device", required=True, help="Device ID (e.g. ibm_marrakesh)")
@click.option(
    "--method",
    default="rem_snn",
    type=click.Choice(["rem_snn", "rem", "snn"]),
    show_default=True,
    help="Mitigation method",
)
@click.option("--json-output", is_flag=True, help="Output raw JSON")
def correct(counts: str, n: int, device: str, method: str, json_output: bool):
    """Mitigate measurement noise in quantum circuit counts."""
    try:
        counts_dict = json.loads(counts)
    except json.JSONDecodeError as e:
        console.print(f"[red]Invalid --counts JSON:[/red] {e}")
        sys.exit(1)

    client = _client()
    with console.status("Correcting…"):
        result = client.correct(counts_dict, n, device, method)

    if json_output:
        click.echo(json.dumps(result, indent=2))
        return

    table = Table(title=f"Corrected counts — {device} ({method})")
    table.add_column("Bitstring", style="cyan")
    table.add_column("Raw", justify="right")
    table.add_column("Corrected", justify="right", style="green")

    raw = result.get("raw_counts", counts_dict)
    corrected = result.get("corrected_counts", {})
    for k in sorted(corrected, key=lambda x: -corrected[x]):
        table.add_row(k, str(raw.get(k, "-")), f"{corrected[k]:.4f}")

    console.print(table)
    if "latency_ms" in result:
        console.print(f"Latency: [cyan]{result['latency_ms']:.1f} ms[/cyan]")


# ── devices ──────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--recommended", is_flag=True, help="Show only recommended devices")
@click.option("--json-output", is_flag=True, help="Output raw JSON")
def devices(recommended: bool, json_output: bool):
    """List supported QPU devices."""
    client = _client()
    result = client.devices(recommended_only=recommended)

    if json_output:
        click.echo(json.dumps(result, indent=2))
        return

    table = Table(title="Supported Devices")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Vendor")
    table.add_column("Qubits", justify="right")
    table.add_column("Recommended", justify="center")

    for d in result:
        table.add_row(
            d.get("id", ""),
            d.get("name", ""),
            d.get("vendor", ""),
            str(d.get("n_qubits", "")),
            "[green]✓[/green]" if d.get("recommended") else "",
        )
    console.print(table)


# ── benchmark ────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--device", required=True, help="Device ID to benchmark")
@click.option("--shots", default=1000, show_default=True, help="Simulated shot count")
@click.option("--rounds", default=5, show_default=True, help="Number of benchmark rounds")
@click.option("--json-output", is_flag=True, help="Output raw JSON")
def benchmark(device: str, shots: int, rounds: int, json_output: bool):
    """Run a latency benchmark against the API."""
    client = _client()
    counts = {"0" * 2: shots // 2, "1" * 2: shots // 2}
    latencies = []

    with console.status(f"Benchmarking {rounds} rounds…"):
        for _ in range(rounds):
            t0 = time.perf_counter()
            client.correct(counts, 2, device)
            latencies.append((time.perf_counter() - t0) * 1000)

    avg = sum(latencies) / len(latencies)
    mn = min(latencies)
    mx = max(latencies)

    if json_output:
        click.echo(json.dumps({"device": device, "rounds": rounds, "avg_ms": avg, "min_ms": mn, "max_ms": mx}))
        return

    table = Table(title=f"Benchmark — {device} ({rounds} rounds)")
    table.add_column("Metric", style="cyan")
    table.add_column("ms", justify="right", style="green")
    table.add_row("avg", f"{avg:.1f}")
    table.add_row("min", f"{mn:.1f}")
    table.add_row("max", f"{mx:.1f}")
    console.print(table)


# ── export obsidian ──────────────────────────────────────────────────────────

@cli.command("export-obsidian")
@click.argument("result_json", type=click.Path(exists=True))
@click.option("--vault", default=".", show_default=True, help="Path to Obsidian vault")
@click.option("--folder", default="FractKit/Benchmarks", show_default=True)
def export_obsidian(result_json: str, vault: str, folder: str):
    """Export a correction result JSON to an Obsidian benchmark note."""
    import os
    from pathlib import Path
    from datetime import date

    with open(result_json) as f:
        data = json.load(f)

    device = data.get("device", "unknown")
    method = data.get("method", "rem_snn")
    today = date.today().isoformat()
    slug = f"{today}-{device}-{method}"

    out_dir = Path(vault) / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.md"

    corrected = data.get("corrected_counts", {})
    raw = data.get("raw_counts", {})
    latency = data.get("latency_ms", "—")

    lines = [
        f"# Benchmark: {device} — {method} — {today}",
        "",
        "## Metadata",
        f"- **device**: {device}",
        f"- **method**: {method}",
        f"- **date**: {today}",
        f"- **latency_ms**: {latency}",
        "",
        "## Results",
        "| Bitstring | Raw | Corrected |",
        "|-----------|-----|-----------|",
    ]
    for k in sorted(corrected, key=lambda x: -corrected[x]):
        lines.append(f"| `{k}` | {raw.get(k, '—')} | {corrected[k]:.4f} |")

    out_path.write_text("\n".join(lines) + "\n")
    console.print(f"[green]Note written:[/green] {out_path}")
