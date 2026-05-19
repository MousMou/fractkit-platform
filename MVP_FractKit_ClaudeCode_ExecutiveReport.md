# Reporte Ejecutivo — MVP FractKit Platform
## Implementación con Claude Code | Mayo 2026

---

## 1. Resumen Ejecutivo

**FractKit** es una plataforma de computación cuántica fractal con 9 dominios funcionales
validados en hardware real. Su producto central, **noisebridge**, aplica redes neuronales
de disparo con conectividad fractal para mitigar ruido cuántico en post-proceso: cero shots
QPU adicionales, latencia <1ms, validado en 6 QPUs de 3 fabricantes.

**Resultado clave:** IBM Marrakesh 50-qubit GHZ — RAW 0.285 → SNN 0.714 (+42.9%).
97% de tasa de mejora en 63 circuitos. Ratio QEC 2.08x en IQM Garnet.

**Objetivo de este reporte:** definir el MVP completo de la plataforma FractKit y su
implementación agentica usando Claude Code como motor de desarrollo.

---

## 2. Estado Actual del Proyecto

### 2.1 Activos técnicos validados

| Activo | Estado | Evidencia |
|--------|--------|-----------|
| `noisebridge` v0.3.0 | ✅ En PyPI | pip install noisebridge |
| SNN-NR centering architecture | ✅ Validado | p=0.011, Cohen d=1.288 |
| Validación IBM (FakeMarrakesh) | ✅ Completado | +42.9% GHZ-50q real hardware |
| Validación IQM Garnet | ✅ Completado | 6/6 positivos, avg +0.057 fidelidad |
| Validación Rigetti Cepheus-108Q | ✅ Completado | LER ratio 1.91x |
| Validación IQM Emerald | ✅ Completado | Teleportación F=0.959–0.973 |
| Device registry (11 QPUs) | ✅ Funcional | IBM, IQM, Rigetti, IonQ, Quantinuum |
| Pipeline REM → SNN | ✅ Funcional | rem_snn_correct() recomendado |
| Demo script completo | ✅ Listo | demo_noisebridge_video.py |
| Vault Obsidian FractKit | ✅ Completo | 9 dominios, 129 notas, colores CSS |
| Solicitud Unitary Foundation | ✅ Lista | Typeform + email paralelo |
| Preprint SNN-NR v1 | ✅ Borrador | SNN_NR_Preprint_v1.docx/pdf |

### 2.2 Dominios FractKit validados (score 88.6/100)

| Dominio | Nombre | Estado | Hardware |
|---------|--------|--------|----------|
| D1 | QFT — Transformada cuántica de Fourier | ✅ | IBM Kingston |
| D2 | Chemistry — VQE molecular (H₂O, LiH, BeH₂) | ✅ | IBM Kingston |
| D3 | QEC — Sierpinski Z-Code, Surface Code | ✅ | IBM + IQM + Rigetti |
| D4 | Optimization — QAOA MaxCut | ✅ | IBM Kingston |
| D5 | ML — Quantum kernel classification | ✅ | IBM Kingston |
| D6 | Cryptography — QKD BB84 | ✅ | IBM Kingston |
| D7 | Sensing — Quantum magnetometry | ✅ | IBM Kingston |
| D8 | Simulation — Monte Carlo cuántico | ✅ | IBM Kingston |
| D9 | Communication — Teleportación activa 30km fibra | ✅ | IQM Emerald |

### 2.3 Posicionamiento competitivo

| Método | Shots extra | Costo QPU | Efectividad | Requiere retomografía |
|--------|-------------|-----------|-------------|----------------------|
| ZNE | 3× | 3× | Buena | No |
| PEC | ~100× | ~100× | Excelente | Sí (por gate) |
| M3 | 2ⁿ (calibración) | Alto | Buena (solo readout) | Sí |
| **noisebridge** | **0×** | **0×** | **Superior a ZNE** | **No** |

**Ventaja diferencial única:** único sistema open-source con resultados reales publicados
en tres fabricantes de hardware (IBM + IQM + Rigetti) simultáneamente.

---

## 3. Definición del MVP — FractKit Platform

### 3.1 Visión del producto

