# Instrucciones Operacionales — FractKit MVP
## Guía paso a paso para Claude Code | Estado: Ahora mismo

> Este documento asume que el CLAUDE.md de Obsidian (`memoria/FractKit/CLAUDE.md`)
> ya existe y define el schema de la wiki. Estas instrucciones lo extienden para
> el desarrollo de producto con Claude Code.

---

## ETAPA 0 — Esta semana (días 1–7)
### Objetivo: Preparar la base antes de escribir una sola línea de código

---

### 0.1 Grabar el video para Unitary Foundation
**Tiempo estimado: 2 horas**

**Prerequisitos exactos:**
```powershell
cd D:\Jarvis-Fractal
set PYTHONPATH=D:\Jarvis-Fractal\noisebridge
```

**Paso 1 — Preparar la terminal:**
- Fuente: Consolas 14pt o similar, fondo negro
- Resolución: 1920×1080 mínimo
- Ejecutar `cls` para limpiar pantalla antes de empezar a grabar

**Paso 2 — Ejecutar el demo:**
```powershell
python demo_noisebridge_video.py
```

**Paso 3 — Subir el video:**
- YouTube: "Upload" → "Unlisted" → título: `noisebridge — quantum noise mitigation demo 2026`
- O Loom: loom.com → New Recording → Screen Only
- Copiar la URL resultante

**Paso 4 — Completar el Typeform:**
- Abrir: https://unitaryfund.typeform.com/to/j0kAOd
- Nombre: tu nombre completo
- Email: partrabajo613@gmail.com
- Pegar todas las respuestas del archivo:
  `D:\Jarvis-Fractal\memoria\FractKit\Comercializacion\Unitary_Foundation_Application.md`
- En el campo "Link to your 2-minute video": pegar la URL del paso 3
- En GitHub URL: https://github.com/[tu-usuario]/noisebridge
- Enviar

**Paso 5 — Email paralelo (mismo día):**
```
To: info@unitary.foundation
Subject: noisebridge — quantum noise mitigation via fractal SNN | microgrant application + metriq

(usar el texto exacto del archivo Unitary_Foundation_Application.md, sección EMAIL PARALELO)
```

---

### 0.2 Crear el repositorio en GitHub
**Tiempo estimado: 30 minutos**

**Paso 1 — Crear repo en GitHub:**
- github.com → New repository
- Nombre: `noisebridge`
- Descripción: `Zero-overhead quantum noise mitigation via spiking neural networks`
- Público ✅
- Licencia: **Business Source License 1.1** (BSL) — libre para investigación,
  comercial requiere licencia. Esto protege la IP antes del arXiv.

**Paso 2 — Subir el código existente:**
```powershell
cd D:\Jarvis-Fractal\noisebridge
git init
git add .
git commit -m "feat: noisebridge v0.3.0 — validated on 6 real QPUs from 3 vendors"
git remote add origin https://github.com/[tu-usuario]/noisebridge.git
git push -u origin main
git tag v0.3.0
git push origin v0.3.0
```

**Paso 3 — Editar README.md con Claude Code:**
Abre una terminal en `D:\Jarvis-Fractal\noisebridge` y ejecuta:
```bash
claude "reescribe README.md para noisebridge v0.3.0. Debe incluir:
- Badge PyPI version, badge tests, badge license
- Hero: 'Zero-overhead quantum noise mitigation via spiking neural networks'
- Tabla de resultados reales: IBM Marrakesh +42.9%, IQM Garnet 2.08x, Rigetti 1.91x
- Quick start con rem_snn_correct() en 5 líneas
- Tabla de 11 dispositivos soportados del DEVICE_REGISTRY
- Sección 'Why noisebridge?' vs ZNE vs PEC vs M3
- Sección Installation: pip install noisebridge
- Sección Citation con placeholder para arXiv DOI
No inventar resultados. Usar solo los datos del __init__.py y registry.py"
```

---

### 0.3 Crear el CLAUDE.md de desarrollo (diferente al de Obsidian)
**Tiempo estimado: 20 minutos**

El CLAUDE.md que ya tienes en Obsidian es el schema de la **wiki de conocimiento**.
Necesitas uno diferente para el **repositorio de código**. Crea este archivo en
`D:\Jarvis-Fractal\noisebridge\CLAUDE.md`:

