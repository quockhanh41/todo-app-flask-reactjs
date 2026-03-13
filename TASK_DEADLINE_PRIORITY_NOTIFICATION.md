## Tài liệu đặc tả tính năng: Deadline, Priority & In‑App Notification cho Task

---

## 1. Phạm vi & mục tiêu

- **Mục tiêu**: Mở rộng Todo App với:
  - **Deadline** cho task (ngày + giờ).
  - **Priority** cho task (mức độ ưu tiên có thể mở rộng).
  - **In‑app notification** nhắc việc liên quan tới deadline.
- **Không nằm trong scope hiện tại**:
  - Background job phức tạp, email notification.
  - Push notification tới mobile.

Triển khai theo **3 đợt**:

1. **Đợt 1**: Deadline + priority (model + API + UI cơ bản, chưa có notification).
2. **Đợt 2**: Logic “sắp đến hạn / đã quá hạn” + highlight trên danh sách task (in‑app, không lưu lịch sử riêng).
3. **Đợt 3**: Chuông notification + danh sách notification (lưu vào bảng riêng).

---

## 2. Định nghĩa & quy tắc nghiệp vụ

### 2.1. Deadline

- **Kiểu dữ liệu**:
  - Lưu **ngày + giờ** theo chuẩn datetime **UTC**.
- **Tính chất**:
  - **Tùy chọn**: task có thể **không có** deadline.
  - Deadline có thể ở **quá khứ hoặc tương lai**, chỉ cần là datetime hợp lệ.
- **Ý nghĩa nghiệp vụ**:
  - Dùng để:
    - Xác định trạng thái “sắp đến hạn” (trước deadline 30 phút).
    - Xác định “đã quá hạn” (sau deadline).
- **Không thay đổi**:
  - Không có auto‑cập nhật deadline khi task đổi status; deadline là dữ liệu nhập tay của user.

### 2.2. Priority

- **Kiểu dữ liệu**:
  - Enum **mở rộng**.
  - Giai đoạn đầu hỗ trợ: `LOW`, `MEDIUM`, `HIGH`.
- **Tính chất**:
  - Priority luôn có giá trị (không để trống), có thể đặt default (ví dụ: `MEDIUM`).
  - Sau này có thể thêm các giá trị khác (ví dụ: `URGENT`, `OPTIONAL`).
- **Vai trò**:
  - **Ảnh hưởng hiển thị** (màu sắc, icon, thứ tự lọc/sort).
  - **Không làm thay đổi logic nhắc việc**: mọi task có deadline đều được nhắc như nhau (xem 2.3).

### 2.3. In‑app Notification (logic nghiệp vụ)

- **Các loại trạng thái liên quan deadline** (chỉ xét nếu task có deadline):
  - **Normal**: \(now < deadline - 30\ phút\).
  - **Due Soon** (sắp đến hạn): \(deadline - 30\ phút \le now \le deadline\).
  - **Overdue** (đã quá hạn): \(now > deadline\).
- **Loại notification**:
  - `TASK_DUE_SOON`: task sắp đến hạn (trước **30 phút**).
  - `TASK_OVERDUE`: task đã quá hạn.
- **Quy tắc tạo notification (về nghiệp vụ)**:
  - Một task có thể có **tối đa 1 notification `TASK_DUE_SOON` + 1 notification `TASK_OVERDUE`**.
  - Nếu đã tồn tại notification cùng loại cho task đó, **không tạo bản ghi mới** (không spam).
- **Vòng đời notification**:
  - Notification được coi là **hết tác dụng ưu tiên** khi:
    - Task chuyển sang `COMPLETED` (ưu tiên **hệ thống tự ẩn**).
    - Hoặc user đã tương tác (mở task / mark as read) – là thứ yếu.
- **Phạm vi giai đoạn đầu**:
  - In‑app notification **chỉ hoạt động khi user tương tác với API** (mở dashboard, reload, v.v.).
  - Không có job chạy ngầm liên tục ngoài request/response.

---

## 3. Mô hình dữ liệu mức khái niệm

### 3.1. Task (mở rộng)

**Thuộc tính mới**:

- `deadline`: datetime (UTC), **optional**.
- `priority`: enum, required, một trong `LOW`, `MEDIUM`, `HIGH` (giai đoạn đầu).

**Quy tắc hiển thị trạng thái (logic phía client hoặc server)**:

- Thuộc tính trạng thái suy ra (không nhất thiết lưu DB):
  - `isDueSoon`: boolean, true nếu \(deadline - 30\ phút \le now \le deadline\).
  - `isOverdue`: boolean, true nếu \(now > deadline\).
