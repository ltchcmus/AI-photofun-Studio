# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM python:3.12-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install \
    --prefix=/install \
    --no-cache-dir \
    -r requirements.txt gunicorn || \
    python -m pip install \
    --prefix=/install \
    --no-cache-dir \
    --no-deps \
    -r requirements.txt gunicorn


# ============================================================================
# STAGE 2: Development
# ============================================================================
FROM python:3.12-slim AS development

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY . .

RUN mkdir -p media logs ml_models staticfiles

EXPOSE 9999

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:9999"]


# ============================================================================
# STAGE 3: Production
# ============================================================================
FROM python:3.12-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

COPY manage.py .
COPY backendAI ./backendAI
COPY apps ./apps
COPY core ./core
COPY shared ./shared
COPY services ./services

RUN mkdir -p media logs ml_models staticfiles && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

RUN python manage.py collectstatic --noinput || true

USER appuser

EXPOSE 9999

CMD ["gunicorn", "backendAI.wsgi:application", "--bind", "0.0.0.0:9999"]