```bash
claude "crea CLAUDE.md para el repositorio noisebridge con:

## Proyecto
noisebridge: mitigación de ruido cuántico via SNN centering matrix.
Validado en 6 QPUs reales: IBM Marrakesh, IQM Garnet, IQM Emerald,
Rigetti Cepheus-108Q (3 fabricantes).

## Resultados reales (NO inventar, NO modificar)
- IBM Marrakesh 50q GHZ: RAW 0.285 -> SNN 0.714 (+42.9%)
- IQM Garnet Sierpinski Z-Code: LER_snn=0.048 vs LER_raw=0.100 (ratio 2.08x) MEJOR RESULTADO
- Rigetti Cepheus-108Q Sierpinski Z-Code: LER_snn=0.133 vs LER_raw=0.254 (ratio 1.91x)
- IQM Emerald teleportacion activa 30km fibra: F=0.959-0.973 (rep. Northwestern 2026)
- Win rate: 97% en 63 circuitos cross-vendor (IBM + IQM)
- p=0.011, Cohen d=1.288 vs ZNE (estadisticamente significativo)

## Arquitectura central (NO modificar sin validar en hardware)
W[i,j] = (delta(i,j) - 1/N) * W_scale   <- centering matrix
current[i] = W_scale * (p[i] - mean(p))  <- corriente neuronal
Regiones: SIGNAL (c > 0.10) | ZONA GRIS (-0.030 a 0.02) | RUIDO (c < -0.030)

## API publica (packages a no romper)
- rem_snn_correct(counts, n, device)  <- RECOMENDADO, siempre backward-compatible
- rem_correct(counts, n, device)
- snn_correct(counts, params, n)
- list_devices(recommended_only=False)
- load_params(device_id)

## Estructura
noisebridge/
  __init__.py    <- version, exports
  correct.py     <- SNN centering matrix
  mitigation.py  <- REM confusion matrix
  registry.py    <- DEVICE_REGISTRY 11 QPUs
tests/
  test_correct.py
  test_mitigation.py
  test_registry.py

## Reglas de desarrollo
- Tests: pytest, cobertura >= 80%, ejecutar antes de cualquier commit
- Tipos: no se requiere mypy por ahora, añadir en v0.5+
- Compatibilidad: Python 3.10, 3.11, 3.12
- Dependencias: solo numpy (no añadir deps pesadas sin consenso)
- PyPI publish: solo con git tag vX.Y.Z y todos los tests verdes
- NUNCA modificar los valores en DEVICE_REGISTRY sin datos reales de hardware"
```

---

## ETAPA 1 — Semana 2–4: arXiv + USPTO + Tests
### Objetivo: Proteger la IP y dar credibilidad científica

---

### 1.1 Completar los tests de noisebridge
**Tiempo estimado: 3 horas con Claude Code**

```bash
cd D:\Jarvis-Fractal\noisebridge

claude "revisa el estado actual de los tests en tests/.
Objetivo: cobertura >= 80% en noisebridge/correct.py, mitigation.py y registry.py.
Para cada función sin test, escribe el test correspondiente.
Usa datos reales del hardware en los fixtures (están en los archivos de benchmark
en D:/Jarvis-Fractal/memoria/FractKit/Benchmarks/).
Al final ejecuta pytest --cov=noisebridge --cov-report=term-missing y muestra el resultado."
```

Si hay errores:
```bash
claude "el test [nombre] falla con [error]. Corrígelo sin cambiar la
implementación en noisebridge/ — solo los tests deben cambiar."
```

---

### 1.2 Configurar CI/CD con GitHub Actions
**Tiempo estimado: 1 hora con Claude Code**

```bash
claude "crea .github/workflows/ci.yml que:
1. Se ejecute en push a cualquier rama y en pull_request a main
2. Use matrix: python-version: [3.10, 3.11, 3.12]
3. Instale: pip install -e '.[dev]' (añade grupo dev en pyproject.toml con pytest, pytest-cov)
4. Ejecute: pytest --cov=noisebridge --cov-fail-under=80
5. Haga upload del coverage report a Codecov (token en secreto CODECOV_TOKEN)

También crea .github/workflows/publish.yml que:
1. Se ejecute solo en push de tags que empiecen por v (v*.*.*)
2. Instale build y twine
3. Ejecute python -m build
4. Publique en PyPI usando secreto PYPI_API_TOKEN"
```