- Các cờ này dùng để:
  - Highlight trên card task.
  - Xác định có cần tạo notification hay không.

### 3.2. Notification (bảng mới – đợt 3)

**Mục tiêu**: Lưu lịch sử notification để hiển thị qua **chuông notification** và danh sách thông báo gần đây.

**Field nghiệp vụ chính** (mức đơn giản):

- `id`: định danh notification.
- `user_id`: người nhận notification.
- `task_id`: liên kết tới task (bắt buộc trong giai đoạn này, nhưng thiết kế để sau **có thể optional**).
- `type`: loại notification, ví dụ:
  - `TASK_DUE_SOON`
  - `TASK_OVERDUE`
  - (mở đường cho các type khác sau này).
- `message`: nội dung text hiển thị cho user, ví dụ:
  - “Task `<title>` sắp đến hạn lúc 14:30.”
  - “Task `<title>` đã quá hạn từ 10 phút trước.”
- `is_read`: boolean, notification user đã đọc/chưa.
- `created_at`: thời điểm tạo notification (UTC).

**Định hướng mở rộng về sau (không bắt buộc hiện tại)**:

- `read_at`: datetime.
- `metadata`: JSON generic lưu thêm thông tin (không dùng ngay, nhưng có thể cân nhắc khi cần).

---

## 4. Hành vi & UX chi tiết theo từng đợt

### 4.1. Đợt 1 – Deadline + Priority (chưa có notification)

**Mục tiêu**:  
Người dùng có thể tạo/cập nhật task với deadline + priority, UI hiển thị các thông tin này một cách rõ ràng.

**Luồng người dùng chính**:

- **Tạo task**:
  - Form có thêm:
    - `deadline` (optional): chọn ngày + giờ.
    - `priority`: chọn từ `LOW`, `MEDIUM`, `HIGH` (mặc định `MEDIUM`).
  - Validation:
    - Deadline nếu có:
      - Phải là datetime hợp lệ (không cần bắt buộc tương lai).
    - Priority phải nằm trong tập enum hợp lệ.
- **Sửa task**:
  - User có thể thêm/sửa/xóa deadline.
  - User có thể thay đổi priority.
- **Hiển thị trên danh sách task**:
  - Mỗi card task:
    - Hiển thị priority bằng màu/nút nhỏ (badge).
    - Hiển thị deadline nếu có (format thân thiện, ví dụ: `20 Mar 2026, 14:30`).
- **Filter/sort (gợi ý)**:
  - Cho phép lọc theo priority (tương lai).
  - Cho phép sort theo deadline (tương lai).

### 4.2. Đợt 2 – Logic “sắp đến hạn / đã quá hạn” (chưa có bảng notification)

**Mục tiêu**:  
Ngay cả khi chưa có chuông notification, người dùng vẫn thấy rõ task nào sắp đến hạn/đã quá hạn, thông qua highlight trên danh sách task.

**Hành vi UI mong muốn**:

- **Khi user mở dashboard / reload**:
  - Lấy danh sách task.
  - Dựa trên `deadline` và thời gian hiện tại để tính:
    - Task `Due Soon`:
      - Có deadline.
      - \(deadline - 30\ phút \le now \le deadline\).
    - Task `Overdue`:
      - Có deadline.
      - \(now > deadline\).
- **Hiển thị trên danh sách task**:
  - Với **Due Soon**:
    - Icon cảnh báo nhỏ + màu nhấn nhẹ (nhất là nếu priority = `HIGH`).
    - Có thể có text phụ: “Sắp đến hạn”.
  - Với **Overdue**:
    - Màu cảnh báo rõ hơn (đậm hơn Due Soon).
    - Text phụ: “Đã quá hạn”.
- **Banner trên đầu dashboard**:
  - Một thông báo ngắn gọn, ví dụ:
    - “Bạn có 2 task sắp đến hạn và 1 task đã quá hạn.”
  - Banner hiển thị khi:
    - Có ít nhất 1 task Due Soon hoặc Overdue.
- **Không có chuông, không có danh sách notification riêng** trong đợt này.

**Quy tắc khi task thay đổi**:

- Khi task chuyển sang `COMPLETED`:
  - Trên UI:
    - Bỏ highlight Due Soon / Overdue cho task đó.
    - Nó không còn được tính vào banner “sắp đến hạn/đã quá hạn”.
- Khi user sửa deadline:
  - Tính lại trạng thái Due Soon / Overdue theo deadline mới.