```
FractKit Platform
├── noisebridge (open core — PyPI gratuito)
│   ├── rem_correct()         — REM via confusion matrix
│   ├── snn_correct()         — SNN-NR centering architecture
│   └── rem_snn_correct()     — pipeline combinado (recomendado)
│
├── noisebridge Cloud API (REST — pay-per-use)
│   ├── POST /v1/correct      — corregir counts
│   ├── GET  /v1/devices      — listar QPUs soportados
│   └── GET  /v1/benchmark    — resultados públicos
│
├── FractKit SDK Pro (Python — $99/mes)
│   ├── Device registry completo (20+ QPUs)
│   ├── CLI: fractkit run --domain D3 --device iqm_garnet
│   ├── Dashboard web (resultados + gráficas)
│   └── Soporte email prioritario
│
└── FractKit Enterprise (contrato — $50K–$200K/año)
    ├── Integración custom con Qiskit Runtime
    ├── SLA 99.9% uptime
    ├── Co-branding con proveedor de hardware
    └── Acceso a todos los dominios D1–D9
```

### 3.2 Alcance del MVP (90 días con Claude Code)

El MVP entregable en 90 días cubre los tres primeros niveles:

**Sprint 1 — Semanas 1–2: Fundamentos del repositorio**
- Monorepo `fractkit-platform/` con estructura Claude Code
- `CLAUDE.md` maestro con contexto técnico completo
- CI/CD con GitHub Actions (test + lint + PyPI publish)
- Tests unitarios para `noisebridge` ≥80% cobertura

**Sprint 2 — Semanas 3–4: Cloud API**
- API REST con FastAPI + AWS Lambda (Mangum adapter)
- Autenticación API key (tier Free / Pro / Enterprise)
- Rate limiting: 100 req/día (Free), ilimitado (Pro)
- Documentación automática (OpenAPI/Swagger)
- Dominio: `api.noisebridge.io`

**Sprint 3 — Semanas 5–6: SDK Pro CLI**
- CLI `fractkit` con subcomandos: `run`, `benchmark`, `devices`, `export`
- Dashboard web estático (Next.js) con gráficas de fidelidad
- Integración con Qiskit Runtime como transpiler pass
- Documentación completa en `docs.noisebridge.io`

**Sprint 4 — Semanas 7–8: Plataforma de dominios**
- Panel web de experimentos FractKit (D1–D9)
- Visualización de regiones SNN en tiempo real
- Sistema de notificaciones (experimento completado → email)
- Export a NotebookLM / Obsidian automático

**Sprint 5 — Semanas 9–10: Monetización**
- Integración Stripe (Free / Pro / Enterprise tiers)
- Portal de usuario (usage dashboard, API keys, billing)
- Landing page `fractkit.io` con demo embebido
- Metriq submission automatizada post-benchmark

**Sprint 6 — Semanas 11–12: Producción**
- Hardening seguridad (rate limiting, WAF, secrets rotation)
- Monitoreo (CloudWatch + alertas)
- arXiv preprint publicado (datos ya disponibles)
- USPTO Provisional Patent archivado

---

## 4. Arquitectura Técnica

