"""
submit_metriq.py — Submit noisebridge benchmark results to metriq.info

Usage:
    export METRIQ_TOKEN=<your_token>
    python scripts/submit_metriq.py [--dry-run] [--filter ibm_marrakesh]

Requirements:
    pip install httpx

All benchmark values are from real QPU experiments (DO NOT CHANGE).
See CLAUDE.md for provenance. Every number here has hardware validation.
"""
import argparse
import json
import os
import sys
from datetime import date
from typing import Optional

try:
    import httpx
except ImportError:
    sys.exit("httpx is required: pip install httpx")

METRIQ_BASE = "https://metriq.info/api"

# ── Validated benchmark data (real hardware, DO NOT INVENT) ─────────────────
#
# Sources:
#   - IBM Marrakesh: GHZ fidelity experiment, May 2025
#   - IQM Garnet: Sierpinski Z-Code LER, May 2025
#   - Rigetti Cepheus: Sierpinski Z-Code LER, May 2025
#   - IQM Emerald: Teleportation fidelity, rep. Northwestern 2026
#   - Overall: 97% win rate, 63 circuits, IBM + IQM
#
# Reference: Zenodo DOI 10.5281/zenodo.20157839
# arXiv preprint: pending

BENCHMARKS = [
    {
        "id": "ibm_marrakesh_ghz",
        "device": "IBM Marrakesh (50q)",
        "vendor": "IBM Quantum",
        "task": "GHZ State Fidelity",
        "metric": "fidelity_improvement_pct",
        "raw_value": 0.285,
        "mitigated_value": 0.714,
        "improvement": "+42.9%",
        "n_qubits": 50,
        "method": "rem_snn",
        "date": "2025-05",
        "notes": "GHZ fidelity on IBM Marrakesh 50-qubit device. SNN centering matrix applied post-measurement.",
    },
    {
        "id": "iqm_garnet_ler",
        "device": "IQM Garnet (20q)",
        "vendor": "IQM",
        "task": "Logical Error Rate (Sierpinski Z-Code)",
        "metric": "ler_reduction_factor",
        "raw_value": 0.100,
        "mitigated_value": 0.048,
        "improvement": "2.08×",
        "n_qubits": 20,
        "method": "rem_snn",
        "date": "2025-05",
        "notes": "Sierpinski Z-Code logical error rate. Best single-device result across all 63 circuits.",
    },
    {
        "id": "rigetti_cepheus_ler",
        "device": "Rigetti Cepheus-108Q",
        "vendor": "Rigetti",
        "task": "Logical Error Rate (Sierpinski Z-Code)",
        "metric": "ler_reduction_factor",
        "raw_value": 0.254,
        "mitigated_value": 0.133,
        "improvement": "1.91×",
        "n_qubits": 108,
        "method": "rem_snn",
        "date": "2025-05",
        "notes": "Sierpinski Z-Code on Rigetti Cepheus 108-qubit superconducting device.",
    },
    {
        "id": "iqm_emerald_teleportation",
        "device": "IQM Emerald",
        "vendor": "IQM",
        "task": "Quantum Teleportation Fidelity",
        "metric": "teleportation_fidelity",
        "raw_value": None,
        "mitigated_value": 0.966,  # midpoint of 0.959–0.973 range
        "improvement": "F=0.959–0.973",
        "n_qubits": None,
        "method": "rem_snn",
        "date": "2026",
        "notes": "Teleportation fidelity range 0.959–0.973. Results reported in Northwestern University 2026 study.",
    },
    {
        "id": "overall_win_rate",
        "device": "IBM + IQM (combined)",
        "vendor": "IBM Quantum / IQM",
        "task": "Overall Error Mitigation Win Rate",
        "metric": "win_rate_pct",
        "raw_value": None,
        "mitigated_value": 0.97,
        "improvement": "97%",
        "n_qubits": None,
        "method": "rem_snn",
        "date": "2025-05",
        "notes": "97% win rate over 63 circuits. p=0.011 vs null hypothesis, Cohen d=1.288 vs ZNE.",
    },
]


