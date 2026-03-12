## Phase 1 – Phân tầng Service cho Backend

### 1. Mục tiêu

- **Tách rõ ràng** giữa lớp HTTP (route) / controller / service / data access.
- **Giảm phụ thuộc** trực tiếp controller ↔ `db.session`, giúp logic nghiệp vụ dễ test hơn.
- Chuẩn bị nền tảng để viết **unit test** cho nghiệp vụ mà không cần hit DB thật.

### 2. Kiến trúc đề xuất

- **Routes (`flaskr/routes/*_route.py`)**
  - Giữ trách nhiệm: ánh xạ HTTP method + URL → method controller.
  - Quản lý: decorators `@jwt_required`, mapping schema input/output (`@bp.arguments`, `@bp.response`).

- **Controllers (`flaskr/controllers/*_controller.py`)**
  - Mỏng đi, chủ yếu:
    - Lấy ngữ cảnh request (vd: `get_jwt_identity` hoặc header/path).
    - Gọi sang Service tương ứng.
    - Chuyển exception domain thành HTTP response (dùng `abort`).

- **Services (mới, ví dụ `flaskr/services/task_service.py`)**
  - Chứa **business logic**:
    - Ràng buộc quyền sở hữu (user chỉ thấy/sửa data của mình).
    - Quy tắc trạng thái Task (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
    - Gán tag, validate dữ liệu trước khi commit.
  - Không gọi trực tiếp `abort`, chỉ raise các exception domain (vd `TaskNotFound`, `Forbidden`, `ValidationError`).

- **Repositories / Data Access Layer (mới, ví dụ `flaskr/repositories/task_repository.py`)**
  - Chỉ chứa truy vấn SQLAlchemy:
    - `get_by_id`, `list_by_user`, `create`, `update`, `delete`, ...
  - Không chứa nghiệp vụ, không biết gì về JWT hay HTTP.

### 3. Thiết kế chi tiết cho domain Task (mẫu)

#### 3.1. Interface Service (tạm thời)

- `TaskService.get_tasks_for_user(user_id: int) -> list[TaskDTO]`
- `TaskService.create_task_for_user(user_id: int, data: dict) -> TaskModel`
- `TaskService.update_task(user_id: int, task_id: int, data: dict) -> TaskModel`
- `TaskService.delete_task(user_id: int, task_id: int) -> None`

Trong đó:

- `user_id` được truyền từ controller (lấy bằng `get_jwt_identity()`).
- Service sẽ:
  - Gọi repository để fetch/check quyền.
  - Raise exception nếu user không sở hữu task hoặc không tồn tại task.

#### 3.2. Repository cho Task

- Ví dụ các method:
  - `TaskRepository.list_by_user(session, user_id)`
  - `TaskRepository.get_by_id(session, task_id)`
  - `TaskRepository.create(session, **fields)`
  - `TaskRepository.delete(session, task)`

- Transaction boundary gợi ý:
  - Service quyết định **khi nào commit / rollback**.
  - Repository chỉ thao tác trên session được truyền vào.

### 4. Mapping lỗi domain → HTTP

- Service raise:
  - `TaskNotFound` → controller map thành `abort(404, message="Task not found")`.
  - `Forbidden` → controller map thành `abort(403, message="Forbidden")`.
  - `ValidationError` → controller map thành `abort(400, message="...")`.

- Ưu điểm:
  - Dễ test service độc lập, chỉ cần assert exception.
  - HTTP layer thuần túy, dễ thay đổi nếu sau này chuyển sang GraphQL / gRPC.

### 5. Lộ trình refactor theo bước nhỏ

1. **Tạo thư mục mới**:
   - `flaskr/services/`
   - `flaskr/repositories/`
2. **Implement TaskRepository** trước, sao chép logic query từ `TaskController`:
   - Đảm bảo sửa bug logic cũ: `.where(TaskModel.user_id == user_id)` thay cho `.where(user_id == user_id)`.
3. **Viết TaskService**:
   - Sử dụng repository, chứa toàn bộ nghiệp vụ Task.
4. **Làm mỏng `TaskController`**:
   - Chỉ lấy `user_id`, gọi `TaskService`, handle exception.
5. Áp dụng pattern tương tự lên:
   - `UserController`, `TagController`, `AuthController` (nếu cần).

### 6. Acceptance Criteria cho Phase 1

- Đã có:
  - `TaskService` và `TaskRepository` (hoặc tên tương đương).
  - `TaskController` không còn thao tác trực tiếp với `db.session`.
- Logic GET/POST/PUT/DELETE Task hoạt động như cũ (hoặc tốt hơn), được xác nhận bằng:
  - Manual test qua Postman / frontend.
  - (Chuẩn bị cho Phase 2: có thể được cover bằng test).

