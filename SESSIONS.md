# FractKit MVP — Claude Code Sessions
## Cómo usar este archivo
1. Abre la carpeta `D:\Jarvis-Fractal\fractkit-platform\` en Claude Code
2. Claude Code carga CLAUDE.md automáticamente — no necesitas re-explicar el proyecto
3. Para cada sesión: abre terminal en esa carpeta, escribe el comando `claude "..."` exacto
4. Claude Code ejecuta la sesión de forma autónoma (agentic mode)
5. Revisa el resultado, haz commit, pasa a la siguiente sesión

---

## SESIÓN 0 — Setup del monorepo
**Duración estimada: 20 min | Prerequisito: ninguno**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Inicializa este monorepo fractkit-platform:
1. Crea .gitignore (Python + Node + AWS + secrets)
2. Crea pyproject.toml en la raíz con workspace config para packages/noisebridge
3. Copia el contenido de D:/Jarvis-Fractal/noisebridge/ a packages/noisebridge/
   (solo directorios: noisebridge/, tests/, pyproject.toml, CHANGELOG.md, LICENSE)
4. Verifica que packages/noisebridge/noisebridge/__init__.py tiene __version__ = '0.3.0'
5. Ejecuta desde packages/noisebridge/: pip install -e . --break-system-packages
6. Ejecuta: python -c 'from noisebridge import rem_snn_correct, list_devices; print(list_devices())'
   Si funciona, la instalación es correcta.
7. git init && git add . && git commit -m 'feat: monorepo fractkit-platform setup, noisebridge v0.3.0'"
```

---

## SESIÓN 1 — Tests completos de noisebridge
**Duración estimada: 45 min | Prerequisito: Sesión 0 completada**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Completa la suite de tests de packages/noisebridge/tests/.
Objetivo: cobertura >= 80% en correct.py, mitigation.py y registry.py.

Estado actual: solo existe test_noisebridge.py — necesita ampliarse.

Para cada función pública sin test, escribe el test correspondiente.
Usa estos datos reales como fixtures (NO inventar):
- IQM Garnet Bell state: counts={'00':122,'01':3,'10':3,'11':128}, n=2 -> fidelity mejora
- IBM Marrakesh GHZ-5q: counts={'00000':484,'11111':471,...ruido...}, n=5
- Resultados esperados: rem_snn_correct mejora fidelidad vs raw en todos los casos

Tests requeridos:
  test_rem_snn_correct_basic: input/output shape correcto
  test_rem_snn_correct_iqm_garnet: fidelidad sube con datos reales IQM
  test_rem_correct_all_devices: que ningún dispositivo del registry lanza excepción
  test_snn_correct_centering_matrix: W[i,j] = (delta-1/N)*W_scale se aplica correctamente
  test_list_devices: devuelve lista no vacía, cada device tiene los campos requeridos
  test_load_params_valid: carga params de iqm_garnet sin error
  test_load_params_invalid: device inexistente lanza ValueError con mensaje claro
  test_counts_normalization: counts con cualquier suma total devuelven probs que suman 1.0

Al final ejecuta:
  cd packages/noisebridge && pytest tests/ --cov=noisebridge --cov-report=term-missing -v
  
