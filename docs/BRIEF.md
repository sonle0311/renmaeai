# 💡 BRIEF: RenmaeAI SaaS v2

**Ngày tạo:** 2026-03-04  
**Dựa trên source:** `docs/renmaeai/` (Desktop App v1 — Electron + React + Python FastAPI)  
**Cập nhật:** 2026-03-07 — Chốt kiến trúc Self-Hosted 100% (Docker Compose), Next.js 15 App Router + **Shadcn/UI**, Prisma, G-Labs Webhook, JSZip + FFmpeg.wasm Client-side & Virtual Quota. **100% CLI-based** (Không dùng Boilerplate clone).

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

### Hạn chế của Desktop App hiện tại (v1):

| Vấn đề | Chi tiết |
|--------|----------|
| **Cài đặt phức tạp** | User phải cài Python, Node.js, FFmpeg thủ công bảo trì mệt mỏi |
| **Bào mòn phần cứng** | Quá trình render Video 4K FFmpeg gây cháy RAM/CPU máy tính cá nhân. |
| **Không thể kinh doanh** | Không có payment, không có tính chia sẻ, không thể thu phí dịch vụ. |

### Hạn chế của mô hình Cloud đời đầu (Ý tưởng v2 sơ khai):
| Vấn đề | Chi tiết |
|--------|----------|
| **Nghẽn Server VPS** | VPS phải gánh việc tải hàng trăm file Media và dùng FFmpeg ghép Video. |
| **Phụ thuộc Ngrok cá nhân** | Ngrok của người dùng có thể tắt giữa chừng gây lỗi Timeout Job. |
| **Lãng phí Quota** | User chỉ muốn gen mỗi bộ Script và Prompt nhưng vẫn bị tính là 1 Video. |

### Core pain point cần giải quyết cho RenmaeAI v2:
> "Sáng tạo nội dung trên nền tảng Web siêu nhẹ, dùng nguồn tài nguyên AI vô hạn từ Token G-Labs cá nhân. Server chỉ làm nhiệm vụ quản lý, mọi gánh nặng kỹ thuật đẩy xuống Client-side."

---

## 2. GIẢI PHÁP ĐỀ XUẤT

**RenmaeAI SaaS v2** — Nền tảng **Web App thuần**, tự Host bằng Docker Compose trên VPS.

### Kiến trúc: Cloud SaaS + Token G-Labs (BYOK) + Client-side ZIP

1. **Backend (NestJS + Prisma + PostgreSQL):** Quản lý User, Subscription, Pipeline Queue (BullMQ) và tính toán Quota. Nhận Webhook từ G-Labs trả về để không bị kẹt tiến trình chờ.
2. **Frontend (Next.js 15 App Router):** Hiển thị Kanban Realtime bằng Socket.IO. Đảm nhiệm việc tải ảnh/audio tĩnh, **cắt/ghép Audio & Video bằng `ffmpeg.wasm`** và nén **thành file ZIP** trực tiếp trên RAM trình duyệt bằng JSZip (Giải phóng 100% sức ép băng thông/CPU cho VPS server).
3. **Mô hình AI Visual (Bỏ Stock Footage):** Sinh 100% hình ảnh/video bằng Veo3 / Midjourney qua cổng G-Labs Token do User tự cung cấp.

---

## 3. ĐỐI TƯỢNG SỬ DỤNG

| Nhóm | Mô tả | Nhu cầu |
|------|-------|---------|
| **Primary** | Content creator YouTube/Podcast | Tạo kịch bản và prompt AI tự động, lấy Asset về tự edit trên CapCut. |
| **Primary** | Dân cày MMO (Make Money Online) | Tận dụng Token G-Labs của họ để gen tự động số lượng lớn không giới hạn API. |
| **Secondary** | Agency làm Video | Bỏ tiền mua gói Business để chạy 10 video cùng lúc (Concurrent Pipelines). |

---

