FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Ensure required libraries for psycopg2 and building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Let Render dictate the port or fallback to 5000
EXPOSE 5000

# Start server using Gunicorn instead of Flask's dev server
CMD ["sh", "-c", "flask db upgrade && gunicorn application:app --bind 0.0.0.0:${PORT:-5000}"]