Si cobertura < 80%, añade los tests que falten hasta alcanzarla.
Muestra el resultado final del coverage report."
```

---

## SESIÓN 2 — CI/CD con GitHub Actions
**Duración estimada: 30 min | Prerequisito: Sesión 1 (tests verdes)**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea los workflows de GitHub Actions:

1. infra/github-actions/ci.yml (copiar a .github/workflows/ci.yml también):
   name: CI
   trigger: push a cualquier rama, pull_request a main
   jobs:
     test:
       matrix: python-version: ['3.10', '3.11', '3.12']
       steps:
         - checkout
         - setup-python
         - pip install -e 'packages/noisebridge[dev]' (añade grupo [dev] en pyproject.toml con pytest, pytest-cov)
         - pytest packages/noisebridge/tests/ --cov=noisebridge --cov-fail-under=80
     lint:
       steps:
         - pip install ruff
         - ruff check packages/noisebridge/noisebridge/

2. infra/github-actions/publish.yml (copiar a .github/workflows/publish.yml también):
   name: Publish to PyPI
   trigger: push de tags v*.*.* solamente
   steps:
     - checkout
     - pip install build twine
     - cd packages/noisebridge && python -m build
     - twine upload dist/* (usa secreto PYPI_API_TOKEN)

3. Añade el grupo [dev] en packages/noisebridge/pyproject.toml:
   [project.optional-dependencies]
   dev = ['pytest>=7.0', 'pytest-cov>=4.0', 'ruff>=0.4']

4. Verifica que el pyproject.toml tiene build-system correcto (hatchling o setuptools).

Muestra el contenido final de ambos archivos yml."
```

---

## SESIÓN 3 — Scaffold Cloud API
**Duración estimada: 90 min | Prerequisito: Sesión 1**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea packages/api/ — la Cloud REST API de noisebridge.

Estructura exacta:
  packages/api/
    main.py
    routes/
      correct.py    <- POST /v1/correct
      devices.py    <- GET /v1/devices
      health.py     <- GET /health (sin auth, para Lambda warm-up)
    auth/
      api_key.py    <- validación header X-API-Key
    models/
      request.py    <- CorrectionRequest (Pydantic v2)
      response.py   <- CorrectionResponse (Pydantic v2)
    requirements.txt
    Dockerfile
    tests/
      test_correct.py
      test_devices.py
      test_auth.py

Especificaciones:

POST /v1/correct:
  Headers: X-API-Key (requerido, cualquier string no-vacío es válido en esta versión)
  Body (JSON):
    counts: dict[str, int]    # mediciones del QPU ej: {'00':122,'11':128}
    n: int                    # número de qubits (2-20)
    device: str               # device_id del registry ej: 'iqm_garnet'
    method: str = 'rem_snn'   # 'rem_snn' | 'rem' | 'snn'
  Response 200 (JSON):
    corrected: dict[str, float]     # distribución corregida normalizada
    raw_fidelity: float | null      # null si no se puede calcular sin estado ideal
    corrected_fidelity: float | null
    delta: float | null
    latency_ms: float
    device: str
    method: str
    noisebridge_version: str        # de noisebridge.__version__

GET /v1/devices:
  Headers: X-API-Key (requerido)
  Query params: recommended=true|false (default false)
  Response: lista de objetos {device_id, family, qubits, recommended}

GET /health:
  Sin auth. Response: {status: 'ok', version: str, timestamp: str}

Auth (primera versión simple):
  - Si X-API-Key está ausente: 401 {detail: 'API key required'}
  - Si X-API-Key es string vacío: 401 {detail: 'Invalid API key'}
  - Cualquier otro valor: válido (DynamoDB auth viene en Sesión 6)

Error handling:
  - device no existe en registry: 422 {detail: 'Unknown device: X. Call /v1/devices for valid ids.'}
  - n < 1 o n > 20: 422 {detail: 'n must be between 1 and 20'}
  - counts vacío: 422 {detail: 'counts cannot be empty'}

requirements.txt:
  fastapi>=0.110
  uvicorn[standard]>=0.27
  mangum>=0.17
  pydantic>=2.0
  noisebridge>=0.3.0

Dockerfile (para Lambda):
  FROM public.ecr.aws/lambda/python:3.11
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ['main.handler']

En main.py:
  app = FastAPI(title='noisebridge API', version='1.0.0')
  handler = Mangum(app)   <- Lambda entrypoint

Tests (usar pytest + httpx TestClient):
  - test POST /v1/correct con datos reales IQM Garnet: verifica que response.corrected suma ~1.0
  - test POST /v1/correct sin API key: verifica 401
  - test POST /v1/correct con device='invalid_device': verifica 422
  - test GET /v1/devices: verifica que devuelve lista con al menos 5 devices
  - test GET /health: verifica status='ok'

