FROM python:3.12-slim

RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps dulu — layer ini di-cache selama pyproject.toml tidak berubah
COPY pyproject.toml .
RUN pip install --no-cache-dir $(python3 -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); print(' '.join(d['project']['dependencies']))") && \
    pip install --no-cache-dir instructor anthropic

# Copy kode — layer ini ringan, rebuild cepat
COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
