# 🎨 DESIGN: RenmaeAI SaaS v2

Ngày tạo: 2026-03-07
Dựa trên: [renmaeai_v2_spec.md](specs/renmaeai_v2_spec.md) | [BRIEF.md](BRIEF.md)

---

## 1. Prisma Schema (Database) — Chi tiết Code-ready

> Tất cả models dưới đây sẽ nằm trong file `packages/database/prisma/schema.prisma`.
> NextAuth.js (Auth.js v5) sử dụng Prisma Adapter, tự tạo thêm 4 bảng phụ: `Account`, `Session`, `User` (mở rộng), `VerificationToken`.

```prisma
// =====================================
// 📦 DATASOURCE & GENERATOR
// =====================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================
// 👤 USER (Mở rộng từ NextAuth User)
// =====================================
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)

  // === BYOK Settings ===
  aiSettings    Json?     @map("ai_settings")
  // Cấu trúc JSON mẫu:
  // {
  //   "glabs_token": "eyJ...",
  //   "elevenlabs_key": "sk-...",
  //   "tts_provider": "elevenlabs" | "edge-tts"
  // }

  // === Virtual Quota ===
  subscriptionTier   SubscriptionTier @default(FREE) @map("subscription_tier")
  monthlyVideoQuota  Int              @default(1)    @map("monthly_video_quota")
  monthlyMinuteQuota Int              @default(5)    @map("monthly_minute_quota")
  usedVideoCount     Int              @default(0)    @map("used_video_count")
  usedMinuteCount    Float            @default(0)    @map("used_minute_count")
  maxConcurrentSlots Int              @default(1)    @map("max_concurrent_slots")

  // === Polar.sh Subscription ===
  polarCustomerId    String?  @unique @map("polar_customer_id")
  polarSubscriptionId String? @map("polar_subscription_id")
  subscriptionStatus String?  @default("inactive") @map("subscription_status")

  // === Single Session Enforcement ===
  activeSessionToken String? @map("active_session_token")

  // === Timestamps ===
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  // === Relations ===
  accounts   Account[]
  sessions   Session[]
  projects   Project[]
  auditLogs  AuditLog[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

enum SubscriptionTier {
  FREE
  PRO
  BUSINESS
}

// =====================================
// 🔐 NEXTAUTH TABLES (Auto-generated)
// =====================================
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// =====================================
// 📁 PROJECT (Thư mục dự án)
// =====================================
model Project {
  id             String   @id @default(cuid())
  userId         String   @map("user_id")
  name           String
  description    String?
  globalSettings Json?    @map("global_settings")
  // Cấu trúc JSON mẫu:
  // {
  //   "default_language": "vi",
  //   "default_tts_voice": "vi-VN-HoaiMyNeural",
  //   "default_style": "educational"
  // }

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  // === Relations ===
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  productions Production[]

  @@index([userId])
  @@map("projects")
}

// =====================================
// 🎬 PRODUCTION (1 Video = 1 Production)
// =====================================
model Production {
  id              String           @id @default(cuid())
  projectId       String           @map("project_id")
  title           String
  status          ProductionStatus @default(DRAFT)
  currentStep     Int              @default(0) @map("current_step")
  mediaGeneration Boolean          @default(true) @map("media_generation")

  // === Input Data ===
  inputScript     String?  @db.Text @map("input_script")
  youtubeUrl      String?  @map("youtube_url")
  language        String   @default("vi")

  // === Output Data (Kết quả sau khi Pipeline xong) ===
  outputData      Json?    @map("output_data")
  // Cấu trúc JSON mẫu:
  // {
  //   "script": "Kịch bản hoàn chỉnh...",
  //   "scenes": [
  //     {
  //       "scene_number": 1,
  //       "narration": "...",
  //       "visual_prompt": "...",
  //       "duration_seconds": 8.5,
  //       "media_url": "https://...",
  //       "audio_url": "https://..."
  //     }
  //   ]
  // }

  estimatedMinutes Float?  @map("estimated_minutes")
  errorMessage     String? @map("error_message")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  // === Relations ===
  project     Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  checkpoints PipelineCheckpoint[]

  @@index([projectId])
  @@index([status])
  @@map("productions")
}

enum ProductionStatus {
  DRAFT
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

// =====================================
// ⏱️ PIPELINE CHECKPOINT (7 Bước)
// =====================================
model PipelineCheckpoint {
  id           String          @id @default(cuid())
  productionId String          @map("production_id")
  stepNumber   Int             @map("step_number") // 1-7
  stepName     String          @map("step_name")
  status       CheckpointStatus @default(PENDING)
  outputData   Json?           @map("output_data")
  errorMessage String?         @map("error_message")
  startedAt    DateTime?       @map("started_at")
  completedAt  DateTime?       @map("completed_at")

  // === Relations ===
  production Production @relation(fields: [productionId], references: [id], onDelete: Cascade)

  @@unique([productionId, stepNumber])
  @@index([productionId])
  @@map("pipeline_checkpoints")
}

enum CheckpointStatus {
  PENDING
  PROCESSING
  SUCCESS
  ERROR
  SKIPPED
}

// =====================================
// 📋 AUDIT LOG (Nhật ký hệ thống)
// =====================================
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  @map("user_id")
  action      String   // "deduct_quota" | "webhook_received" | "login_failed" | "api_error"
  description String
  metadata    Json?
  ipAddress   String?  @map("ip_address")
  createdAt   DateTime @default(now()) @map("created_at")

  // === Relations ===
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Bảng tóm tắt Quota theo Gói:

| Tier | `monthlyVideoQuota` | `monthlyMinuteQuota` | `maxConcurrentSlots` |
|------|---------------------|----------------------|----------------------|
| FREE | 1 | 5 | 1 |
| PRO | 60 | 600 | 3 |
| BUSINESS | 250 | 5000 | 10 |

---

## 2. API Endpoints — Chi tiết Request/Response

> Base URL: `/api/v1` — Tất cả endpoint (trừ Webhook và Auth) yêu cầu Header: `Authorization: Bearer <JWT_TOKEN>`

### 2.1. 🔐 Auth (Quản lý bởi NextAuth — Frontend)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/auth/session` | Lấy thông tin phiên đăng nhập hiện tại |
| POST | `/api/auth/signin` | Đăng nhập (Google OAuth / Magic Link) |
| POST | `/api/auth/signout` | Đăng xuất |

