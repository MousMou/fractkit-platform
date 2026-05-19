# fractkit-platform

Monorepo for the FractKit quantum computing platform.
Core product: **noisebridge** — quantum noise mitigation, zero overhead.

```bash
pip install noisebridge
```

## Repository layout

| Path | Description |
|------|-------------|
| `packages/api/` | Cloud REST API (FastAPI + Lambda) |
| `packages/sdk/` | FractKit SDK Pro + CLI |
| `apps/web/` | fractkit.io landing page (Next.js 14) |
| `infra/aws/` | AWS SAM deployment templates |
| `infra/github-actions/` | CI/CD workflows |

## Validated results (real hardware)

| Device | Task | RAW → SNN | Improvement |
|--------|------|-----------|-------------|
| IBM Marrakesh 50q | GHZ fidelity | 0.285 → 0.714 | **+42.9%** |
| IQM Garnet | Sierpinski Z-Code LER | 0.100 → 0.048 | **2.08x** |
| Rigetti Cepheus-108Q | Sierpinski Z-Code LER | 0.254 → 0.133 | **1.91x** |
| IQM Emerald | Teleportation F | — → 0.959–0.973 | rep. Northwestern 2026 |

97% win rate over 63 circuits | p=0.011 | Cohen d=1.288 vs ZNE

## Links

- PyPI: [noisebridge](https://pypi.org/project/noisebridge/)
- GitHub core package: [MousMou/noisebridge](https://github.com/MousMou/noisebridge)