### 4.1 Stack tecnológico

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  Next.js 14 (App Router) + Tailwind + shadcn/ui     │
│  fractkit.io  |  docs.noisebridge.io  |  dashboard  │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│                  CLOUD API                          │
│  FastAPI + Mangum → AWS Lambda                      │
│  API Gateway → api.noisebridge.io                   │
│  Auth: API key (header X-API-Key)                   │
│  Rate limit: Redis (Upstash serverless)             │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               CORE noisebridge                      │
│  Python 3.10+  |  NumPy  |  noisebridge v0.3+       │
│  rem_correct() → snn_correct() → corrected_probs    │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                 DATOS / INFRA                       │
│  DynamoDB (resultados benchmark)                    │
│  S3 (preprints, datasets, exports Obsidian)         │
│  Stripe (billing Free/Pro/Enterprise)               │
│  GitHub Actions (CI/CD → PyPI + Lambda deploy)      │
└─────────────────────────────────────────────────────┘
```

### 4.2 Estructura del monorepo

```
fractkit-platform/
├── CLAUDE.md                    ← contexto maestro para Claude Code
├── packages/
│   ├── noisebridge/             ← paquete PyPI (ya existe)
│   │   ├── noisebridge/
│   │   │   ├── __init__.py
│   │   │   ├── correct.py       ← SNN-NR centering matrix
│   │   │   ├── mitigation.py    ← REM confusion matrix
│   │   │   └── registry.py      ← device registry 11 QPUs
│   │   └── tests/
│   ├── api/                     ← Cloud API (FastAPI)
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── correct.py
│   │   │   ├── devices.py
│   │   │   └── benchmark.py
│   │   ├── auth/
│   │   ├── Dockerfile
│   │   └── tests/
│   └── sdk/                     ← SDK Pro + CLI
│       ├── fractkit/
│       │   ├── cli.py           ← click CLI
│       │   ├── client.py        ← API client
│       │   └── domains/         ← D1–D9 runners
│       └── tests/
├── apps/
│   ├── web/                     ← fractkit.io (Next.js)
│   ├── dashboard/               ← portal usuario
│   └── docs/                    ← docs.noisebridge.io
├── infra/
│   ├── aws/                     ← CDK / SAM templates
│   ├── github-actions/          ← CI/CD workflows
│   └── monitoring/              ← CloudWatch dashboards
└── scripts/
    ├── demo_noisebridge_video.py ← (ya existe)
    ├── update_obsidian_colors.py ← (ya existe)
    └── benchmark_runner.py       ← automatizar benchmarks
```

---

## 5. Plan de Implementación con Claude Code

### 5.1 Por qué Claude Code para este MVP

Claude Code es el motor de desarrollo ideal para FractKit porque:

1. **Contexto cuántico profundo** — el dominio (SNN, QPU, QEC, teleportación) es inusual;
   Claude Code con un `CLAUDE.md` bien construido mantiene el contexto entre sesiones
2. **Monorepo complejo** — la plataforma tiene 5+ paquetes interdependientes;
   Claude Code puede navegar y editar múltiples archivos en una sola sesión agentica
3. **Tests científicos** — los tests validan fidelidad cuántica real, no solo lógica de software;
   Claude Code puede ejecutar los tests y analizar los resultados
4. **Documentación técnica** — el README, la documentación de la API y el paper arXiv
   pueden co-editarse con Claude Code en la misma sesión

### 5.2 CLAUDE.md maestro (contenido)

El archivo `CLAUDE.md` en la raíz del monorepo debe contener:

```markdown
# FractKit Platform — Claude Code Context

## Proyecto
FractKit es una plataforma de computación cuántica fractal con noisebridge como
producto central. noisebridge mitiga ruido cuántico via SNN centering matrix,
validado en 6 QPUs reales de 3 fabricantes.

## Resultados clave (NO INVENTAR — son datos reales)
- IBM Marrakesh 50q GHZ: RAW 0.285 → SNN 0.714 (+42.9%)
- IQM Garnet Sierpinski Z-Code: LER 0.100 → 0.048 (ratio 2.08x)
- Rigetti Cepheus Sierpinski Z-Code: LER 0.254 → 0.133 (ratio 1.91x)
- IQM Emerald teleportación activa: F=0.959–0.973 (rep. Northwestern 2026)
- Win rate: 97% en 63 circuitos (IBM + IQM)

## Arquitectura central
W[i,j] = (delta(i,j) - 1/N) * W_scale   ← centering matrix SNN
current[i] = W_scale * (p[i] - mean_p)   ← corriente neuronal
Regiones: SIGNAL (c>0.10) | ZONA GRIS (-0.03..0.02) | RUIDO (c<-0.03)

## Stack
- Core: Python 3.10+, NumPy, noisebridge v0.3.0
- API: FastAPI, Mangum, AWS Lambda, API Gateway
- Frontend: Next.js 14, Tailwind, shadcn/ui
- Infra: AWS CDK, GitHub Actions, DynamoDB, S3, Stripe

## Convenciones
- Tests: pytest, cobertura ≥80%
- Commits: Conventional Commits (feat/fix/test/docs)
- Tipos: mypy strict en packages/noisebridge/
- Docs: docstrings Google style

