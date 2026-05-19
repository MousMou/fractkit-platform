---
cssclasses: domain-cyan
---

# FractKit Knowledge Base — Wiki Schema
# CLAUDE.md

Este archivo es el **schema** de la wiki FractKit. Define estructura, convenciones y
workflows que Claude debe seguir para mantener la base de conocimiento de forma
consistente entre sesiones.

---

## 1. Estructura del Directorio

```
memoria/FractKit/
├── CLAUDE.md               ← este archivo (schema, nunca modificar sin consenso)
├── index.md                ← catálogo maestro (Claude actualiza en cada ingest)
├── log.md                  ← log cronológico append-only
│
├── Devices/                ← una página por QPU
│   ├── ibm_kingston.md
│   ├── iqm_garnet.md
│   └── ...
│
├── Experiments/
│   ├── QEC/                ← Quantum Error Correction
│   ├── Chemistry/          ← VQE, PySCF, moléculas
│   └── Cryptography/       ← BB84, QKD, post-quantum
│
├── SNN/                    ← todo lo relativo al modelo SNN-NR
│   ├── architecture.md
│   ├── params_evolution.md ← historial de mejoras de params
│   ├── training_log.md
│   └── best_configs.md
│
├── Analysis/               ← comparativas, síntesis, hallazgos
│
└── Sources/                ← resúmenes de JSON raw (inmutables)
```

---

## 2. Tipos de Página y Metadatos Obligatorios

Cada página empieza con un bloque de metadatos YAML:

```yaml
---
type: device | experiment | snn | analysis | source
title: Nombre legible
tags: [qec, snn, ibm, iqm, chemistry, crypto, ...]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [archivo1.json, archivo2.json]
links: [[Página relacionada]], [[Otra página]]
---
```

### 2.1 Página de Device
Campos requeridos: `backend_id`, `technology` (superconducting|trapped-ion),
`n_qubits`, `native_gates`, `readout_error_rate`, `cx_error_rate`,
`noisebridge_validated` (bool), sección `## Benchmarks` con tabla LER.

### 2.2 Página de Experiment
Campos requeridos: `experiment_type` (QEC|VQE|crypto), `device`, `date`,
`shots`, `p_values` (para QEC), `circuit` (descripción), sección `## Results`,
sección `## Conclusions`, sección `## Links` con conexiones a otras páginas.

### 2.3 Página SNN
Campos requeridos: `params` (dict), `validated_on` (lista de devices),
`LER_improvement` (media SNN/RAW), sección `## Changes from Previous Version`.

### 2.4 Página de Analysis
Síntesis libre. Siempre incluye: fecha, datos que contrasta, conclusiones
numeradas, y sección `## Open Questions`.

---

## 3. Convenciones de Nomenclatura

- Archivos: `snake_case.md` dentro de subcarpetas temáticas.
- Links internos: `[[Nombre de la página]]` (estilo Obsidian).
- Tags: siempre en minúsculas, plural para categorías (`devices`, `experiments`).
- Fechas: ISO 8601 (`2026-05-15`).
- Números: 4 decimales para LER, 3 para ratios (e.g. `0.650x`).

---

## 4. Workflow: INGEST

Cuando se añade una nueva fuente (JSON de experimento, paper, resultado):

1. **Lee** el archivo fuente completamente.
2. **Crea** `Sources/nombre_fuente.md` con: resumen ejecutivo, métricas clave,
   fecha, backend, tipo de experimento.
3. **Actualiza o crea** la página del Device correspondiente:
   - Añade fila a la tabla `## Benchmarks`.
   - Actualiza `noisebridge_validated` si aplica.
4. **Actualiza o crea** la página del Experiment:
   - Escribe o actualiza resultados, conclusiones, comparativa con experimentos previos.
5. **Actualiza** `SNN/best_configs.md` si el nuevo resultado mejora algún ratio.
6. **Actualiza** `Analysis/cross_device_comparison.md` si hay datos de múltiples backends.
7. **Actualiza** `index.md`: añade/modifica entradas para todas las páginas tocadas.
8. **Appends** a `log.md`: `## [FECHA] ingest | NOMBRE_FUENTE`.

Una sola ingestión puede tocar 5-10 páginas. Eso es correcto.

---

## 5. Workflow: QUERY

Cuando el usuario hace una pregunta sobre los datos:

1. Lee `index.md` para identificar páginas relevantes.
2. Lee las páginas relevantes (máx 5-7 para no saturar contexto).
3. Sintetiza la respuesta con citas a páginas: `([[Página]], [[Otra]])`.
4. Si la respuesta es valiosa y no efímera, **créala como página** en `Analysis/`.
5. Actualiza `index.md` y appends a `log.md`: `## [FECHA] query | PREGUNTA_BREVE`.

---

## 6. Workflow: LINT

