FROM python:3.12-slim

RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
COPY app/ ./app/

RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