Al final ejecuta los tests:
  cd packages/api && pip install -r requirements.txt httpx pytest --break-system-packages
  pytest tests/ -v
  
Muestra el resultado."
```

---

## SESIÓN 4 — README profesional de noisebridge
**Duración estimada: 30 min | Prerequisito: Sesión 1**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Reescribe packages/noisebridge/README.md para noisebridge v0.3.0.
Usa SOLO datos reales del archivo packages/noisebridge/noisebridge/__init__.py
y del registry.py. NO inventar ningún número.

Estructura del README:
  # noisebridge
  [badges: PyPI version, tests passing, license BSL-1.1, Python 3.10+]

  > Zero-overhead quantum noise mitigation via spiking neural networks.
  > Validated on 6 real QPUs from 3 manufacturers.

  ## Results (real hardware)
  [tabla: Device | Task | RAW | SNN | Improvement]
  IBM Marrakesh 50q | GHZ | 0.285 | 0.714 | +42.9%
  IQM Garnet | Sierpinski Z-Code LER | 0.100 | 0.048 | 2.08x
  Rigetti Cepheus-108Q | Sierpinski Z-Code LER | 0.254 | 0.133 | 1.91x
  IQM Emerald | Teleportation F | — | 0.959–0.973 | rep. Northwestern 2026
  Win rate: 97% over 63 circuits | p=0.011 | Cohen d=1.288 vs ZNE

  ## Why noisebridge?
  [tabla comparativa: ZNE (3x shots), PEC (100x shots), M3 (calibración), noisebridge (0x shots)]

  ## Install
  pip install noisebridge

  ## Quick start (5 líneas)
  [ejemplo rem_snn_correct con IQM Garnet]

  ## Supported devices (11 QPUs)
  [tabla generada desde registry.py]

  ## API reference
  [docstrings de las 4 funciones públicas]

  ## Citation
  [placeholder BibTeX con DOI arXiv pendiente]

  ## License
  Business Source License 1.1 — free for research, commercial use requires license.

El README debe ser suficientemente completo para que un investigador cuántico
que lo lea por primera vez entienda qué hace el paquete y lo instale en 2 minutos."
```

---

## SESIÓN 5 — AWS SAM deploy template
**Duración estimada: 45 min | Prerequisito: Sesión 3**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea la infraestructura AWS para desplegar la API noisebridge en Lambda.

Archivos a crear:

1. infra/aws/template.yaml (AWS SAM):
   AWSTemplateFormatVersion: '2010-09-09'
   Transform: AWS::Serverless-2016-10-31
   
   Parameters:
     Stage: {Type: String, Default: dev}
   
   Resources:
     NoisebridgeApiFunction:
       Type: AWS::Serverless::Function
       Properties:
         CodeUri: ../../packages/api/
         Handler: main.handler
         Runtime: python3.11
         MemorySize: 256
         Timeout: 30
         Environment:
           Variables:
             STAGE: !Ref Stage
             LOG_LEVEL: INFO
         Events:
           ApiEvent:
             Type: HttpApi   <- HTTP API v2 (más barato que REST API)
             Properties:
               Path: /{proxy+}
               Method: ANY
   
   Outputs:
     ApiUrl:
       Value: !Sub 'https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com'

