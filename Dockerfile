##########
# Stage 1: Build frontend (Vite)
##########
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# VITE_API_BASE_URL có thể được truyền từ CI/CD khi build image
RUN npm run build


##########
# Stage 2: Final runtime image (Python + Gunicorn + Nginx)
##########
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install backend dependencies (including psycopg2, gunicorn, etc.)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt gunicorn

# Copy backend source
COPY backend/ ./backend

# Copy frontend build output to Nginx html root
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTP port for Render
EXPOSE 80

ENV FLASK_APP=application.py
WORKDIR /app/backend

CMD sh -c "\
  gunicorn -w 4 -b 0.0.0.0:5000 application:app & \
  nginx -g 'daemon off;' \
"

