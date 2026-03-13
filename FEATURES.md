# Tài liệu tính năng hiện có

Tài liệu này tổng hợp các tính năng đang được implement trong dự án Todo App (Flask + React), dựa trên mã nguồn hiện tại của backend và frontend.

## 1) Tổng quan sản phẩm

Ứng dụng cho phép:
- Tạo tài khoản và đăng nhập bằng email/password.
- Quản lý task cá nhân (tạo, xem danh sách, xem chi tiết, cập nhật, xóa).
- Gắn task với tag và theo dõi trạng thái task.

Kiến trúc:
- Frontend: React + TypeScript + React Router + React Query + Zustand + React Hook Form + Zod.
- Backend: Flask + Flask-Smorest + SQLAlchemy + JWT.
- API prefix: `/api/v1`.

## 2) Tính năng phía người dùng (Frontend)

### 2.1 Xác thực và phiên đăng nhập

- Đăng ký tài khoản mới từ màn hình landing (`Create Account`).
- Đăng nhập (`Sign In`) để nhận JWT token.
- Lưu trạng thái đăng nhập và token bằng Zustand `persist` (session storage key: `session`).
- Đăng xuất trong dashboard navbar.
- Route guard:
  - Nếu đã đăng nhập, truy cập `/` sẽ được chuyển hướng sang `/dashboard`.
  - Nếu chưa đăng nhập, truy cập `/dashboard` sẽ bị chuyển về `/`.

### 2.2 Quản lý task

- Hiển thị danh sách task của user đang đăng nhập.
- Empty state khi chưa có task, kèm nút tạo task nhanh.
- Tạo task mới qua dialog:
  - Trường: `title`, `content`, `tagId`, `status`.
  - `tagId` được chọn từ danh sách tag API.
  - `status`: `PENDING`, `IN_PROGRESS`, `COMPLETED`.
- Xem chi tiết task qua dialog (tiêu đề, nội dung, tag, status).
- Sửa task qua dialog (sửa `title`, `content`, `status`).
- Xóa task với hộp thoại xác nhận (`AlertDialog`).
- Sau khi tạo/sửa/xóa task, React Query tự động invalidate query `tasks` để tải dữ liệu mới.

### 2.3 Tag trong giao diện

- Hiển thị danh sách tag đang có.
- Có loading skeleton khi đang tải tag.
- Tag được sử dụng làm metadata trên task card và task detail.

### 2.4 UX và phản hồi người dùng

- Form validation realtime bằng Zod + React Hook Form.
- Trạng thái loading khi submit (spinner, disable input/button).
- Toast thông báo khi thành công/thất bại (`sonner`).

## 3) Tính năng phía backend (API + nghiệp vụ)

### 3.1 Auth

- `POST /api/v1/auth/sign-in`
  - Kiểm tra thông tin đăng nhập.
  - Trả về access token JWT nếu hợp lệ.
  - Sai thông tin: `401 Incorrect credentials`.

### 3.2 User

- `GET /api/v1/users`: lấy danh sách user.
- `POST /api/v1/users`: tạo user mới.
  - Báo lỗi `409` nếu trùng username hoặc email.
- `GET /api/v1/users/<user_id>`: lấy user theo id (`404` nếu không tồn tại).
- `DELETE /api/v1/users/account` (cần JWT): xóa tài khoản hiện tại.

### 3.3 Tag

- `GET /api/v1/tags`: lấy danh sách tag (service đang giới hạn tối đa 15 bản ghi mỗi lần gọi).
- `POST /api/v1/tags`: tạo tag mới.
  - Báo lỗi `409` nếu tên tag đã tồn tại.

### 3.4 Task

- `POST /api/v1/tasks` (cần JWT): tạo task cho user hiện tại.
- `GET /api/v1/tasks/user` (cần JWT): lấy task của chính user đang đăng nhập.
- `PUT /api/v1/tasks/<task_id>` (cần JWT): cập nhật task.
- `DELETE /api/v1/tasks/<task_id>` (cần JWT): xóa task.

Ràng buộc nghiệp vụ task:
- User chỉ được sửa/xóa task của chính mình.
- Nếu task không tồn tại: `404 Task not found`.
- Nếu có task nhưng không thuộc user: `403 Forbidden`.

## 4) Ràng buộc dữ liệu hiện có

### 4.1 Validation task

- `title`: bắt buộc, tối đa 40 ký tự.
- `content`: bắt buộc, tối đa 600 ký tự.
- `status`: một trong `PENDING`, `IN_PROGRESS`, `COMPLETED`.
- `tagId`: bắt buộc khi tạo task.

### 4.2 Validation auth/user

- `username`: bắt buộc, tối đa 20 ký tự (frontend).
- `email`: bắt buộc, định dạng email hợp lệ.
- `password`: bắt buộc.

## 5) Các tính năng đã có trên API nhưng chưa có màn hình riêng ở frontend

- Tạo tag mới (`POST /api/v1/tags`) chưa có form UI riêng.
- Xóa tài khoản (`DELETE /api/v1/users/account`) chưa có màn hình cài đặt tài khoản.
- Lấy danh sách user và xem user theo id (`GET /api/v1/users`, `GET /api/v1/users/<id>`) không expose trên UI dashboard.

## 6) Ghi chú vận hành

- Swagger UI đang mở tại `/docs`.
- JWT access token hết hạn sau 4 giờ.
- CSDL ưu tiên `DATABASE_URL` (PostgreSQL), nếu không có sẽ fallback về SQLite.