Después ve a GitHub → Settings → Secrets → añade:
- `PYPI_API_TOKEN`: tu token de PyPI (pypi.org → Account → API tokens)
- `CODECOV_TOKEN`: de codecov.io (registro gratuito)

---

### 1.3 Preparar el preprint arXiv
**Tiempo estimado: 4 horas con Claude Code**

El borrador ya existe en `D:\Jarvis-Fractal\noisebridge\SNN_NR_Preprint_v1.docx`.

```bash
claude "lee el archivo D:/Jarvis-Fractal/noisebridge/SNN_NR_Preprint_v1.docx.
Identifica:
1. Secciones que faltan o están incompletas
2. Resultados numéricos citados que NO coinciden con los datos de los tests
3. Figuras que se mencionan pero no existen
4. Referencias bibliográficas que necesitan DOI real

Genera un informe de gaps con prioridad: CRÍTICO (bloquea publicación) /
IMPORTANTE (debilita el paper) / OPCIONAL (mejora pero no es urgente)"
```

Una vez revisado:
```bash
claude "actualiza la sección Abstract del preprint con este texto exacto
(aprobado para la aplicación Unitary Foundation):

noisebridge corrects quantum measurement distributions via spiking neural networks
(fractal LIF architecture) — zero additional QPU shots required. Unlike ZNE (3x
shot overhead) or PEC (exponential cost), correction takes <1ms at no extra cost.
Validated on 6 real QPUs from 3 manufacturers: IBM Marrakesh (50-qubit GHZ:
RAW 0.285 to 0.714, +42.9%), IQM Garnet (97% win rate, 63 circuits), Rigetti
Cepheus-108Q (1.91x QEC ratio), IQM Emerald (quantum teleportation F=0.97,
replicating Northwestern 2026 active fiber experiment).

Asegúrate de que todos los números en el abstract coinciden exactamente con
los datos en noisebridge/tests/ y en memoria/FractKit/Benchmarks/"
```

**Checklist antes de subir a arXiv:**
- [ ] Todos los números del paper coinciden con los datos de hardware reales
- [ ] USPTO Provisional Patent archivado (HACER ANTES del submit arXiv)
- [ ] README GitHub actualizado con link al preprint
- [ ] Zenodo: subir el dataset de resultados de hardware (zenodo.org, gratuito)
- [ ] ORCID: registrar si no tienes (orcid.org, gratuito)

---

### 1.4 USPTO Provisional Patent
**Tiempo estimado: 2 horas**

Esto es MANUAL — Claude Code no puede archivarlo por ti.

**Instrucciones exactas:**
1. Ir a: https://www.uspto.gov/patents/apply/provisional-applications
2. Crear cuenta en EFS-Web (Electronic Filing System)
3. Completar formulario AIA/14 con:
   - Title: "Method for Quantum Measurement Error Mitigation Using Fractal
     Spiking Neural Network Post-Processing"
   - Inventor: tu nombre completo y dirección
   - Micro entity status: SÍ (reduce el fee a ~$320 si eres independent inventor)
4. Adjuntar como especificación técnica este texto generado con Claude Code:

```bash
claude "escribe la especificación técnica para una patente provisional USPTO
sobre el método SNN-NR de noisebridge. Debe incluir:
- Field of Invention
- Background (problema: ruido NISQ, ZNE caro, PEC inpráctico)
- Summary of Invention (centering matrix SNN post-processing)
- Detailed Description (algoritmo W[i,j] = (delta-1/N)*W_scale, pipeline REM->SNN)
- Claims (al menos 10 claims independientes y dependientes)
- Abstract
Formato: texto plano, sin LaTeX, sin figuras (provisional no las requiere).
Énfasis en: zero-shot overhead, fractal connectivity, device-specific registry,
cross-vendor validation (IBM + IQM + Rigetti)."
```

5. Pagar: ~$320 (micro entity) via tarjeta de crédito
6. Guardar el número de aplicación — tienes 12 meses para la aplicación completa

---

## ETAPA 2 — Semana 5–8: Cloud API
### Objetivo: Primera versión del endpoint /v1/correct en producción