2. infra/github-actions/deploy-api.yml (copiar también a .github/workflows/deploy-api.yml):
   name: Deploy API
   trigger: push a main cuando hay cambios en packages/api/**
   steps:
     - checkout
     - setup-python 3.11
     - pip install aws-sam-cli
     - sam build --template infra/aws/template.yaml
     - sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
                  --stack-name noisebridge-api-{stage}
                  --capabilities CAPABILITY_IAM
                  --parameter-overrides Stage=prod
   Secrets requeridos: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

3. infra/aws/samconfig.toml:
   [default.deploy.parameters]
   stack_name = 'noisebridge-api'
   region = 'us-east-1'
   confirm_changeset = false
   capabilities = 'CAPABILITY_IAM'

4. Añade al packages/api/Dockerfile el CMD correcto para Lambda:
   CMD ['main.handler']
   Y verifica que main.py exporta handler = Mangum(app)

Al final muestra un checklist de los pasos manuales que el usuario debe hacer
en AWS Console antes del primer deploy (crear IAM user con permisos Lambda+APIGW)."
```

---

## SESIÓN 6 — Autenticación real con DynamoDB
**Duración estimada: 60 min | Prerequisito: Sesión 3 + AWS cuenta activa**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Implementa autenticación real con DynamoDB para la API noisebridge.

1. Crea infra/aws/dynamodb.yaml (tabla separada del SAM principal):
   Tabla: noisebridge-api-keys
   Partition key: api_key (String)
   Attributes adicionales:
     user_id: String
     tier: String  (free | pro | enterprise)
     created_at: String (ISO8601)
     requests_today: Number
     requests_total: Number
     last_request_at: String
     email: String

2. Actualiza packages/api/auth/api_key.py:
   - Lee tabla DynamoDB con GetItem usando la key del header
   - Si no existe: 401 'Invalid API key'
   - Si tier=free y requests_today >= 100: 429 'Rate limit exceeded. Upgrade to Pro.'
   - Si válida: UpdateItem para incrementar requests_today y requests_total
                y actualizar last_request_at a utcnow().isoformat()
   - Usa boto3 con credenciales de env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

3. Añade POST /v1/admin/keys (solo accesible con header X-Admin-Key):
   - Genera api_key = str(uuid.uuid4())
   - Inserta en DynamoDB con tier=free, requests_today=0, requests_total=0
   - Devuelve {'api_key': key, 'tier': 'free'} (solo se muestra una vez)
   - X-Admin-Key se lee de env var ADMIN_KEY (guardar en AWS Secrets Manager)

4. Añade EventBridge rule en template.yaml:
   ResetDailyCountsFunction:
     Evento: rate(1 day) a medianoche UTC
     Acción: escanea tabla y pone requests_today=0 para todas las keys

5. Actualiza requirements.txt: añade boto3>=1.34

6. Tests de integración (mock DynamoDB con moto):
   pip install moto[dynamodb]
   test_auth_valid_key: con key válida tier=free, requests OK
   test_auth_invalid_key: key no existe -> 401
   test_auth_rate_limit: key free con requests_today=100 -> 429
   test_auth_pro_no_limit: key pro con requests_today=500 -> 200

7. Documenta en un comentario qué secrets necesita la Lambda en AWS:
   ADMIN_KEY, DYNAMODB_TABLE_NAME, (AWS creds vienen del execution role IAM)"
```

---

## SESIÓN 7 — Landing page fractkit.io
**Duración estimada: 90 min | Prerequisito: Sesión 3 funcionando**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea apps/web/ — la landing page de fractkit.io.
Usa Next.js 14 con App Router, Tailwind CSS y shadcn/ui.

Ejecuta primero:
  cd apps && npx create-next-app@latest web --typescript --tailwind --app --no-git --no-eslint

Luego crea los componentes:

Diseño visual:
  Fondo: #0a0a0a (negro puro)
  Acento primario: #26c6da (cyan — mismo que domain-cyan Obsidian)
  Acento secundario: #4a9eff (azul — domain-blue)
  Texto: #e2e8f0
  Fuente texto: Inter (Google Fonts)
  Fuente código: JetBrains Mono (Google Fonts)

app/page.tsx — Secciones en orden:

1. Hero:
   Título H1: 'Quantum noise mitigation.\nZero overhead.'
   Subtítulo: '+42.9% fidelity on IBM Marrakesh 50-qubit circuit'
   Dos botones: [Get API Key] (cyan, lleva a /dashboard) y [View on GitHub] (outline)
   Número animado mostrando '97% win rate over 63 circuits'

2. ResultsTable — tabla real de hardware (hardcoded, datos reales):
   Device | Task | Before | After | Improvement
   IBM Marrakesh 50q | GHZ Fidelity | 0.285 | 0.714 | +42.9%
   IQM Garnet | Z-Code LER | 0.100 | 0.048 | 2.08x
   Rigetti Cepheus-108Q | Z-Code LER | 0.254 | 0.133 | 1.91x
   IQM Emerald | Teleportation F | — | 0.973 | Northwestern rep.

3. DemoWidget — widget interactivo:
   Input textarea: 'Paste your counts JSON here'
   Valor inicial: {'00000': 484, '11111': 471, '10000': 13, '01000': 11, ...}
   Select device: dropdown con los 11 devices del registry
   Select method: rem_snn | rem | snn
   Botón [Correct] — hace fetch a la API /v1/correct con demo key 'demo-key-fractkit'
   Muestra resultado: distribución corregida + delta + latency_ms
   Si la API no está disponible aún: muestra resultado hardcoded de ejemplo

4. ComparisonTable — vs competencia:
   | Method | Extra QPU shots | Cost | Open source |
   | ZNE    | 3×              | 3×   | ✅           |
   | PEC    | ~100×           | ~100×| ✅ (parcial) |
   | M3     | 2ⁿ calibration  | High | ✅           |
   | **noisebridge** | **0×** | **0×** | **✅**  |

5. Pricing — tres cards con shadcn/ui Card:
   Free:       $0/mes    | 100 req/día | noisebridge core | PyPI access
   Pro:        $99/mes   | Unlimited   | + 20+ devices | + dashboard | + email support
   Enterprise: Contact   | SLA 99.9%   | + Qiskit integration | + co-branding

6. Footer: GitHub | PyPI | arXiv (coming soon) | Unitary Foundation | Contact

app/layout.tsx: meta tags SEO, og:image placeholder, canonical fractkit.io

NO usar imágenes externas — solo CSS y texto.
Al final ejecuta: cd apps/web && npm run build
Si hay errores de build, corrígelos antes de terminar la sesión."
```

---

## SESIÓN 8 — CLI fractkit
**Duración estimada: 60 min | Prerequisito: Sesión 3**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea packages/sdk/ — el CLI 'fractkit' (Python + Click).

Estructura:
  packages/sdk/
    fractkit/
      __init__.py
      cli.py          <- Click group principal
      client.py       <- HTTP client para noisebridge API
      commands/
        correct.py
        devices.py
        benchmark.py
        config.py
    tests/
      test_cli_correct.py
      test_cli_devices.py
    pyproject.toml
    README.md

Comandos del CLI:

fractkit correct
  --counts '{'00':122,'11':128}' (JSON string)
  --n 2
  --device iqm_garnet
  --method rem_snn  (default)
  --output table|json|csv  (default table)
  Si --api-key no se pasa, lee de ~/.fractkit/config.json
  Resultado en tabla:
    STATE    RAW      CORRECTED   DELTA
    00       0.488    0.496       +0.008
    11       0.512    0.504       -0.008

fractkit devices
  --recommended   (solo recommended=True del registry)
  --vendor ibm|iqm|rigetti|all  (default all)
  Resultado: tabla Device ID | Family | Qubits | Recommended

fractkit config set-key [API_KEY]
  Guarda en ~/.fractkit/config.json: {'api_key': KEY, 'api_url': 'https://api.noisebridge.io'}

fractkit config show
  Muestra config actual (enmascara la key: sk-****1234)

fractkit version
  Muestra: fractkit 1.0.0 | noisebridge 0.3.0 | Python 3.x.x

client.py:
  class NoisebridgeClient:
    base_url: str (default https://api.noisebridge.io)
    api_key: str
    def correct(counts, n, device, method) -> CorrectionResponse
    def devices(recommended=False) -> list[DeviceInfo]
    Si la API no está disponible: llama noisebridge directamente (modo offline)

pyproject.toml:
  [project.scripts]
  fractkit = 'fractkit.cli:main'
  
  dependencies = ['click>=8.1', 'noisebridge>=0.3.0', 'requests>=2.31', 'rich>=13.0']
  (rich para tablas bonitas en terminal)

Tests con CliRunner de Click:
  test_correct_offline: sin API activa, usa noisebridge directo, verifica output tabla
  test_devices: verifica que lista al menos 5 devices
  test_config: set-key guarda config, show la muestra enmascarada

Al final:
  cd packages/sdk && pip install -e . --break-system-packages
  fractkit version
  fractkit devices
  Muestra el output real."
```

---

## SESIÓN 9 — Integración Stripe
**Duración estimada: 60 min | Prerequisito: Sesiones 3 + 6**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Implementa el sistema de billing con Stripe para la API noisebridge.

1. Añade endpoints en packages/api/routes/billing.py:

   POST /v1/billing/checkout
     Auth: X-API-Key requerida (el user_id se saca de DynamoDB)
     Body: {tier: 'pro'}
     Crea Stripe Checkout Session con:
       price: STRIPE_PRICE_ID (env var)
       success_url: https://fractkit.io/dashboard?success=1
       cancel_url: https://fractkit.io/pricing
       client_reference_id: user_id
       metadata: {api_key: la key del usuario}
     Response: {checkout_url: str}

   POST /v1/billing/webhook
     Sin auth — Stripe firma el payload con STRIPE_WEBHOOK_SECRET
     Eventos a manejar:
       checkout.session.completed:
         UpdateItem en DynamoDB: tier=pro para el api_key en metadata
       customer.subscription.deleted:
         UpdateItem en DynamoDB: tier=free para el api_key afectado
     Si firma inválida: 400 'Invalid signature'

2. Actualiza DynamoDB schema: añade stripe_customer_id, subscription_id

3. Actualiza requirements.txt: stripe>=8.0

4. Variables de entorno necesarias (documentar en README del api):
   STRIPE_SECRET_KEY     <- sk_test_... para test, sk_live_... para producción
   STRIPE_WEBHOOK_SECRET <- whsec_... (del dashboard de Stripe)
   STRIPE_PRICE_ID       <- price_... (el plan Pro $99/mes mensual en Stripe)
   Añadir al template.yaml SAM en Environment.Variables

5. Tests con mock de Stripe (stripe-mock o monkeypatch):
   test_checkout_creates_session: verifica que devuelve checkout_url
   test_webhook_upgrades_tier: simula checkout.session.completed, verifica DynamoDB update
   test_webhook_invalid_signature: verifica 400

6. En apps/web: botón 'Upgrade to Pro' en la pricing card llama a /v1/billing/checkout
   y redirige window.location.href al checkout_url devuelto.

IMPORTANTE: usar Stripe TEST mode primero (sk_test_...).
Documenta claramente los pasos para cambiar a producción (cambiar sk_test por sk_live
y actualizar STRIPE_PRICE_ID con el price ID live)."
```

---

## SESIÓN 10 — Integración Obsidian (cierre del loop)
**Duración estimada: 45 min | Prerequisito: Sesión 3**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Crea scripts/api_to_obsidian.py — integración entre la API y el vault Obsidian.

Este script cierra el loop: hardware real -> noisebridge -> Obsidian wiki -> NotebookLM

Funcionalidad:
  1. Llama a GET /v1/benchmark de la API (si está disponible)
     Si la API no está disponible: lee los JSON de resultados en
     D:/Jarvis-Fractal/memoria/FractKit/Benchmarks/ directamente
  
  2. Para cada resultado nuevo:
     Detecta si ya existe una nota con ese device+date en memoria/FractKit/Benchmarks/
     Si no existe, crea la nota .md siguiendo EXACTAMENTE el schema del
     CLAUDE.md de Obsidian (D:/Jarvis-Fractal/memoria/FractKit/CLAUDE.md)

  3. Estructura de la nota generada:
     ---
     type: experiment
     date: YYYY-MM-DD
     device: [device_id]
     domain: noise_mitigation
     status: validated
     cssclasses: domain-cyan
     ---
     # Benchmark [device] — [date]
     ## Results
     | Metric | RAW | SNN | Delta |
     | fidelity | X | Y | +Z% |
     ## Method
     rem_snn_correct | noisebridge v[version]
     ## Notes
     [generado automáticamente por api_to_obsidian.py]

  4. Actualiza D:/Jarvis-Fractal/memoria/FractKit/log.md:
     Append: '- [YYYY-MM-DD] INGEST auto: [device] benchmark -> [filename].md'

  5. Maneja correctamente las rutas Windows vs Linux con sys.platform

Uso:
  python scripts/api_to_obsidian.py --dry-run   <- muestra qué crearía sin crear nada
  python scripts/api_to_obsidian.py              <- ejecuta y crea las notas

Prueba con --dry-run y muestra el output."
```

---

## SESIÓN 11 — Primera verificación completa (pre-launch)
**Duración estimada: 60 min | Prerequisito: Sesiones 0-10**

```bash
cd D:\Jarvis-Fractal\fractkit-platform

claude "Ejecuta la verificación completa pre-launch del MVP noisebridge.

Checklist a verificar en orden:

1. Tests:
   cd packages/noisebridge && pytest tests/ --cov=noisebridge --cov-fail-under=80 -v
   cd packages/api && pytest tests/ -v
   cd packages/sdk && pytest tests/ -v
   Todos deben pasar. Si alguno falla, corrígelo ahora.

2. Builds:
   cd packages/noisebridge && python -m build
   cd apps/web && npm run build
   Si hay errores, corrígelos.

3. Consistencia de datos:
   Verifica que los números en packages/noisebridge/README.md
   coinciden exactamente con los datos en packages/noisebridge/noisebridge/__init__.py
   y en packages/noisebridge/noisebridge/registry.py
   Si hay discrepancia, corrige el README (los datos del código son la fuente de verdad)

4. Seguridad:
   Ejecuta: grep -r 'sk_live\|sk_test\|AKIA\|aws_secret' packages/ apps/ --include='*.py' --include='*.json' --include='*.env'
   Si encuentra algo, elimínalo inmediatamente y añade esos patrones al .gitignore

5. CLAUDE.md:
   Verifica que CLAUDE.md en la raíz está actualizado con cualquier cambio
   de arquitectura hecho durante las sesiones 0-10.

6. Genera el reporte final:
   Lista todos los archivos creados en este monorepo con su propósito en una línea.
   Indica qué tareas quedan pendientes para el primer deploy real:
   - Crear cuenta AWS y configurar credenciales
   - Registrar dominios fractkit.io y noisebridge.io
   - Crear cuenta Stripe y obtener las keys
   - Crear repo GitHub y hacer push del monorepo
   - Añadir secrets en GitHub (PYPI_API_TOKEN, AWS_*, STRIPE_*)"
```

---

## Orden recomendado de ejecución

| Sesión | Qué construye | Tiempo | Depende de |
|--------|--------------|--------|-----------|
| 0 | Monorepo setup | 20 min | — |
| 1 | Tests noisebridge | 45 min | 0 |
| 2 | CI/CD GitHub Actions | 30 min | 1 |
| 4 | README profesional | 30 min | 1 |
| 3 | Cloud API scaffold | 90 min | 1 |
| 5 | AWS SAM template | 45 min | 3 |
| 6 | Auth DynamoDB | 60 min | 3 |
| 7 | Landing page web | 90 min | 3 |
| 8 | CLI fractkit | 60 min | 3 |
| 9 | Stripe billing | 60 min | 3, 6 |
| 10 | Obsidian integration | 45 min | 3 |
| 11 | Verificación completa | 60 min | todas |

**Total estimado: ~9 horas de sesiones Claude Code**
