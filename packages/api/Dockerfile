# Multi-stage build for AWS Lambda deployment via Mangum
FROM public.ecr.aws/lambda/python:3.11 AS builder

WORKDIR /build

# Install dependencies into a separate layer for cache efficiency
COPY requirements.txt .
RUN pip install --no-cache-dir --target /build/deps -r requirements.txt

# Copy application code
COPY app/ /build/app/

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM public.ecr.aws/lambda/python:3.11

# Dependencies layer
COPY --from=builder /build/deps ${LAMBDA_TASK_ROOT}

# Application code
COPY --from=builder /build/app ${LAMBDA_TASK_ROOT}/app

# Lambda entry point: handler defined in app/main.py
CMD ["app.main.handler"]