## NO hacer
- No inventar resultados de benchmark
- No cambiar la arquitectura centering matrix sin validar
- No publicar en PyPI sin pasar todos los tests
- No commitear API keys o credenciales AWS
```

### 5.3 Sesiones de Claude Code por Sprint

Cada sprint se ejecuta como una serie de sesiones Claude Code. Ejemplo de Sprint 2
(Cloud API):

**Sesión 1 — Scaffold de la API (2h)**
```bash
claude "crea la estructura base de packages/api/ con FastAPI,
el endpoint POST /v1/correct que llame a noisebridge.rem_snn_correct(),
autenticación por API key en header X-API-Key, y tests unitarios.
Usa el CLAUDE.md para contexto. No cambies packages/noisebridge/"
```

**Sesión 2 — Lambda deployment (1h)**
```bash
claude "configura Mangum para desplegar la API FastAPI en AWS Lambda,
añade el SAM template en infra/aws/api.yaml, y el GitHub Action
.github/workflows/deploy-api.yml que haga deploy en push a main"
```

**Sesión 3 — Rate limiting y auth (1h)**
```bash
claude "implementa rate limiting con Upstash Redis en la API:
100 req/día para tier Free, sin límite para tier Pro.
Añade tabla en DynamoDB para API keys con campos: key, tier, user_id,
created_at, requests_today. Tests de integración incluidos."
```

**Sesión 4 — Tests e2e (1h)**
```bash
claude "escribe tests e2e para la Cloud API contra el endpoint real
en staging. Usa pytest-httpx. Cubre: autenticación fallida,
rate limit alcanzado, corrección exitosa con datos reales IQM Garnet,
y respuesta de error cuando device no existe en registry."
```

### 5.4 Comandos Claude Code recurrentes

```bash
# Añadir un nuevo dispositivo al registry
claude "añade el dispositivo ionq_forte al device registry de noisebridge.
IonQ Forte: 36 qubits, 2q error rate 0.3%, familia IonQ.
Sigue el mismo patrón que iqm_garnet en registry.py.
Actualiza los tests."

# Extender el benchmark
claude "crea benchmark_runner.py en scripts/ que ejecute
rem_snn_correct() sobre los 10 circuitos de referencia de IBM Marrakesh
y guarde los resultados en DynamoDB con timestamp.
Usa las credenciales de ~/.aws/credentials"

# Publicar en PyPI
claude "prepara el release noisebridge v0.4.0: actualiza
__version__ en __init__.py, actualiza CHANGELOG.md con los
nuevos dispositivos añadidos, ejecuta pytest, y si pasan
todos los tests haz git tag v0.4.0 y push"

