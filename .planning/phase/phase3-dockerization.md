## Phase 3 – Docker hoá hệ thống (Dev)

### 1. Mục tiêu

- Chạy toàn bộ hệ thống bằng **Docker Compose** cho môi trường development:
  - `frontend` (Vite + React).
  - `backend` (Flask).
  - `db` (PostgreSQL).
- Sử dụng **`.env`** để quản lý credentials & connection string.
- Dễ dàng mở rộng cho môi trường staging/production sau này.

### 2. Thiết kế tổng quan

#### 2.1. Services chính trong `docker-compose.yml`

- **db**:
  - Image: `postgres:16` (hoặc gần nhất).
  - Env:
    - `POSTGRES_USER`
    - `POSTGRES_PASSWORD`
    - `POSTGRES_DB`
  - Volume: `pgdata:/var/lib/postgresql/data`.
  - Healthcheck với `pg_isready`.

- **backend**:
  - Build từ `./backend`.
  - Dùng `env_file: backend/.env`.
  - Cần các biến:
    - `DATABASE_URL` (trỏ tới service `db`).
    - `JWT_SECRET_KEY`.
    - Các config khác nếu có.
  - Expose port `5000`.
  - EntryPoint:
    - Chờ DB healthy.
    - Chạy `flask db upgrade`.
    - (Dev) Có thể chạy seed nếu cần.
    - Chạy `flask run --host=0.0.0.0 --port=5000`.

- **frontend**:
  - Có 2 option:
    - **Dev mode**: Vite dev server, volume mount source để hot-reload.
    - **Build + serve**: Build static (Vite build) và serve bằng Nginx (prod-like).
  - Dev mục tiêu:
    - Build context `./frontend`.
    - Command: `npm run dev -- --host 0.0.0.0 --port 5173`.
    - Expose port `5173`.
    - Volume: `./frontend:/app` (tùy cấu trúc Dockerfile).

#### 2.2. Biến môi trường `.env` (backend)

- Ví dụ nội dung:

```env
POSTGRES_USER=todo_user
POSTGRES_PASSWORD=todo_password
POSTGRES_DB=todo_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

DATABASE_URL=postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

JWT_SECRET_KEY=change_me_in_real_env
```

- `config.DevelopmentConfig` đọc `DATABASE_URL` từ `.env`.

### 3. Dockerfile gợi ý

#### 3.1. Backend

- Base image: `python:3.13-slim` (hoặc tương thích với version bạn dùng).
- Bước chính:
  - Set `WORKDIR /app`.
  - Copy `requirements.txt`, chạy `pip install -r requirements.txt`.
  - Copy source `backend` (hoặc phần cần thiết).
  - Đặt entrypoint/command phù hợp (có thể trỏ tới script shell).

#### 3.2. Frontend

- Base image (dev): `node:20` hoặc tương tự.
- Bước chính:
  - `WORKDIR /app`.
  - Copy `package.json` + `package-lock.json`.
  - `npm install` (hoặc `npm ci`).
  - Copy phần còn lại của source.
  - Command: `npm run dev -- --host 0.0.0.0 --port 5173`.

### 4. Quy trình chạy dev với Docker Compose

1. Tạo `.env` trong `backend` như spec ở trên.
2. Build & run:
   - `docker compose up --build`
3. Kiểm tra:
   - Backend: `http://localhost:5000/docs` (Swagger/UI nếu enable).
   - Frontend: `http://localhost:5173`.
4. Đảm bảo frontend trỏ `API_BASE_URL` về `http://localhost:5000/api/v1` (qua config frontend).

### 5. Cân nhắc tương lai (Prod)

- Tách compose file:
  - `docker-compose.dev.yml` – cho dev (Vite dev, Flask dev server).
  - `docker-compose.prod.yml` – cho prod (Nginx, gunicorn).
- Prod:
  - Backend dùng `gunicorn` thay cho `flask run`.
  - Frontend build trước rồi serve static qua Nginx.

### 6. Acceptance Criteria cho Phase 3

- Có `docker-compose.yml` (hoặc file tương đương) chạy được:
  - `db` Postgres.
  - `backend` kết nối tới Postgres, apply migrations khi start.
  - `frontend` truy cập API backend bình thường.
- Một lệnh `docker compose up --build` là đủ để chạy dev environment.

