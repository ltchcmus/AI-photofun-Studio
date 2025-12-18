# ============================================================================
# STAGE 1: Builder - Heavy image for compiling dependencies
# ============================================================================
FROM python:3.12-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install build dependencies (needed for compiling packages)
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

# Copy only requirements first (for better layer caching)
COPY requirements.txt .

# Install Python dependencies into /install directory
# Use --no-deps for problematic packages
RUN pip install --prefix=/install --no-warn-script-location \
    --upgrade pip setuptools wheel && \
    pip install --prefix=/install --no-warn-script-location \
    -r requirements.txt gunicorn || \
    pip install --prefix=/install --no-warn-script-location \
    --no-deps -r requirements.txt gunicorn


# ============================================================================
# STAGE 2: Development - Includes all tools for local development
# ============================================================================
FROM python:3.12-slim as development

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install only runtime dependencies (lighter than builder)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /install /usr/local

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p media logs ml_models staticfiles

# Expose port
EXPOSE 9999

# Development command (with auto-reload)
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:9999"]


# ============================================================================
# STAGE 3: Production - Minimal runtime image (SMALLEST)
# ============================================================================
FROM python:3.12-slim as production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    # Supabase PostgreSQL configuration
    SUPABASE_DB_HOST=${SUPABASE_DB_HOST:-localhost} \
    SUPABASE_DB_PORT=${SUPABASE_DB_PORT:-5432} \
    SUPABASE_DB_NAME=${SUPABASE_DB_NAME:-postgres} \
    SUPABASE_DB_USER=${SUPABASE_DB_USER:-postgres} \
    SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD} \
    SUPABASE_DB_SSLMODE=${SUPABASE_DB_SSLMODE:-require}

WORKDIR /app

# Install ONLY runtime libraries (no build tools = smaller image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy ONLY compiled packages from builder (not source code)
COPY --from=builder /install /usr/local

# Copy only necessary application files (exclude tests, docs, etc)
COPY manage.py .
COPY backendAI ./backendAI
COPY apps ./apps
COPY core ./core
COPY shared ./shared
COPY services ./services

# Create directories with proper permissions
RUN mkdir -p media logs ml_models staticfiles && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Collect static files (if any)
RUN python manage.py collectstatic --noinput || true

# Switch to non-root user for security
USER appuser

# Expose port
EXPOSE 9999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:9999/health/ || exit 1

# Production server with optimized settings
CMD ["gunicorn", "backendAI.wsgi:application", \
     "--bind", "0.0.0.0:9999", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
