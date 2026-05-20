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


# ── obsidian helpers ─────────────────────────────────────────────────────────

def _vault_log_append(vault_path, entry: str) -> None:
    """Append one line to FractKit/log.md (creates file if absent)."""
    from pathlib import Path
    from datetime import date

    log_path = Path(vault_path) / "FractKit" / "log.md"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"\n## [{date.today().isoformat()}] {entry}\n")


def _write_note(path, lines: list[str]) -> None:
    from pathlib import Path
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ── export-obsidian ───────────────────────────────────────────────────────────

@cli.command("export-obsidian")
@click.argument("result_json", type=click.Path(exists=True))
@click.option("--vault", default=".", show_default=True, help="Path to Obsidian vault root")
@click.option("--folder", default="FractKit/Benchmarks", show_default=True)
def export_obsidian(result_json: str, vault: str, folder: str):
    """Export a /v1/correct API result JSON to an Obsidian benchmark note."""
    from pathlib import Path
    from datetime import date

    with open(result_json) as f:
        data = json.load(f)

    device  = data.get("device", "unknown")
    method  = data.get("method", "rem_snn")
    today   = date.today().isoformat()
    slug    = f"{today}_{device}_{method}"
    title   = f"Correction: {device} — {method} — {today}"

    corrected = data.get("corrected_counts", {})
    raw       = data.get("raw_counts", {})
    latency   = data.get("latency_ms", None)

    vendor = "IBM" if "ibm" in device else ("IQM" if "iqm" in device else
             "Rigetti" if "rigetti" in device else "unknown")
    tags = ["benchmark", "correction", method, vendor.lower(),
            device, "noisebridge"]

    lines = [
        "---",
        f"type: experiment",
        f"title: \"{title}\"",
        f"tags: [{', '.join(tags)}]",
        f"created: {today}",
        f"updated: {today}",
        f"sources: [{result_json}]",
        f"device: {device}",
        f"method: {method}",
        f"vendor: {vendor}",
        "---",
        "",
        f"# {title}",
        "",
        "## Device",
        f"- **backend_id**: {device}",
        f"- **vendor**: {vendor}",
        f"- **method**: `{method}`",
        f"- **date**: {today}",
        "",
        "## Results",
        "",
        f"| Bitstring | Raw | Corrected |",
        f"|-----------|----:|----------:|",
    ]
    for k in sorted(corrected, key=lambda x: -corrected[x]):
        raw_val = raw.get(k, "—")
        lines.append(f"| `{k}` | {raw_val} | {corrected[k]:.4f} |")

    if latency is not None:
        lines += ["", f"**Latency**: {latency:.1f} ms"]

    lines += [
        "",
        "## Conclusions",
        "",
        "- SNN centering matrix applied post-measurement.",
        "- Zero additional QPU shots required.",
        "",
        "## Links",
        "",
        f"- [[{device}]]",
        "- [[SNN architecture]]",
    ]

    out_path = Path(vault) / folder / f"{slug}.md"
    _write_note(out_path, lines)
    _vault_log_append(vault, f"export | {slug}")
    console.print(f"[green]Note written:[/green] {out_path}")


# ── ingest-benchmarks ─────────────────────────────────────────────────────────

# Validated hardware results — DO NOT MODIFY (real QPU data, see CLAUDE.md)
_VALIDATED_BENCHMARKS = [
    {
        "id": "ibm_marrakesh_ghz",
        "device": "ibm_marrakesh",
        "vendor": "IBM",
        "task": "GHZ State Fidelity (50q)",
        "metric": "fidelity_improvement_pct",
        "raw": 0.285,
        "mitigated": 0.714,
        "improvement": "+42.9%",
        "n_qubits": 50,
        "date": "2025-05",
        "method": "rem_snn",
        "notes": "GHZ fidelity on IBM Marrakesh 50-qubit device. SNN centering matrix applied post-measurement.",
        "tags": ["benchmark", "real-hardware", "ibm", "ghz", "noisebridge"],
    },
    {
        "id": "iqm_garnet_ler",
        "device": "iqm_garnet",
        "vendor": "IQM",
        "task": "Logical Error Rate — Sierpinski Z-Code",
        "metric": "ler_reduction_factor",
        "raw": 0.100,
        "mitigated": 0.048,
        "improvement": "2.08x",
        "n_qubits": 20,
        "date": "2025-05",
        "method": "rem_snn",
        "notes": "Best single-device result across all 63 circuits. 2.08x LER reduction.",
        "tags": ["benchmark", "real-hardware", "iqm", "qec", "sierpinski", "noisebridge"],
    },
    {
        "id": "rigetti_cepheus_ler",
        "device": "rigetti_cepheus_108q",
        "vendor": "Rigetti",
        "task": "Logical Error Rate — Sierpinski Z-Code",
        "metric": "ler_reduction_factor",
        "raw": 0.254,
        "mitigated": 0.133,
        "improvement": "1.91x",
        "n_qubits": 108,
        "date": "2025-05",
        "method": "rem_snn",
        "notes": "Sierpinski Z-Code on Rigetti Cepheus 108-qubit superconducting device.",
        "tags": ["benchmark", "real-hardware", "rigetti", "qec", "sierpinski", "noisebridge"],
    },
    {
        "id": "iqm_emerald_teleportation",
        "device": "iqm_emerald",
        "vendor": "IQM",
        "task": "Quantum Teleportation Fidelity",
        "metric": "teleportation_fidelity",
        "raw": None,
        "mitigated": 0.966,
        "improvement": "F=0.959-0.973",
        "n_qubits": None,
        "date": "2026",
        "method": "rem_snn",
        "notes": "Teleportation fidelity range 0.959-0.973 reported in Northwestern University 2026 study.",
        "tags": ["benchmark", "real-hardware", "iqm", "teleportation", "noisebridge"],
    },
    {
        "id": "overall_win_rate",
        "device": "ibm_iqm_combined",
        "vendor": "IBM + IQM",
        "task": "Overall Error Mitigation Win Rate",
        "metric": "win_rate_pct",
        "raw": None,
        "mitigated": 0.97,
        "improvement": "97%",
        "n_qubits": None,
        "date": "2025-05",
        "method": "rem_snn",
        "notes": "97% win rate over 63 circuits. p=0.011 vs null hypothesis, Cohen d=1.288 vs ZNE.",
        "tags": ["benchmark", "analysis", "cross-vendor", "statistics", "noisebridge"],
    },
]