> Auth được NextAuth xử lý hoàn toàn ở phía Next.js. NestJS chỉ verify JWT token qua Guard.

---

### 2.2. 📁 Projects

#### `GET /api/v1/projects` — Danh sách dự án của user

```
Response 200:
{
  "data": [
    {
      "id": "clx...",
      "name": "YouTube Channel Cooking",
      "description": "Kênh nấu ăn hàng ngày",
      "productionCount": 12,
      "createdAt": "2026-03-07T00:00:00Z"
    }
  ],
  "total": 3
}
```

#### `POST /api/v1/projects` — Tạo dự án mới

```
Request Body:
{
  "name": "Travel Vlog Series",
  "description": "Series du lịch Đông Nam Á",
  "globalSettings": {
    "default_language": "vi",
    "default_tts_voice": "vi-VN-HoaiMyNeural"
  }
}

Response 201:
{ "id": "clx...", "name": "Travel Vlog Series" }
```

#### `PUT /api/v1/projects/:id` — Cập nhật dự án
#### `DELETE /api/v1/projects/:id` — Xoá dự án (Cascade xoá Productions)

---

### 2.3. 🎬 Productions

#### `GET /api/v1/projects/:projectId/productions` — Danh sách video trong dự án

```
Response 200:
{
  "data": [
    {
      "id": "clx...",
      "title": "Top 10 món ăn Hà Nội",
      "status": "COMPLETED",
      "currentStep": 7,
      "mediaGeneration": true,
      "estimatedMinutes": 8.5,
      "createdAt": "2026-03-07T00:00:00Z"
    }
  ]
}
```

#### `POST /api/v1/productions` — Tạo Production mới + Đẩy vào Queue

```
Request Body:
{
  "projectId": "clx...",
  "title": "Hướng dẫn nấu Phở",
  "inputScript": "Giới thiệu về Phở Hà Nội truyền thống...",
  "youtubeUrl": null,
  "language": "vi",
  "mediaGeneration": true
}

Response 202 (Accepted — Job đã vào Queue):
{
  "id": "clx...",
  "status": "QUEUED",
  "message": "Job đã được đẩy vào hàng đợi xử lý."
}

Response 429 (Hết Quota hoặc hết Slot):
{
  "error": "QUOTA_EXCEEDED",
  "message": "Bạn đã sử dụng hết 60/60 video trong tháng này."
}
// HOẶC
{
  "error": "CONCURRENT_LIMIT",
  "message": "Đang chạy 3/3 slot. Vui lòng đợi 1 slot hoàn thành."
}
```

#### `GET /api/v1/productions/:id` — Chi tiết 1 Production (kèm Checkpoints)