## 4. TÍNH NĂNG ĐÃ CÓ (Kế thừa từ v1 rút gọn)

Xoá bỏ hoàn toàn cơ chế Python. Viết lại bằng TypeScript (NestJS):

- ✅ YouTube transcript extract (lấy chữ từ video).
- ✅ Style analysis (Phân tích văn phong).
- ✅ Script generation (Lên kịch bản).
- ✅ Scene splitting (Cắt cảnh, lên Prompt Visual).
- ✅ TTS / Voice gen (ElevenLabs, Edge-TTS).

---

## 5. TÍNH NĂNG MỚI CHO v2 (Kiến trúc Mới nhất)

### 🚀 MVP (Bắt buộc có để launch):

| # | Feature | Lý do |
|---|---------|-------|
| 1 | **G-Labs Token Integration** | Cho phép nhập Token WebApp G-Labs vào Settings để gọi gen AI thoải mái không lo đứt Ngrok. |
| 2 | **Client-Side JSZip & FFmpeg.wasm** | Bỏ cơ chế FFmpeg gộp Video của server. Trình duyệt tự ghép Video/Audio đồng bộ thời gian bằng FFmpeg.wasm, sau đó nén ZIP cục bộ. |
| 3 | **Cơ chế Virtual Quota (Số phút & Số Video)** | Bán gói tiện ích (Pro = 60 video & 600 phút). Quản lý hao hụt chính xác. |
| 4 | **Luồng Gen Hỗn hợp & Thuần Text** | Nút tick: "Chỉ Sinh Kịch Bản (Bỏ qua Video)". Chỉ trừ Số Lượng, không trừ Phút. Slot queue giải phóng tức thì (3 giây). |
| 5 | **Concurrent Pipelines & Multi-Session Control** | Xử lý đa luồng theo hạn mức Gói Cước. Khoá phiên đăng nhập (Mỗi account 1 session) chống share acc. |
| 6 | **Webhook & Socket.IO Realtime** | Gọi API không chờ đợi (Async Webhooks). Tiến trình báo qua Socket bảo mật JWT. |
| 7 | **BullMQ Auto-Cleanup** | Dọn dẹp RAM VPS: Xóa job done, giới hạn 100 job failed. |
| 8 | **Audit Logs Dashboard** | Lưu toàn bộ log hành vi (trừ tiền, webhooks lỗi) vào Database PostgreSQL, Admin lọc trực quan. |
| 9 | **Rate Limiting (Chống Spam)** | Áp dụng Throttler để bảo vệ API Backend khỏi bị "bơm" request rác. |

---

## 6. TECH STACK ĐỀ XUẤT (Cập nhật 2026-03-07)

> ⚠️ **100% CLI-based** — Không sử dụng bất kỳ Boilerplate/Starter template clone nào. Tữ khởi tạo code sạch bằng CLI gốc của từng framework.

| Layer | Công nghệ | Lý do chọn |
|-------|---------|-----------|
| **Deployment** | **Docker Compose (VPS self-hosted)** | Độc lập hoàn toàn khỏi cloud, kiểm soát 100% dữ liệu. |
| **Backend** | **NestJS 11 (TypeScript)** | Khởi tạo bằng `nest new api`. Module, DI, Guards, Throttler. |
| **Frontend** | **Next.js 15 (App Router) + Shadcn/UI + dnd-kit + JSZip + FFmpeg.wasm** | Khởi tạo bằng `create-next-app`. Shadcn cho UI, dnd-kit cho Kanban, FFmpeg.wasm ghép video. |
| **Database/ORM**| **PostgreSQL 15 + Prisma** | Truy vấn siêu mạnh, Migrate an toàn. |
| **Authentication**| **NextAuth.js (Auth.js v5) + JWT** | Lưu phiên session vào Prisma, khóa Session chống share acc. |
| **Queue** | **BullMQ + Redis 7** | Siêu nhẹ, auto-clean `removeOnComplete`. |
| **Realtime** | **Socket.IO (JWT Token Room)** | Realtime nhẹ, Room cá nhân bảo mật Prompt. |
| **Payment** | **Polar.sh** | Subscriptions toàn cầu, Webhook gia hạn. |