---

### 2.1 Scaffold de la API
**Tiempo estimado: 3 horas con Claude Code**

```bash
# Crear estructura
mkdir D:\Jarvis-Fractal\fractkit-api
cd D:\Jarvis-Fractal\fractkit-api

claude "crea un proyecto FastAPI para noisebridge Cloud API con:

Estructura:
  app/
    main.py          <- FastAPI app con lifespan
    routes/
      correct.py     <- POST /v1/correct
      devices.py     <- GET /v1/devices
      health.py      <- GET /health
    auth/
      api_key.py     <- validación de API key
    models/
      request.py     <- CorrectionRequest (pydantic)
      response.py    <- CorrectionResponse (pydantic)
  requirements.txt   <- fastapi, mangum, boto3, pydantic, noisebridge
  Dockerfile         <- python:3.11-slim, para Lambda

Endpoint POST /v1/correct:
  Request body:
    counts: dict[str, int]   <- mediciones del QPU
    n: int                   <- numero de qubits
    device: str              <- ID del dispositivo (ver DEVICE_REGISTRY)
    method: str = 'rem_snn'  <- 'rem_snn' | 'rem' | 'snn'
  Response:
    corrected: dict[str, float]   <- distribucion corregida
    raw_fidelity: float | null    <- solo si se puede calcular
    corrected_fidelity: float | null
    delta: float | null
    latency_ms: float
    device: str
    method: str
    noisebridge_version: str

Auth: header X-API-Key, si falta devuelve 401.
Para esta primera versión, cualquier key no-vacía es válida (añadiremos DynamoDB en 2.3).

Incluye tests en tests/ con pytest y httpx para todos los endpoints."
```

---

### 2.2 Deploy en AWS Lambda
**Tiempo estimado: 2 horas con Claude Code**

**Prerequisito:** tener instalado AWS CLI con `aws configure` funcionando.

```bash
claude "configura el deploy de la FastAPI en AWS Lambda con:

1. Mangum en main.py como handler Lambda
2. template.yaml (AWS SAM):
   - Function: NoisebridgeAPI
   - Runtime: python3.11
   - Memory: 256MB
   - Timeout: 30s
   - Environment variables: STAGE=prod, LOG_LEVEL=INFO
   - API Gateway HTTP API (v2, más barato que REST API)
3. .github/workflows/deploy-api.yml:
   - Trigger: push a main en fractkit-api/
   - Steps: install sam-cli, sam build, sam deploy --no-confirm-changeset
   - Secretos necesarios: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

El endpoint debe quedar en:
https://[api-id].execute-api.[region].amazonaws.com/v1/correct"
```

Después de hacer deploy, añade el dominio custom:
```bash
# En AWS Console: API Gateway → Custom domains → api.noisebridge.io
# Requiere tener el dominio registrado en Route 53 o con registro CNAME
```

---

### 2.3 Autenticación real con DynamoDB
**Tiempo estimado: 2 horas con Claude Code**

```bash
claude "implementa autenticación real para la API noisebridge:

1. Tabla DynamoDB 'noisebridge-api-keys':
   - Partition key: api_key (String)
   - Attributes: user_id, tier (free|pro|enterprise), created_at,
     requests_today, requests_total, last_request_at

2. Actualiza app/auth/api_key.py:
   - Consulta DynamoDB con la key del header X-API-Key
   - Si no existe: 401 Unauthorized
   - Si tier=free y requests_today >= 100: 429 Too Many Requests
   - Si válida: incrementa requests_today y requests_total en DynamoDB
   - Resetea requests_today a medianoche (usar EventBridge rule)

3. Añade endpoint POST /v1/keys (admin only, header X-Admin-Key):
   - Crea una nueva API key con uuid4()
   - Registra en DynamoDB con tier=free por defecto
   - Devuelve la key (solo se muestra una vez)

4. Tests de integración para auth y rate limiting.

IAM role para la Lambda debe tener: dynamodb:GetItem, dynamodb:UpdateItem,
dynamodb:PutItem sobre la tabla noisebridge-api-keys."
```

---

### 2.4 Conectar la API con el INGEST workflow de Obsidian
**Tiempo estimado: 1 hora con Claude Code**

Esto conecta la API cloud con tu wiki existente de Obsidian:

