## Phase 2 – Testing cho Backend (Flask)

### 1. Mục tiêu

- Thiết lập **pytest** cho backend.
- Viết test cho:
  - **Service layer** (unit test).
  - Một số **API endpoint quan trọng** (integration test).
- Đảm bảo quy trình test dễ chạy cả:
  - Trên máy local (không Docker).
  - Bên trong Docker (CI/CD về sau).

### 2. Công cụ & Thư viện đề xuất

- `pytest` – test runner chính.
- `pytest-cov` (tùy chọn) – đo coverage.
- Flask:
  - Dùng app factory `create_app(test_config=...)`.
  - Flask test client để test endpoint.
- SQLAlchemy:
  - Dùng PostgreSQL test DB riêng (hoặc SQLite in-memory nếu muốn đơn giản ban đầu).

### 3. Cấu trúc thư mục test gợi ý

- Thư mục: `backend/tests/`
  - `conftest.py` – chứa fixtures dùng chung:
    - `app` – tạo Flask app với `TestConfig`.
    - `client` – `app.test_client()`.
    - `db_session` – session cho mỗi test (transaction rollback sau mỗi test).
    - (Nếu có JWT) helper để tạo access token.
  - `test_services/`
    - `test_task_service.py`
    - (sau này) `test_user_service.py`, `test_tag_service.py`, ...
  - `test_routes/`
    - `test_task_routes.py`
    - `test_auth_routes.py`, ...

### 4. Thiết lập cấu hình TestConfig

- Trong `config.py`, đã có:

- Bổ sung/hoàn thiện:
  - `TESTING = True`.
  - `SQLALCHEMY_DATABASE_URI` cho test ưu tiên đọc từ:
    - `TEST_DATABASE_URL` (Postgres test DB).
    - Nếu không có, fallback sang `DATABASE_URL`.

Ví dụ ý tưởng:

- `TestConfig.SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", os.getenv("DATABASE_URL"))`

### 5. Chi tiết test cho Service (ví dụ `TaskService`)

Các case quan trọng:

- **`get_tasks_for_user`**:
  - Khi DB có nhiều task của nhiều user → chỉ trả về task thuộc user tương ứng.
  - Bắt được bug logic cũ `.where(user_id == user_id)` khi chưa fix.
- **`create_task_for_user`**:
  - Tạo task với status default là `PENDING` khi không truyền status.
  - Tạo task với tag hợp lệ; fail nếu tag_id không tồn tại.
- **`update_task`**:
  - User sở hữu task có thể update thành công.
  - User không sở hữu → raise `Forbidden` (hoặc exception tương tự).
  - Task không tồn tại → raise `TaskNotFound`.
- **`delete_task`**:
  - Xóa thành công, lần gọi sau get_by_id → `TaskNotFound`.

Các kỹ thuật:

- Dùng fixture để:
  - Tạo user mẫu, tag mẫu, task mẫu.
  - Clean data sau mỗi test (transaction rollback).

### 6. Chi tiết test cho Route / API

Endpoint ưu tiên:

- `POST /api/v1/auth/login` (hoặc tương đương):
  - Trả về JWT khi credential đúng.
- `GET /api/v1/tasks/user`:
  - Cần JWT hợp lệ trong header.
  - Khi có task của user → trả đúng mảng Task.
  - Khi token invalid/thiếu → 401.
- `POST /api/v1/tasks`:
  - Tạo task mới, status code 201.

Các bước chung cho mỗi test API:

1. Dùng fixture **seed user** + hash password (giống logic thật).
2. Gọi login để lấy token.
3. Gọi endpoint với header `Authorization: Bearer <token>`.
4. Assert status code + dữ liệu trả về.

### 7. Cách chạy test

- Local:
  - `cd backend`
  - `pytest` hoặc `pytest -q`
- Trong Docker:
  - Tạo service `backend-test` trong docker-compose (tùy).
  - Command ví dụ: `pytest --maxfail=1 --disable-warnings -q`.

### 8. Acceptance Criteria cho Phase 2

- Có thư mục `backend/tests/` với:
  - Ít nhất 1 file test cho service (vd `test_task_service.py`).
  - Ít nhất 1 file test cho route (vd `test_task_routes.py`).
- `pytest` chạy thành công (exit code 0) trên máy bạn.
- Tối thiểu cover:
  - Tạo / sửa / xóa task cơ bản.
  - Một route được bảo vệ bằng JWT.