---

## 7. PRICING ĐỀ XUẤT (VIRTUAL QUOTA)

> **Core Value:** User **trả tiền cho Công cụ tiện lợi (Nhà xưởng, Quản lý đa luồng)** chứ không trả tiền mua Token AI (Bản thân họ tự điền Token G-Labs).

### Subscription Plans (qua Polar.sh):

| Plan | Giá/tháng | Xử lý song song (Concurrent) | Mức Quota AI (Giới hạn tài nguyên) | Workflow |
|------|-----------|------------------------------|--------------------------------|---------|
| **Free** | $0 | 1 Slot luồng chạy (Tuần tự) | 1 Video/tháng \nMax: 5 Phút (Làm quen hệ thống) | Cơ bản |
| **Pro** | $19 | 3 Slot luồng chạy cùng lúc | 60 Video/tháng \nMax: 600 Phút (Dùng thả ga) | Đầy đủ |
| **Business** | $49 | 10 Slot luồng chạy cực mạnh | 250 Video/tháng \nMax: 5000 Phút (Content Factory)| Độc quyền |

> 🔑 **Lưu ý:** Nếu Gen "Chỉ Text", tốn cực ít Server CPU, nên không bị ăn lạm vào Quota phút. 

---

## 8. PIPELINE CHECKPOINT SYSTEM (G-Labs Webhook Flow)

```text
Pipeline = 7 bước độc lập, Lưu lịch sử an toàn tuyệt đối.

Step 1: Trích xuất YouTube    → ✅ Xong
Step 2: Phân tích Văn phong   → ✅ Xong
Step 3: Lên Kịch Bản          → ✅ Xong
Step 4: Cắt cảnh & Prompt     → ✅ Xong 
------------------------------------------------
(Rẽ nhánh nếu Chọn "Chỉ Gen Text" → 🚀 NHẢY THẲNG QUA BƯỚC 7)
------------------------------------------------
Step 5: Gửi Request API G-Labs kèm [Webhook URL] → NestJS giải phóng RAM, đi ngủ.
(Chờ rảnh rỗi...)
[G-Labs Webhook trả về JSON] → NestJS báo Socket.IO Update UI → ✅ Xong
Step 6: Voice TTS             → ✅ Xong
Step 7: Hoàn tất Database     → ✅ DONE → Đánh dấu Sẵn Sàng Tải Xuống
```

---

## 9. QUY TẮC RỦI RO & BẢO MẬT (Đã chốt)

1. **Bảo vệ RAM VPS:** Không dùng FFmpeg trên VPS. JSZip của Browser tự gánh việc Tải và Nén file. Redis dọn auto-clean.
2. **Kẻ gian xài ké Account:** NextAuth găm Session 1 máy. Login máy 2 sẽ khoá/kick máy 1. Quota cứng hàng tháng làm nản lòng những người "bơm ké".
3. **Bảo vệ Prompt/Idea:** Audit Logs chỉ lưu trạng thái lỗi, ID giao dịch, không lưu Raw Script vào Logs TXT. WebSocket mã hoá the Room JWT riêng tư.

---

## 10. BƯỚC TIẾP THEO (Khởi động Dev Mode)

```text
[✅] Brainstorm → Chốt BRIEF.md (Vững như bàn thạch)
[✅] /plan → Cập nhật Specs, Database, UI, Backend (Hoàn tất)
[✅] Chốt kiến trúc CLI-based: Next.js CLI + Shadcn/UI + NestJS CLI (Không Boilerplate)
[✅] /design → Thiết kế Prisma Schema, API Endpoints, UI Screens, Test Cases
[ ] /code → Triển khai Phase 1: Foundation (Docker Compose, Turborepo)
```
