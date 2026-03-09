# API Documentation

Ngày cập nhật: 2026-03-05
Base URL: `http://localhost:3000/api/v1` (Dev) / `https://api.renmaeai.com/v1` (Prod)

---

## 🔐 Xác thực & Settings (Users)

### GET /users/me
Lấy thông tin profile, setting proxy, và tier gói cước hiện tại.

**Headers:** `Authorization: Bearer <JWT_Token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "pro",
  "ai_settings": {
    "proxy_url": "https://a1b2-c3d4.ngrok-free.app",
    "proxy_key": "GLABS_XYZ123"
  }
}
```

### PUT /users/settings
Cập nhật URL Proxy / API Key.

**Request:**
```json
{
  "ai_settings": {
    "proxy_url": "https://new-url.ngrok.app",
    "proxy_key": "NEW_KEY"
  }
}
```

---

## 📁 Projects

### GET /projects
Lấy danh sách các kênh (Dựa theo `user_id` từ Token JWT)

### POST /projects
Tạo dự án/kênh mới.
**Request:** `{ "name": "Kênh Lịch Sử", "global_settings": {"voice": "id-123"} }`

---

## 🎬 Productions (Nội dung)

### GET /projects/:projectId/productions
Lấy danh sách các video thuộc Project (hiển thị cho Kanban Board).

### POST /productions
Khởi tạo 1 thẻ video mới.
**Request:** `{ "project_id": "uuid", "title": "Chiến Tranh WW2", "input_prompt": "Bài viết gốc..." }`

---

## ⚙️ Queue & Pipeline (BullMQ Trigger)

### POST /pipelines/:productionId/start
Kích hoạt vứt Job vào hàng đợi BullMQ để bắt đầu Gen Video.
API này không chờ kết quả gen (chạy nền), chỉ trả về status Job đã Queue.

**Response (202 Accepted):**
```json
{
  "message": "Pipeline queued successfully",
  "job_id": "bullmq-123456",
  "status": "processing"
}
```

### GET /pipelines/:productionId/checkpoints
Lấy toàn bộ lịch sử 7 bước của một Pipeline (dùng để vẽ giao diện step-by-step nếu user F5 trình duyệt).

**Response (200):**
```json
{
  "checkpoints": [
    { "step_number": 1, "status": "success", "output_data": {"script_json": "..."} },
    { "step_number": 2, "status": "processing", "output_data": null }
  ]
}
```
*(Ghi chú: Event thay đổi trạng thái sẽ được push realtime qua `Socket.IO`, API này chỉ phục vụ initial load)*