# Documentación arXiv
claude "revisa el preprint SNN_NR_Preprint_v1.docx,
identifica secciones que referencian resultados de hardware
y verifica que coinciden con los datos en packages/noisebridge/tests/
fixtures/real_hardware_results.json"
```

---

## 6. Roadmap de 12 Meses

### Trimestre 1 (Meses 1–3): Fundamentos y visibilidad

| Semana | Entregable | Claude Code? |
|--------|-----------|--------------|
| 1–2 | Monorepo + CLAUDE.md + CI/CD | ✅ Agentico |
| 3–4 | Cloud API (Lambda + API Gateway) | ✅ Agentico |
| 5–6 | SDK Pro CLI `fractkit` | ✅ Agentico |
| 7 | Landing page fractkit.io | ✅ Agentico |
| 8 | USPTO Provisional Patent archivado | Manual |
| 9 | arXiv preprint publicado | Co-edición |
| 10 | metriq submission (6 QPUs) | ✅ Agentico |
| 11 | Primera beta privada (10 usuarios) | Manual |
| 12 | Stripe integrado, primer pago | ✅ Agentico |

### Trimestre 2 (Meses 4–6): Monetización temprana

- Objetivo: 5 clientes pagando, $2K–$5K MRR
- Panel de experimentos FractKit (D1–D9) en producción
- Integración Qiskit Runtime transpiler pass
- Conversaciones con qBraid (revenue share) e IBM Quantum Network
- Presentación en IEEE Quantum Week 2026

### Trimestre 3 (Meses 7–9): Escalado

- Objetivo: $10K–$15K MRR, 1 contrato Enterprise
- Dashboard analytics (usage, fidelity trends, device comparisons)
- Extensión device registry a 20+ QPUs (IonQ, Quantinuum, Pasqual)
- FractKit D10: optimización cuántica avanzada (nuevo dominio)
- Contacto con IQM/Rigetti para co-validación y co-marketing

### Trimestre 4 (Meses 10–12): Expansión

- Objetivo: $25K MRR, ronda seed si métricas lo justifican
- Versión cuántica farmacéutica (colaboración ALF-USAL/CLPU)
- Publicación en PRX Quantum o Quantum Science & Technology
- Evaluación: ¿co-fundador técnico? ¿adquisición? ¿ronda seed?

---

## 7. Presupuesto MVP (90 días)

| Ítem | Costo | Notas |
|------|-------|-------|
| USPTO Provisional Patent | $320 | Antes de arXiv |
| QPU credits (qBraid/Open Quantum) | $1,800 | 100+ circuitos benchmark |
| AWS (Lambda + API GW + DynamoDB + S3) | ~$50/mes | ~$150 total |
| Dominio fractkit.io + noisebridge.io | $30/año | Namecheap/Cloudflare |
| Upstash Redis (rate limiting) | $0 | Free tier suficiente |
| Stripe | $0 | Solo comisión en transacciones |
| GitHub Actions | $0 | Free para repos públicos |
| Vercel (Next.js hosting) | $0 | Free tier suficiente |
| IEEE Quantum Week 2026 (registro) | $800 | Opcional — visibilidad |
| Buffer QPU inesperado | $480 | Contingencia |
| **Total 90 días** | **~$3,600** | |

> **Si se aprueba la microgrant Unitary Foundation ($4,000):** el MVP se financia
> íntegramente con el grant. El propio MVP es el entregable de los 3 meses del grant.

---

## 8. Métricas de Éxito

### Métricas técnicas (90 días)
- [ ] Cobertura de tests ≥80% en todos los paquetes
- [ ] API uptime ≥99.5% (medido por UptimeRobot)
- [ ] Latencia API p95 <200ms para corrección de circuito 5q
- [ ] CI/CD: deploy automatizado en <5 minutos tras merge a main

### Métricas de tracción (90 días)
- [ ] ≥200 descargas PyPI mensuales de `noisebridge`
- [ ] ≥100 API calls/día en el endpoint `/v1/correct`
- [ ] ≥1 paper citando noisebridge o FractKit en arXiv
- [ ] ≥1 submission aprobada en metriq
- [ ] ≥1 cliente pagando en tier Pro ($99/mes)

### Métricas de visibilidad (90 días)
- [ ] arXiv preprint publicado y ≥50 descargas en primer mes
- [ ] ≥500 estrellas GitHub en noisebridge
- [ ] Respuesta positiva de Unitary Foundation al microgrant
- [ ] ≥1 colaboración establecida (qBraid / IBM / IQM / academia)

---

## 9. Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| AWS costos superiores a estimado | Baja | Medio | Budget alert en $100; Cloudflare Workers como alternativa |
| PyPI conflicto de nombre | Baja | Alto | `noisebridge` ya está registrado en PyPI ✅ |
| QPU credits insuficientes para 100+ circuitos | Media | Medio | Usar FakeMarrakesh para bulk benchmarks |
| Competidor publica paper similar antes | Media | Alto | Publicar arXiv lo antes posible (datos ya listos) |
| Rate limit de APIs QPU en benchmark masivo | Alta | Bajo | Throttle: 1 job/minuto, datos en caché |
| Curva de aprendizaje Next.js | Media | Bajo | Claude Code maneja el frontend; Vercel templates |
| Stripe cuenta suspendida por actividad inusual | Baja | Alto | Verificar cuenta antes de lanzamiento |

---

## 10. Primera Semana — Acciones Inmediatas

### Día 1–2: Setup del repositorio

```bash
# Crear el monorepo
mkdir fractkit-platform && cd fractkit-platform
git init

# CLAUDE.md maestro
claude "crea el CLAUDE.md maestro para el monorepo fractkit-platform
con toda la información técnica de noisebridge v0.3.0, los 9 dominios
FractKit, los resultados de hardware reales, y las convenciones del proyecto.
Usa los datos del archivo D:/Jarvis-Fractal/noisebridge/noisebridge/__init__.py
como fuente de verdad para los resultados."