@cli.command("ingest-benchmarks")
@click.option("--vault", required=True, help="Path to Obsidian vault root")
@click.option("--folder", default="FractKit/Benchmarks", show_default=True)
@click.option("--filter", "filter_id", default=None, help="Only write benchmark with this ID")
@click.option("--dry-run", is_flag=True, help="Preview note filenames without writing")
def ingest_benchmarks(vault: str, folder: str, filter_id: Optional[str], dry_run: bool):
    """Write validated hardware benchmark notes into your Obsidian vault.

    Creates one Markdown note per benchmark following the FractKit wiki schema
    (proper YAML frontmatter, results table, links). Also appends to log.md.

    Benchmarks ingested:
      ibm_marrakesh_ghz      IBM Marrakesh 50q GHZ fidelity (+42.9%)
      iqm_garnet_ler         IQM Garnet Sierpinski Z-Code LER (2.08x)
      rigetti_cepheus_ler    Rigetti Cepheus-108Q LER (1.91x)
      iqm_emerald_teleportation  IQM Emerald teleportation F=0.959-0.973
      overall_win_rate       97% win rate, 63 circuits (p=0.011)
    """
    from pathlib import Path
    from datetime import date

    targets = _VALIDATED_BENCHMARKS
    if filter_id:
        targets = [b for b in targets if b["id"] == filter_id]
        if not targets:
            ids = ", ".join(b["id"] for b in _VALIDATED_BENCHMARKS)
            console.print(f"[red]Unknown ID '{filter_id}'. Available:[/red] {ids}")
            sys.exit(1)

    today = date.today().isoformat()
    written = 0

    for b in targets:
        filename = f"{b['id']}.md"
        out_path = Path(vault) / folder / filename
        title = f"Benchmark: {b['vendor']} {b['device']} — {b['task']}"

        if dry_run:
            console.print(f"[dim][DRY RUN][/dim] would write: {out_path}")
            continue

        # Build the note
        raw_str = str(b["raw"]) if b["raw"] is not None else "—"
        lines = [
            "---",
            f"type: experiment",
            f"title: \"{title}\"",
            f"tags: [{', '.join(b['tags'])}]",
            f"created: {today}",
            f"updated: {today}",
            f"device: {b['device']}",
            f"vendor: {b['vendor']}",
            f"method: {b['method']}",
            f"metric: {b['metric']}",
            f"experiment_type: benchmark",
            f"hardware: real_qpu",
            f"noisebridge_validated: true",
            "sources: [zenodo:10.5281/zenodo.20157839]",
            "---",
            "",
            f"# {title}",
            "",
            "## Device",
            f"- **backend_id**: `{b['device']}`",
            f"- **vendor**: {b['vendor']}",
        ]
        if b["n_qubits"]:
            lines.append(f"- **n_qubits**: {b['n_qubits']}")
        lines += [
            f"- **experiment_date**: {b['date']}",
            f"- **method**: `{b['method']}`",
            "",
            "## Results",
            "",
            f"| Metric | Raw | Mitigated | Improvement |",
            f"|--------|----:|----------:|-------------|",
            f"| `{b['metric']}` | {raw_str} | {b['mitigated']} | **{b['improvement']}** |",
            "",
            "## Notes",
            "",
            b["notes"],
            "",
            "## Provenance",
            "",
            "- **DOI**: [10.5281/zenodo.20157839](https://zenodo.org/doi/10.5281/zenodo.20157839)",
            "- **PyPI**: [noisebridge](https://pypi.org/project/noisebridge/)",
            "- **Platform**: [[fractkit-platform]]",
            "",
            "## Links",
            "",
            f"- [[{b['device']}]]",
            "- [[SNN architecture]]",
            "- [[cross_device_comparison]]",
        ]

        _write_note(out_path, lines)
        _vault_log_append(vault, f"ingest-benchmarks | {b['id']}")
        console.print(f"[green]Written:[/green] {out_path}")
        written += 1

    if not dry_run:
        console.print(f"\n[cyan]Done:[/cyan] {written}/{len(targets)} notes written to {vault}/{folder}")