Periódicamente, ejecutar health-check de la wiki:

1. Buscar páginas sin links entrantes (orphans).
2. Buscar claims contradictorios entre páginas (e.g., dos valores distintos para
   el mismo parámetro).
3. Buscar conceptos mencionados pero sin página propia.
4. Identificar experimentos sin página en `Sources/`.
5. Proponer 3-5 preguntas de investigación nuevas basadas en gaps detectados.
6. Appends a `log.md`: `## [FECHA] lint | N_issues_found`.

---

## 7. Workflow: SNN_LOOP

El ciclo de auto-mejora del modelo SNN:

1. **Lee** todas las páginas de `SNN/` y `Experiments/QEC/`.
2. **Identifica** el mejor ratio SNN/RAW histórico y los params usados.
3. **Ejecuta** `python snn_improvement_loop.py` (lee JSONs, optimiza, valida).
4. **Lee** el output JSON generado por el loop.
5. **Actualiza** `SNN/params_evolution.md` con nueva entrada.
6. **Actualiza** `SNN/best_configs.md` si mejoran los resultados.
7. **Actualiza** `SNN/training_log.md`.
8. **Appends** a `log.md`: `## [FECHA] snn_loop | delta_ratio`.

---

## 8. Dominios de Conocimiento

### 8.1 QEC (Quantum Error Correction)
- Circuit: Surface Code d=3, Z-only, 13 qubits (9 data + 4 ancilla).
- Métricas: LER_raw, LER_mwpm, LER_snn, LER_snn/LER_raw (ratio).
- Insight clave: MWPM falla en hardware real (ancilla readout noise).
  SNN es robusto porque opera en data qubits, no en síndrome.
- Backends probados: IBM Kingston, IQM Garnet (OpenQuantum).
- Pendiente: mid-circuit (Level 4, 3 rondas síndrome), Rigetti.

### 8.2 Chemistry (VQE)
- Moléculas: H2, LiH, H2O, N2.
- Framework: PySCF + Qiskit Nature.
- Métricas: E_vqe vs E_exact (error %), fidelidad de estado.
- SNN mejora distribución de mediciones → menor error VQE.

### 8.3 Cryptography
- Protocolo: BB84 QKD, distribución cuántica de claves.
- Métricas: QBER (Quantum Bit Error Rate), security threshold.
- SNN como filtro de ruido en la distribución de bases.

### 8.4 SNN Architecture
- Arquitectura: Centering matrix LIF (Leaky Integrate-and-Fire).
- W[i,j] = (δ(i,j) - 1/N) × W_scale
- Corriente: (W @ x)[i] = W_scale × (x[i] - mean(x))
- Params: beta, threshold, W_scale, snn_factor, T.
- Validado en: IQM Garnet (2026-05-12), IBM Kingston (2026-05-13),
  OpenQuantum IQM Garnet (2026-05-15).

---

## 9. Tabla de Resultados Clave (Estado Actual)

| Device | Fecha | Nivel | N puntos | SNN/RAW medio | MWPM/RAW |
|--------|-------|-------|----------|---------------|----------|
| IBM Kingston | 2026-05-13 | L1 | 11 | 0.600x | >1.0x |
| IBM Kingston | 2026-05-13 | L2 | 21 | 0.796x | >1.0x |
| IBM Kingston | 2026-05-13 | L3 (2 reps) | 7 | 0.597x | >1.0x |
| IQM Garnet (OQ) | 2026-05-15 | L1 mini | 1+ | ~0.650x | >1.0x |
| IQM Garnet (real) | 2026-05-12 | GHZ 2-5q | 6 | +5.7% fidelity | N/A |

---

## 10. Reglas de Consistencia

- **Nunca modificar** archivos en `Sources/` una vez creados.
- **Siempre actualizar** `index.md` y `log.md` en cada operación.
- **Citar datos con fuente**: no afirmar valores sin referenciar el JSON/experimento.
- **Conservar incertidumbre**: si un experimento está incompleto (e.g., L3 reps 3-5
  pendientes), marcarlo con `⚠ datos incompletos` en la página.
- **Versionar cambios de params SNN**: nunca sobreescribir el historial.

---

## 11. Comandos de Referencia Rápida

```bash
# Ingerir todos los JSONs existentes
python ingest.py --all

# Ingerir un archivo específico
python ingest.py --file ler_L2_ibm_kingston_20260513.json

# Ejecutar ciclo de mejora SNN
python snn_improvement_loop.py

# Sincronizar wiki con NotebookLM
python notebooklm_sync.py --push

# Consultar NotebookLM
python notebooklm_sync.py --ask "¿Cuál es la mejor configuración SNN para IBM?"

# Health-check de la wiki
python ingest.py --lint
```

---

*Schema v1.0 — creado 2026-05-15 — co-autores: Mou + Claude*