def build_submission_body(b: dict, token: str) -> dict:
    """Format a benchmark entry as a metriq submission payload."""
    return {
        "name": f"noisebridge {b['method'].upper()} — {b['device']} — {b['task']}",
        "contentUrl": "https://zenodo.org/doi/10.5281/zenodo.20157839",
        "codeUrl": "https://github.com/MousMou/fractkit-platform",
        "description": (
            f"{b['notes']}\n\n"
            f"Method: {b['method']} (SNN centering matrix W[i,j] = (δ(i,j) − 1/N) · W_scale)\n"
            f"Raw value: {b['raw_value']}\n"
            f"Mitigated value: {b['mitigated_value']}\n"
            f"Improvement: {b['improvement']}\n"
            f"Date: {b['date']}\n"
            f"DOI: 10.5281/zenodo.20157839"
        ),
        "results": [
            {
                "metricName": b["metric"],
                "metricValue": str(b["mitigated_value"]),
                "isHigherBetter": b["metric"] not in ("ler_reduction_factor",),
                "evaluatedAt": b["date"],
            }
        ],
        "tags": ["error-mitigation", "snn", "noisebridge", b["vendor"].lower().replace(" ", "-")],
    }


def submit_one(
    benchmark: dict,
    token: str,
    client: httpx.Client,
    dry_run: bool = False,
) -> Optional[dict]:
    body = build_submission_body(benchmark, token)
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Submitting: {benchmark['id']}")
    print(f"  Device:  {benchmark['device']}")
    print(f"  Metric:  {benchmark['metric']} = {benchmark['mitigated_value']} ({benchmark['improvement']})")

    if dry_run:
        print(f"  Payload: {json.dumps(body, indent=4)}")
        return {"status": "dry_run", "id": benchmark["id"]}

    resp = client.post(
        f"{METRIQ_BASE}/submission/",
        json=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )

    if resp.status_code in (200, 201):
        data = resp.json()
        print(f"  ✓ Submitted. metriq ID: {data.get('id', '?')}")
        return data
    else:
        print(f"  ✗ Error {resp.status_code}: {resp.text[:200]}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Submit noisebridge benchmarks to metriq.info"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print payloads without submitting",
    )
    parser.add_argument(
        "--filter",
        metavar="ID",
        help="Only submit the benchmark with this ID (e.g. ibm_marrakesh_ghz)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available benchmark IDs and exit",
    )
    args = parser.parse_args()

    if args.list:
        print("Available benchmark IDs:")
        for b in BENCHMARKS:
            print(f"  {b['id']:40s} {b['improvement']:10s} {b['device']}")
        return

    token = os.getenv("METRIQ_TOKEN", "")
    if not token and not args.dry_run:
        sys.exit(
            "METRIQ_TOKEN environment variable not set.\n"
            "Get your token at https://metriq.info/Account\n"
            "Or run with --dry-run to preview payloads."
        )

    targets = BENCHMARKS
    if args.filter:
        targets = [b for b in BENCHMARKS if b["id"] == args.filter]
        if not targets:
            sys.exit(f"No benchmark found with ID '{args.filter}'. Use --list to see available IDs.")

    print("noisebridge -> metriq.info submission")
    print(f"Date: {date.today().isoformat()}")
    print(f"Benchmarks to submit: {len(targets)}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("-" * 50)

    results = []
    with httpx.Client() as client:
        for b in targets:
            result = submit_one(b, token, client, dry_run=args.dry_run)
            results.append({"id": b["id"], "result": result})

    print("\n" + "-" * 50)
    ok = sum(1 for r in results if r["result"] is not None)
    print(f"Done: {ok}/{len(targets)} submitted successfully.")

    if not args.dry_run and ok > 0:
        print("\nView submissions at: https://metriq.info/Search?query=noisebridge")


if __name__ == "__main__":
    main()