```bash
claude "crea scripts/api_to_obsidian.py en D:/Jarvis-Fractal/ que:

1. Llame a GET https://api.noisebridge.io/v1/benchmark para obtener
   los últimos resultados de benchmark
2. Para cada resultado nuevo (no existe en memoria/FractKit/Benchmarks/):
   a. Crea una nota .md siguiendo el schema del CLAUDE.md de Obsidian
      (type: experiment, campos requeridos: device, date, shots, results)
   b. Asigna el cssclasses correcto (domain-cyan para noise mitigation)
   c. Actualiza index.md y log.md (siguiendo Workflow INGEST del CLAUDE.md)
3. Guarda en D:/Jarvis-Fractal/memoria/FractKit/Benchmarks/

Esto cierra el loop: hardware real -> API -> Obsidian wiki -> NotebookLM"
```

---

## ETAPA 3 — Semana 9–12: SDK Pro + Landing Page
### Objetivo: Primer cliente pagando

---

### 3.1 CLI fractkit
**Tiempo estimado: 3 horas con Claude Code**

```bash
mkdir D:\Jarvis-Fractal\fractkit-sdk
cd D:\Jarvis-Fractal\fractkit-sdk

claude "crea el CLI 'fractkit' con Click (Python) que tenga estos subcomandos:

fractkit correct
  --counts '{"00":484,"11":471,"10":13,"01":11}'  <- JSON string
  --n 5
  --device ibm_fakemarrakesh
  --method rem_snn   <- por defecto
  --output json|table|csv
  Resultado: tabla con RAW/REM/SNN y delta

fractkit devices
  --recommended      <- solo los recomendados
  --vendor ibm|iqm|rigetti|all
  Resultado: tabla con todos los dispositivos del registry

fractkit benchmark
  --device ibm_fakemarrakesh
  --circuit ghz      <- ghz|bell|w_state|qft
  --n 5
  --shots 1024
  Resultado: ejecuta el benchmark y guarda en ~/.fractkit/benchmarks/

fractkit export obsidian
  --vault D:/Jarvis-Fractal/memoria
  --run [benchmark-id]
  Resultado: crea nota .md en FractKit/Benchmarks/ siguiendo el schema CLAUDE.md

fractkit config
  --api-key [key]    <- guarda en ~/.fractkit/config.json
  --api-url [url]    <- por defecto api.noisebridge.io

Estructura del paquete:
  fractkit/
    cli.py           <- Click group
    commands/
      correct.py
      devices.py
      benchmark.py
      export.py
      config.py
    client.py        <- HTTP client para la API
  setup.cfg          <- entry_points: fractkit = fractkit.cli:main
  
Incluye tests con CliRunner de Click."
```

---

### 3.2 Landing page fractkit.io
**Tiempo estimado: 4 horas con Claude Code**

```bash
# Instalar Next.js
npx create-next-app@latest fractkit-web --typescript --tailwind --app
cd fractkit-web

claude "crea la landing page de fractkit.io (Next.js 14 + Tailwind + shadcn/ui).
Páginas necesarias:

/ (home):
  - Hero: 'Quantum noise mitigation. Zero overhead.'
    Subtítulo: '+42.9% fidelity on IBM Marrakesh 50-qubit circuit'
  - Demo interactivo embebido: input de counts JSON, selector de device,
    botón 'Correct' que llame a api.noisebridge.io/v1/correct con una demo key
  - Tabla de resultados de hardware reales (los 6 QPUs)
  - Comparativa vs ZNE vs PEC (tabla con checkmarks)
  - Pricing: Free / Pro ($99/mes) / Enterprise (contactar)
    Cards con shadcn/ui, botón 'Get API Key' en Pro
  - Footer con links: GitHub, arXiv (placeholder), PyPI, Unitary Foundation

/docs:
  Redirect a docs.noisebridge.io (placeholder por ahora)

/dashboard:
  Protegido por API key (cookie session)
  Muestra: requests hoy / requests total / tier actual / tabla de últimas llamadas

Usa colores: fondo negro (#0a0a0a), acento cyan (#26c6da) — mismo que domain-cyan
de Obsidian. Tipografía: Inter para texto, JetBrains Mono para código.

NO usar imágenes externas. Los datos de benchmark son los reales del registry."
```