### 4.3. Đợt 3 – Chuông notification + danh sách notification

**Mục tiêu**:  
Thêm **chuông notification** (icon bell) và danh sách notification lưu trong bảng `notifications`.

**Luồng nghiệp vụ tổng quát**:

- **Khi user tương tác với hệ thống (ví dụ mở dashboard)**:
  - Hệ thống kiểm tra các task có deadline của user.
  - Với mỗi task:
    - Nếu đủ điều kiện `Due Soon` và chưa có `TASK_DUE_SOON`:
      - Tạo 1 bản ghi notification tương ứng.
    - Nếu đủ điều kiện `Overdue` và chưa có `TASK_OVERDUE`:
      - Tạo 1 bản ghi notification tương ứng.
- **Ẩn notification khi task hoàn thành**:
  - Khi task chuyển sang `COMPLETED`:
    - Notification liên quan task đó **không còn được tính vào số badge** (logic chi tiết sẽ được quyết định ở implementation, nhưng nghiệp vụ là “hết tác dụng ưu tiên”).
- **Chuông notification trong UI**:
  - Icon bell trên navbar/dashboard:
    - Hiển thị badge = số notification “active” chưa đọc (theo rule implement sau, nhưng về nghiệp vụ: gắn với user, chưa được đánh dấu đã xem/đọc).
  - Khi click:
    - Mở dropdown/list hiển thị một số notification gần đây (ví dụ 10–20).
    - Mỗi item:
      - Nội dung `message`.
      - Thời gian `created_at` (hiển thị format dễ đọc).
      - Liên kết tới task tương ứng (nhảy tới chi tiết task hoặc scroll tới card).
    - Có action “Mark as read” cho từng notification hoặc “Mark all as read”.
- **Kết hợp với highlight task list (từ đợt 2)**:
  - Một notification tương ứng với task Due Soon/Overdue:
    - Khi user click vào notification:
      - Mở chi tiết task hoặc focus task card.
      - Có thể xem như đã “acknowledged”.
  - Trên danh sách task:
    - Vẫn giữ logic highlight như đợt 2 (không bỏ).

---

## 5. Trải nghiệm người dùng khi mở app

- Khi user mở dashboard:
  - **Không popup modal** ép xem notification.
  - Chỉ:
    - Banner nhỏ trên đầu (nếu có task Due Soon/Overdue).
    - Chuông notification với badge số lượng (sau khi đợt 3 hoàn tất).
- Người dùng **tự quyết định** có bấm vào chuông / xem chi tiết hay không.

---

## 6. Tóm tắt các quyết định quan trọng

- **Deadline**:
  - Datetime UTC, optional, cho phép quá khứ hoặc tương lai.
- **Priority**:
  - Enum mở rộng, giai đoạn đầu: `LOW`, `MEDIUM`, `HIGH`.
  - Logic nhắc việc **không phụ thuộc** priority (chỉ ảnh hưởng cách hiển thị).
- **Notification**:
  - Hai loại: `TASK_DUE_SOON` (trước 30 phút) & `TASK_OVERDUE`.
  - Tối đa 1 notification mỗi loại trên mỗi task.
  - Gắn với task (và user), schema mở rộng cho loại thông báo khác trong tương lai.
  - Ưu tiên hệ thống tự ẩn khi task hoàn thành, sau đó mới đến thao tác “đã đọc”.
- **UX**:
  - Đợt 2: highlight trực tiếp trên task list + banner.
  - Đợt 3: chuông notification + danh sách notification.
  - Trải nghiệm nhẹ nhàng, không làm phiền quá mức.


 Tổng kết nhanh

  • Backend: Đã thêm deadline (datetime UTC, optional) và priority (enum LOW/MEDIUM/HIGH) vào TaskModel, cập nhật
    schema (Marshmallow), repository, service, và tạo migration Alembic để thêm cột mới; test backend đều pass.
  • API & Tests: Payload tạo/cập nhật task giờ yêu cầu thêm priority (deadline optional), các test API và service đã
    được cập nhật để dùng priority mới.
  • Frontend: Đã mở rộng schema form, type Task, form tạo/sửa task để nhập deadline (input datetime-local) và priority,
    chuyển deadline sang ISO trước khi gửi API.
  • UX Đợt 2 (nhắc sắp đến hạn/quá hạn): Đã thêm DeadlineBadge trên card và dialog chi tiết, cùng banner trên
    TasksSection để hiển thị số task “due trong 30 phút” và “overdue”, tính toán hoàn toàn phía frontend dựa trên
    deadline.