```
Response 200:
{
  "id": "clx...",
  "title": "Hướng dẫn nấu Phở",
  "status": "PROCESSING",
  "currentStep": 4,
  "checkpoints": [
    { "stepNumber": 1, "stepName": "YouTube Extract", "status": "SUCCESS" },
    { "stepNumber": 2, "stepName": "Style Analysis", "status": "SUCCESS" },
    { "stepNumber": 3, "stepName": "Script Generation", "status": "SUCCESS" },
    { "stepNumber": 4, "stepName": "Scene Splitting", "status": "PROCESSING" },
    { "stepNumber": 5, "stepName": "Visual Generation", "status": "PENDING" },
    { "stepNumber": 6, "stepName": "Voice TTS", "status": "PENDING" },
    { "stepNumber": 7, "stepName": "Finalize", "status": "PENDING" }
  ],
  "outputData": null
}
```

---

### 2.4. 🔔 Webhooks (Không cần Auth — Verify bằng Secret)

#### `POST /api/v1/webhooks/glabs` — Nhận kết quả từ G-Labs

```
Request Body (G-Labs gửi về):
{
  "job_id": "glabs_abc123",
  "production_id": "clx...",
  "step_number": 5,
  "status": "success",
  "output": {
    "media_url": "https://storage.glabs.ai/video_xyz.mp4",
    "duration_seconds": 12.5
  }
}

Response 200:
{ "received": true }
```

> **Sau khi nhận Webhook:** NestJS cập nhật DB checkpoint → Emit Socket.IO event `pipeline:step:completed` tới Room của User.

#### `POST /api/v1/webhooks/polar` — Nhận Subscription events từ Polar.sh

```
Events xử lý:
- subscription.created → Upgrade user tier + set quota
- subscription.updated → Sync tier
- subscription.canceled → Downgrade to FREE
- checkout.completed → Activate subscription
```

---

### 2.5. ⚙️ User Settings

#### `GET /api/v1/users/me` — Lấy thông tin user hiện tại

```
Response 200:
{
  "id": "clx...",
  "email": "user@example.com",
  "role": "USER",
  "subscriptionTier": "PRO",
  "quota": {
    "video": { "used": 15, "limit": 60 },
    "minutes": { "used": 120.5, "limit": 600 }
  },
  "concurrentSlots": { "active": 1, "limit": 3 },
  "aiSettings": {
    "glabs_token": "eyJ...(masked)",
    "tts_provider": "elevenlabs"
  }
}
```

#### `PATCH /api/v1/users/me/settings` — Cập nhật Token BYOK

```
Request Body:
{
  "aiSettings": {
    "glabs_token": "eyJnew_token...",
    "elevenlabs_key": "sk-new...",
    "tts_provider": "elevenlabs"
  }
}

Response 200:
{ "message": "Cài đặt đã được cập nhật." }
```

---

### 2.6. 📋 Admin — Audit Logs

#### `GET /api/v1/admin/audit-logs` — Danh sách Logs (Chỉ role=ADMIN)

```
Query Parameters:
?action=deduct_quota&userId=clx...&from=2026-03-01&to=2026-03-07&page=1&limit=50

Response 200:
{
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "userEmail": "user@test.com",
      "action": "deduct_quota",
      "description": "Trừ 1 video, 8.5 phút cho Production 'Nấu Phở'",
      "metadata": { "productionId": "clx...", "minutesDeducted": 8.5 },
      "createdAt": "2026-03-07T10:30:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "totalPages": 25
}
```

---

### 2.7. 🔌 Socket.IO Events (Realtime)

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `pipeline:step:started` | Server → Client | `{ productionId, stepNumber, stepName }` | Bước mới bắt đầu |
| `pipeline:step:completed` | Server → Client | `{ productionId, stepNumber, outputData }` | Bước hoàn thành |
| `pipeline:step:failed` | Server → Client | `{ productionId, stepNumber, error }` | Bước bị lỗi |
| `pipeline:completed` | Server → Client | `{ productionId, outputData }` | Toàn bộ Pipeline xong |
| `quota:updated` | Server → Client | `{ videoUsed, minuteUsed }` | Quota thay đổi |

> **Bảo mật:** Client join Room = `user:{userId}` bằng JWT token khi kết nối. Server chỉ emit event vào Room tương ứng.

---

## 3. Danh Sách Màn Hình UI (Next.js App Router)

| # | Route | Tên | Mục đích | Component chính (Shadcn) |
|---|-------|-----|----------|--------------------------|
| 1 | `/login` | Đăng nhập | OAuth Google / Magic Link | Card, Button, Input |
| 2 | `/dashboard` | Dashboard | Xem tổng quan Projects | Card, Table, Badge |
| 3 | `/projects/:id` | Chi tiết Project | Kanban Board Productions | **dnd-kit** + Card, Badge |
| 4 | `/projects/:id/new` | Tạo Video | Form nhập Script/YouTube | Textarea, Select, Switch, Button |
| 5 | `/settings` | Cài đặt | Nhập Token BYOK + xem Quota | Input, Form, Progress |
| 6 | `/admin/logs` | Audit Logs | Bảng log hệ thống (Admin) | DataTable, DatePicker, Select |