Deploy inmediato en Vercel:
```bash
# Conectar repo a Vercel (vercel.com → Import Project → GitHub)
# Variable de entorno en Vercel: NEXT_PUBLIC_API_URL=https://api.noisebridge.io
vercel --prod
# Añadir dominio fractkit.io en Vercel dashboard
```

---

### 3.3 Integración Stripe
**Tiempo estimado: 3 horas con Claude Code**

```bash
claude "implementa el sistema de billing para noisebridge con Stripe:

1. En la API (fractkit-api/):
   - POST /v1/billing/checkout: crea Stripe Checkout Session para tier Pro ($99/mes)
     devuelve checkout_url para redirigir al usuario
   - POST /v1/billing/webhook: recibe eventos de Stripe (checkout.session.completed,
     customer.subscription.deleted)
     cuando checkout completado: actualiza DynamoDB tier=pro para el user_id

2. En la landing page (fractkit-web/):
   - Botón 'Upgrade to Pro' llama a /v1/billing/checkout con la API key del usuario
   - Redirige a Stripe Checkout
   - Success page: muestra confirmación y link al dashboard

3. En DynamoDB: añade campos subscription_id, subscription_status, stripe_customer_id

Secretos necesarios (no commitear):
  STRIPE_SECRET_KEY=sk_live_... (en AWS Secrets Manager para la Lambda)
  STRIPE_WEBHOOK_SECRET=whsec_... (en AWS Secrets Manager)
  STRIPE_PRICE_ID=price_... (el price ID del plan Pro mensual en Stripe)

Usa Stripe test mode primero (sk_test_...). Cambiar a live después de primera prueba."
```

---

## ETAPA 4 — Mes 3: metriq + Primeros usuarios
### Objetivo: Validación pública y primeros ingresos

---

### 4.1 Submission a metriq
**Tiempo estimado: 2 horas**

metriq es la plataforma de benchmarks de Unitary Foundation.

**URL:** https://metriq.info/Submit

**Datos a enviar (copia directa de los resultados):**

| Task | Method | Device | Result |
|------|--------|--------|--------|
| Quantum Error Mitigation — Fidelity Recovery | noisebridge SNN-NR v2 | IBM Marrakesh | F: 0.285 → 0.714 |
| Quantum Error Mitigation — Fidelity Recovery | noisebridge SNN-NR v2 | IQM Garnet | F: +0.057 avg (6/6 circuits) |
| Quantum Error Correction — LER | noisebridge SNN decoder | IQM Garnet | LER: 0.100 → 0.048 (2.08x) |
| Quantum Error Correction — LER | noisebridge SNN decoder | Rigetti Cepheus | LER: 0.254 → 0.133 (1.91x) |

**Code reference:** https://github.com/[tu-usuario]/noisebridge
**Paper reference:** arXiv:[DOI cuando esté publicado]

---

### 4.2 Outreach inicial (hacer manualmente, Claude Code prepara los textos)

**qBraid — propuesta de integración:**
```bash
claude "escribe un email de 200 palabras para el equipo de qBraid
(hello@qbraid.com) proponiendo integrar noisebridge como post-procesador
nativo en qBraid Lab. Puntos clave:
- noisebridge ya funciona con el job format de qBraid (mostrar código ejemplo)
- Modelo: revenue share (qBraid retiene 20% de las subscripciones Pro)
- Beneficio para qBraid: diferenciación vs otros cloud quantum providers
- CTA: llamada de 30 minutos para evaluar la integración técnica
Tono: técnico pero directo. Firmar como investigador independiente."
```

**IBM Quantum Network — aplicación:**
```bash
claude "escribe la aplicación al IBM Quantum Network
(https://quantum.ibm.com/network) para noisebridge.
Sección 'What will you build': enfatizar que noisebridge ya validó
los resultados en IBM Marrakesh (+42.9%) y que la integración como
Qiskit transpiler pass beneficia a toda la base de usuarios de IBM Quantum.
Máximo 500 palabras."
```

---

## REFERENCIA RÁPIDA — Comandos de Claude Code por Situación

