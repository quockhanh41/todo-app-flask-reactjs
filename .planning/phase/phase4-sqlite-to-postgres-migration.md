## Phase 4 – Migration dữ liệu từ SQLite sang PostgreSQL

### 1. Mục tiêu

- **Giữ toàn bộ dữ liệu hiện có** trong SQLite (`data.db`).
- Chuyển schema & data sang PostgreSQL sử dụng:
  - Alembic/Flask-Migrate để dựng schema.
  - Script Python custom để copy dữ liệu.
- Sau migration:
  - Ứng dụng chỉ dùng PostgreSQL (không còn phụ thuộc vào SQLite trong runtime).

### 2. Chiến lược tổng thể

1. **Chuẩn hóa schema trên PostgreSQL**:
   - Dùng Alembic migrations hiện có trong `backend/migrations/` để tạo schema trên Postgres.
2. **Viết script migrate data một lần**:
   - Dùng SQLAlchemy để:
     - Kết nối tới SQLite (source).
     - Kết nối tới Postgres (target).
     - Đọc từng bảng và insert sang DB mới theo đúng thứ tự FK.
3. **Chuyển config app sang dùng PostgreSQL**:
   - `SQLALCHEMY_DATABASE_URI` đọc `DATABASE_URL` (Postgres) từ `.env`.

### 3. Chuẩn bị môi trường

- Đảm bảo:
  - `backend/config.py` có `DevelopmentConfig`/`TestConfig` đọc từ biến môi trường `DATABASE_URL` / `TEST_DATABASE_URL`.
  - Có driver Postgres trong `requirements.txt`:
    - `psycopg2-binary` (hoặc `psycopg` v3).
- Xác định đường dẫn file SQLite hiện tại:
  - Mặc định trong config: `"sqlite:///" + os.path.join(basedir, "data.db")`.

### 4. Các bước migration chi tiết

#### Bước 1 – Tạo database PostgreSQL rỗng

- Tự tạo bằng `psql` hoặc để Postgres tạo qua lần connect đầu tiên (tuỳ config).
- Ví dụ lệnh:

```bash
createdb todo_db
```

Hoặc trong Docker Compose:

- Sử dụng env:
  - `POSTGRES_DB=todo_db`
  - `POSTGRES_USER=todo_user`
  - `POSTGRES_PASSWORD=todo_password`

#### Bước 2 – Chạy migrations trên PostgreSQL

- Đảm bảo `.env` (backend) đã trỏ `DATABASE_URL` về Postgres.
- Chạy:

```bash
cd backend
flask db upgrade
```

- Kết quả:
  - Schema trong PostgreSQL giống với schema theo các file migration hiện có.

#### Bước 3 – Viết & chạy script migrate data

- Script (ví dụ `backend/scripts/migrate_sqlite_to_postgres.py`) sẽ:
  - Tạo `engine_sqlite` từ URL SQLite.
  - Tạo `engine_pg` từ `DATABASE_URL` Postgres.
  - Tạo `Session` cho mỗi engine.
  - Đọc lần lượt các bảng theo thứ tự:
    - `UserModel`
    - `TagModel`
    - `TaskModel`
  - Insert dữ liệu sang Postgres, preserve:
    - `id` (PK).
    - Các field liên quan FK (`user_id`, `tag_id`).
    - Enum `TaskStatus`, `created_at`.

- Lưu ý:
  - Dùng `session.flush()` sau mỗi batch để đảm bảo FK hợp lệ.
  - `try/except` để rollback nếu có lỗi.

#### Bước 4 – Xác minh dữ liệu

- So sánh:
  - Số lượng user, tag, task giữa SQLite và PostgreSQL.
  - Một vài record mẫu bằng tay (hoặc script so sánh).
- Nếu mọi thứ khớp, có thể:
  - Đưa app sang dùng chính thức PostgreSQL.

### 5. Chuyển cấu hình app sang PostgreSQL

- Cập nhật (hoặc xác nhận) `config.DevelopmentConfig`:
  - `SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")`
- Cập nhật `.env` backend để trỏ hẳn sang Postgres (không còn SQLite).
- Với Docker:
  - `DATABASE_URL` trỏ service `db` trong compose.

### 6. Đảm bảo an toàn dữ liệu

- Trước khi chạy migration:
  - **Backup file SQLite** (`data.db`) ở chỗ an toàn.
  - Đảm bảo ứng dụng **không ghi thêm** vào SQLite trong lúc migrate.
- Sau khi migrate:
  - Giữ backup SQLite một thời gian (để fallback nếu có vấn đề).

### 7. Acceptance Criteria cho Phase 4

- PostgreSQL đã:
  - Có đầy đủ schema như SQLite.
  - Chứa dữ liệu user/tag/task giống SQLite (số lượng record và spot-check nội dung).
- Ứng dụng chạy hoàn toàn với PostgreSQL:
  - Route CRUD Task/User/Tag hoạt động bình thường.
  - Không có kết nối runtime nào tới SQLite trong config.

