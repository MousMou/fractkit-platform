# FractKit Platform — Claude Code Master Context

## What this repo is
FractKit is a quantum computing platform. Its core product, **noisebridge**, mitigates
quantum measurement noise using a spiking neural network centering matrix —
zero additional QPU shots required, <1ms latency, validated on 6 real QPUs from 3 vendors.

## Validated results (DO NOT INVENT OR MODIFY — real hardware data)
| Device | Task | RAW | SNN | Result |
|--------|------|-----|-----|--------|
| IBM Marrakesh (50q) | GHZ fidelity | 0.285 | 0.714 | +42.9% |
| IQM Garnet | SNN mitig. | baseline | +0.057 avg | 6/6 circuits |
| IQM Garnet | Sierpinski Z-Code LER | 0.100 | 0.048 | **2.08x best** |
| Rigetti Cepheus-108Q | Sierpinski Z-Code LER | 0.254 | 0.133 | 1.91x |
| IQM Emerald | Teleportation fidelity | — | 0.959–0.973 | rep. Northwestern 2026 |
| IBM Kingston | QFT / VQE / QAOA / ML / QKD / Sensing / MC | — | — | 8 domains validated |

Win rate: **97% over 63 circuits** (IBM + IQM). p=0.011, Cohen d=1.288 vs ZNE.

## Core algorithm (DO NOT change without real hardware validation)
```python
W[i,j] = (delta(i,j) - 1/N) * W_scale   # centering matrix
current[i] = W_scale * (p[i] - mean_p)   # neuronal current
# Regions: SIGNAL (c>0.10) | ZONA GRIS (-0.03..0.02) | RUIDO (c<-0.03)
```

## Public API (NEVER break backward compatibility)
```python
from noisebridge import rem_snn_correct, rem_correct, list_devices, load_params
# rem_snn_correct(counts, n, device) — RECOMMENDED for production
# rem_correct(counts, n, device)
# list_devices(recommended_only=False)
# load_params(device_id)
```

## Repository structure
```
fractkit-platform/             ← THIS repo (platform)
├── CLAUDE.md                  ← you are here (master context)
├── packages/
│   ├── api/                   ← Cloud REST API (FastAPI + Lambda)
│   └── sdk/                   ← FractKit SDK Pro + CLI (Session 6+)
├── apps/
│   ├── web/                   ← fractkit.io landing (Next.js 14)
│   └── dashboard/             ← user portal (API keys, usage, billing)
├── infra/
│   ├── aws/                   ← SAM templates
│   └── github-actions/        ← CI/CD workflows
└── scripts/
    └── benchmark_runner.py    ← (to build)

noisebridge/                   ← SEPARATE repo (MousMou/noisebridge)
                                  published to PyPI as `noisebridge`
                                  installed here via: pip install noisebridge
```

> **Option B**: noisebridge is an external PyPI package. fractkit-platform consumes it
> as a normal dependency (`noisebridge>=0.3.0` in requirements.txt). Do NOT copy its
> source into this repo.

## Tech stack
- **Core**: Python 3.10+, NumPy — noisebridge already in PyPI
- **API**: FastAPI, Mangum (Lambda adapter), AWS API Gateway
- **Auth**: API key via header `X-API-Key`, tiers in DynamoDB
- **Infra**: AWS Lambda + DynamoDB + S3, GitHub Actions, Stripe
- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Deploy**: Vercel (web), AWS SAM (API), PyPI (package)

## Device registry (11 QPUs — do not change values)
Defined in the `noisebridge` PyPI package (`noisebridge/registry.py` in MousMou/noisebridge).
Families: IBM Quantum, IQM, Rigetti, IonQ, Quantinuum.

## Coding conventions
- **Tests**: pytest, ≥80% coverage on all packages. Run before every commit.
- **Commits**: Conventional Commits — `feat:`, `fix:`, `test:`, `docs:`, `chore:`
- **Types**: no mypy yet; add in v0.5+
- **Python compat**: 3.10, 3.11, 3.12
- **Deps**: keep minimal — only numpy for noisebridge core
- **Secrets**: NEVER commit API keys, AWS creds, Stripe keys. Use env vars.
- **PyPI publish**: only via git tag `vX.Y.Z` + all tests green (CI/CD auto-publishes)

## FractKit domains (D1–D9, all validated on IBM Kingston except D9)
D1=QFT, D2=Chemistry(VQE), D3=QEC(Sierpinski/SurfaceCode),
D4=Optimization(QAOA), D5=ML(quantum kernel), D6=Cryptography(QKD BB84),
D7=Sensing(magnetometry), D8=Simulation(Monte Carlo), D9=Communication(teleportation)

## Obsidian wiki
The research knowledge base is at `D:/Jarvis-Fractal/memoria/` (129 notes, Obsidian vault).
INGEST workflow is defined in `D:/Jarvis-Fractal/memoria/FractKit/CLAUDE.md`.
When creating benchmark result notes, follow that schema exactly.

## DO NOT
- Invent benchmark results — every number must come from tests/ fixtures or Obsidian vault
- Modify the centering matrix algorithm without real hardware validation
- Add heavy dependencies to `packages/noisebridge/` (only numpy)
- Push to main without passing CI
- Commit any credential, token, or API key
- Break `rem_snn_correct()` API signature