### Layout chung (Shadcn Blocks — Sidebar):

```
┌──────────────────────────────────────────────────────────────┐
│ 🎬 RenmaeAI              [Quota: 15/60 videos] [👤 Avatar]  │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ 📁 Dự án   │   [Nội dung trang chính]                       │
│ ⚙️ Cài đặt │                                                 │
│ 📋 Logs    │                                                 │
│            │                                                 │
│            │                                                 │
│ ────────── │                                                 │
│ 🚪 Logout  │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

---

## 4. Luồng Hoạt Động (User Flows)

### Flow 1: Lần đầu sử dụng
```
Mở app → /login → Đăng nhập Google → /dashboard (trống)
→ Bấm "Tạo Dự Án+" → Nhập tên → /projects/:id (Kanban trống)
→ /settings → Dán G-Labs Token → Lưu
→ Quay lại Project → Bấm "Tạo Video+" → Nhập Script → Submit
→ Kanban Card hiện lên ở cột "Queued" → Tự nhảy sang "Processing"
→ Khi xong → Card nhảy sang "Completed" → Bấm "Tải ZIP" hoặc "Tải MP4 Ghép"
```

### Flow 2: Gen "Chỉ Text" (Tiết kiệm Quota phút)
```
/projects/:id → Bấm "Tạo Video+" → Tick ☑ "Chỉ Gen Script & Prompt"
→ Submit → Queue chạy Step 1-4 (bỏ Step 5-6) → Xong trong 3-5 giây
→ Card nhảy sang "Completed" → Bấm "Tải Script" (file .txt/.json)
→ Quota: Trừ 1 Video, KHÔNG trừ Phút
```

### Flow 3: Admin kiểm tra Log
```
/admin/logs → Lọc theo ngày, theo user, theo action
→ Xem chi tiết từng dòng log (metadata JSON)
→ Export CSV nếu cần báo cáo
```

---

## 5. Acceptance Criteria & Test Cases

### TC-01: Đăng nhập Google OAuth
```
Given: User chưa đăng nhập, mở /login
When:  Bấm "Đăng nhập bằng Google"
Then:  ✓ Redirect sang Google → Quay lại /dashboard
       ✓ Session được tạo trong DB
       ✓ Sidebar hiển thị tên + avatar
```

### TC-02: Tạo Production + Trừ Quota
```
Given: User PRO (quota 60 video, đã dùng 15)
When:  Tạo Production mới (mediaGeneration=true)
Then:  ✓ API trả 202 Accepted
       ✓ used_video_count tăng từ 15 → 16
       ✓ BullMQ có 1 Job mới trong Queue
       ✓ Socket.IO emit "pipeline:step:started" step 1
```

### TC-03: Chặn khi hết Quota
```
Given: User FREE (quota 1 video, đã dùng 1)
When:  Cố tạo thêm Production
Then:  ✓ API trả 429 với error "QUOTA_EXCEEDED"
       ✓ Không tạo record Production trong DB
       ✓ Không thêm Job vào Queue
```

### TC-04: Chặn khi hết Slot Concurrent
```
Given: User PRO (3 slot, đang chạy 3 Production)
When:  Cố tạo thêm Production thứ 4
Then:  ✓ API trả 429 với error "CONCURRENT_LIMIT"
       ✓ UI hiện thông báo "Đang chạy 3/3 slot"
```

### TC-05: Webhook G-Labs cập nhật Pipeline
```
Given: Production đang ở Step 5 (Visual Generation)
When:  G-Labs POST webhook với status="success" + media_url
Then:  ✓ PipelineCheckpoint step 5 → status=SUCCESS
       ✓ outputData lưu media_url
       ✓ Socket.IO emit "pipeline:step:completed"
       ✓ Production.currentStep tăng lên 6
```

### TC-06: Client-side Muxing (FFmpeg.wasm)
```
Given: Production COMPLETED, user bấm "Tải Video Ghép"
When:  Browser fetch audio + video URLs → FFmpeg.wasm cắt/ghép
Then:  ✓ Progress bar hiển thị % xử lý
       ✓ File MP4 output có duration = audio duration
       ✓ Hộp thoại Save File xuất hiện
       ✓ RAM browser tự giải phóng sau khi save
```

### TC-07: Single Session Lock
```
Given: User đăng nhập trên Máy A
When:  User đăng nhập lại trên Máy B
Then:  ✓ Máy A bị kick (session expired)
       ✓ Chỉ Máy B có session hợp lệ
       ✓ AuditLog ghi nhận "session_replaced"
```

---

*Tạo bởi AWF 4.0 — Design Phase — RenmaeAI v2*