### Añadir un nuevo dispositivo al registry
```bash
cd D:\Jarvis-Fractal\noisebridge
claude "añade [DEVICE_ID] al DEVICE_REGISTRY en registry.py.
Datos del dispositivo:
- family: [IBM Quantum|IQM|Rigetti|IonQ|Quantinuum]
- qubits: [N]
- 2q_error: [0.XXX]
- native_gates: [lista]
Sigue exactamente el mismo formato que iqm_garnet.
Actualiza los tests en tests/test_registry.py.
NO cambies los valores de dispositivos existentes."
```

### Ejecutar el INGEST workflow de Obsidian
```bash
cd D:\Jarvis-Fractal
claude "ejecuta el workflow INGEST definido en memoria/FractKit/CLAUDE.md
para el archivo [RUTA_AL_JSON].
Sigue los 8 pasos del workflow al pie de la letra:
crea Sources/, actualiza Devices/, crea/actualiza Experiments/,
actualiza SNN/best_configs.md si mejoran los resultados,
actualiza Analysis/cross_device_comparison.md,
actualiza index.md y appends a log.md"
```

### Publicar nueva versión en PyPI
```bash
cd D:\Jarvis-Fractal\noisebridge
claude "prepara el release v[X.Y.Z] de noisebridge:
1. Actualiza __version__ en noisebridge/__init__.py a '[X.Y.Z]'
2. Añade entrada en CHANGELOG.md con los cambios desde v[X.Y.Z-1]
3. Ejecuta pytest --cov=noisebridge y muestra el resultado
4. Si todos los tests pasan: git add, git commit -m 'chore: release v[X.Y.Z]',
   git tag v[X.Y.Z], git push, git push --tags
5. El GitHub Action publish.yml hará el deploy automático a PyPI"
```

### Bug en la API en producción
```bash
cd D:\Jarvis-Fractal\fractkit-api
claude "hay un bug en producción en el endpoint /v1/correct:
[descripción del error + stack trace si está disponible].
1. Identifica la causa raíz
2. Escribe el fix
3. Añade un test de regresión que falle sin el fix y pase con él
4. Verifica que los tests existentes siguen pasando
5. Propón el mensaje de commit siguiendo Conventional Commits"
```

### Sincronizar resultados de hardware con NotebookLM
```bash
cd D:\Jarvis-Fractal
claude "ejecuta scripts/api_to_obsidian.py para sincronizar los últimos
resultados de benchmark con el vault de Obsidian.
Después lee el archivo memoria/FractKit/log.md y confirma que la
entrada de hoy se añadió correctamente."
```

---

## CHECKLIST DE ESTADO ACTUAL

### Esta semana (completar en orden)
- [ ] **0.1** Grabar y subir video (YouTube/Loom)
- [ ] **0.1** Enviar Typeform Unitary Foundation con URL del video
- [ ] **0.1** Enviar email paralelo a info@unitary.foundation
- [ ] **0.2** Crear repo GitHub `noisebridge` con código actual
- [ ] **0.2** Ejecutar: `claude "reescribe README.md..."` (ver instrucción 0.2 Paso 3)
- [ ] **0.3** Crear CLAUDE.md en el repo noisebridge

### Semana 2 (antes de publicar arXiv)
- [ ] **1.1** Tests con cobertura ≥80%
- [ ] **1.2** CI/CD GitHub Actions funcionando
- [ ] **1.4** USPTO Provisional Patent archivado ($320)

### Semana 3–4
- [ ] **1.3** arXiv preprint publicado
- [ ] **2.1** Cloud API scaffold con FastAPI
- [ ] **2.2** Deploy en AWS Lambda

### Semana 5–8
- [ ] **2.3** Autenticación DynamoDB + rate limiting
- [ ] **3.1** CLI `fractkit` publicado en PyPI
- [ ] **3.2** Landing page fractkit.io en Vercel
- [ ] **3.3** Stripe integrado (test mode)

### Mes 3
- [ ] **4.1** metriq submission (6 QPUs)
- [ ] **4.2** Email a qBraid y IBM Quantum Network
- [ ] Stripe producción activo
- [ ] Primer cliente Pro pagando

---

*Instrucciones generadas: 2026-05-19*
*Basadas en: CLAUDE.md Obsidian (schema v1.0) + MVP_FractKit_ClaudeCode_ExecutiveReport.md*
*noisebridge v0.3.0 | FractKit 9 dominios | 88.6/100*