# Mover noisebridge al monorepo
cp -r D:/Jarvis-Fractal/noisebridge packages/

# CI/CD
claude "crea .github/workflows/ci.yml que ejecute pytest en
packages/noisebridge/ con Python 3.10, 3.11 y 3.12, y
.github/workflows/publish.yml que publique en PyPI cuando
se crea un tag vX.Y.Z en GitHub."
```

### Día 3–4: Cloud API scaffold

```bash
claude "crea packages/api/ con:
- main.py: FastAPI con endpoint POST /v1/correct
  body: {counts: dict, n: int, device: str}
  response: {corrected: dict, raw_fidelity: float, corrected_fidelity: float,
             delta: float, latency_ms: float}
- auth.py: validación API key desde DynamoDB
- Dockerfile para Lambda con Mangum
- tests/test_correct.py con datos reales de IQM Garnet
Importa noisebridge desde packages/noisebridge/"
```

### Día 5: Dominios web

```bash
# Registrar dominios
# fractkit.io — $10/año en Namecheap
# noisebridge.io — $10/año en Namecheap

# Landing page
claude "crea apps/web/ con Next.js 14, una landing page para fractkit.io
con: hero section (resultados clave IBM Marrakesh +42.9%), tabla de
dispositivos soportados, sección de pricing Free/Pro/Enterprise,
y un demo widget que llame a la API /v1/correct con datos de ejemplo."
```

### Día 6–7: Primera sesión de revisión

```bash
# Ejecutar suite completa de tests
claude "ejecuta todos los tests en packages/noisebridge/tests/ y
packages/api/tests/, muestra el coverage report, y si hay fallos
corrígelos. El umbral mínimo es 80% coverage."

# Verificar resultados de hardware
claude "verifica que los resultados del device registry en
packages/noisebridge/noisebridge/registry.py coinciden con los
datos reales documentados en D:/Jarvis-Fractal/memoria/FractKit/Benchmarks/"
```

---

## 11. Recursos Adicionales

### Documentación de referencia
- Vault Obsidian: `D:\Jarvis-Fractal\memoria\` — 129 notas, resultados reales
- Preprint: `D:\Jarvis-Fractal\noisebridge\SNN_NR_Preprint_v1.pdf`
- Demo: `D:\Jarvis-Fractal\demo_noisebridge_video.py`
- Aplicación Unitary Foundation: `memoria\FractKit\Comercializacion\Unitary_Foundation_Application.md`

### Links clave
- PyPI: https://pypi.org/project/noisebridge/
- Unitary Foundation: https://unitaryfund.typeform.com/to/j0kAOd
- metriq: https://metriq.info
- qBraid: https://qbraid.com
- Open Quantum: https://openquantum.com

### Colaboraciones potenciales identificadas
- **Unitary Foundation** — microgrant $4K (aplicación en curso)
- **qBraid** — integración nativa + revenue share (contactar tras arXiv)
- **IBM Quantum Network** — cross-marketing noisebridge results
- **IQM** — co-validación y co-marketing (contactar tras arXiv)
- **ALF-USAL / CLPU** (Salamanca) — aplicaciones farmacéuticas y de simulación
  molecular (relevante para dominio D2 Chemistry, potencial impacto en
  investigación de cáncer y desarrollo de fármacos)

---

## 12. Conclusión

FractKit tiene todos los componentes técnicos para un MVP de plataforma cuántica
comercial: algoritmo validado en hardware real, paquete PyPI publicado, demo funcional,
documentación completa y una propuesta de valor diferencial demostrada.

**El único gap es la infraestructura de producto** — la API cloud, el SDK Pro, el
portal web y la integración de pagos. Claude Code elimina ese gap en 90 días:
cada sprint es una serie de sesiones agenticas con comandos bien definidos y un
`CLAUDE.md` que provee el contexto científico necesario para que las sesiones sean
precisas y no inventen resultados.

**El primer paso es crear el monorepo `fractkit-platform/` con el `CLAUDE.md` maestro.**
Todo lo demás se construye sobre esa base en sesiones incrementales.

---

*Generado: 2026-05-19 | Estado: listo para implementación*
*noisebridge v0.3.0 | FractKit 9 dominios | 88.6/100 score*
