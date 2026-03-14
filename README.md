# 📽️ RenmaeAI — Next-Generation AI Video Production SaaS

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS 11](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**RenmaeAI** là nền tảng SaaS hiện đại giúp biến những ý tưởng thô, kịch bản hoặc link YouTube thành video chất lượng cao chỉ trong vài giây. Được xây dựng trên kiến trúc **Cloud-Hybrid**, RenmaeAI đẩy toàn bộ gánh nặng render video xuống trình duyệt người dùng (Client-side), mang lại tốc độ vượt trội và sự riêng tư tuyệt đối.

---

## ✨ Điểm Nổi Bật (Core Features)

Dưới đây là các nhóm tính năng chính mà người dùng trải nghiệm trên RenmaeAI:

### 🎬 1. Quy Trình Sản Xuất Video Tự Động (13 Bước)
- **YouTube Extract & Sync:** Dán link YouTube, tự động cào Transcript, Meta Tags, phân tích profile và văn phong kịch bản (Style Profile).
- **AI Scripting & Director:** AI phân rã kịch bản thành dòng thời gian cụ thể (Scenes), góc máy (Camera angles) và chuẩn bị các Prompt mô tả ảnh (VEO Prompts).
- **Studio-Quality Audio:** Tích hợp ElevenLabs sinh giọng đọc tự động theo kịch bản với độ mượt mà cao.
- **Reference Image Generator:** Tích hợp tạo hình nhân vật giữ tính nhất quán theo từng Scene.
- **Client-Side FFmpeg Render:** Trình kết xuất video chuyên dụng chạy bằng `ffmpeg.wasm` trực tiếp trên trình duyệt — ghép nối hình, tiếng, text mà không phải xếp hàng chờ Server.

### 🛡️ 2. Hệ Thống Dữ Liệu & Bảo Mật (Zero-Knowledge)
- **Bring Your Own Key (BYOK):** Người dùng có quyền thêm API Keys cá nhân. Nền tảng hoạt động như một công cụ biên dịch (Compiler) cá nhân, đảm bảo 100% tài nguyên người dùng tự kiểm soát.
- **Private Workspace:** Kịch bản gốc, Media Files và cấu hình Render thuộc sở hữu riêng tư.

### 💼 3. Hệ Sinh Thái Tiện Ích User & Quản Trị
- **Bảng Điều Khiển (Dashboard) Chuyên Sâu:** Giao diện *Telemetry* giám sát tài nguyên WebWorker, RAM hệ thống tại Local và tiến trình Frame Render theo thời gian thực thay vì các thanh Loading truyền thống.
- **Quản Trị Dự Án (Project & History Manager):** Lưu vết toàn bộ Lịch sử các bước sản xuất, tái sử dụng kịch bản cũ, Quản lý kho Media (Ảnh, Âm thanh).
- **Virtual Quota System:** Quản lý hạn mức sử dụng (Số phút/Số video) rõ ràng và minh bạch cho từng gói tài khoản (Membership / SaaS Subscriptions).

---

## 🛠️ Công nghệ cốt lõi (Tech Stack)

Hệ thống được xây dựng theo mô hình **Monorepo (Turborepo)** đảm bảo tính đồng nhất và dễ dàng mở rộng:

### Frontend (`apps/web`)
- **Next.js 15 (App Router):** Hiệu suất tối ưu, SEO friendly.
- **Shadcn UI + Tailwind CSS v4:** Giao diện được reskin tỉ mỉ, đồng bộ.
- **Framer Motion:** Hiệu ứng chuyển động mờ ảo, mượt mà.
- **FFmpeg.wasm & JSZip:** Xử lý media mạnh mẽ ngay tại Client.

### Backend (`apps/api`)
- **NestJS 11 (TypeScript):** Kiến trúc module vững chắc, bảo mật.
- **Prisma ORM:** Quản lý Database PostgreSQL mạnh mẽ.
- **Redis + BullMQ:** Hệ thống hàng đợi xử lý Pipeline hiệu quả.
- **Socket.IO:** Truyền tải dữ liệu thời gian thực.

---

## 🏗️ Cấu trúc dự án (Monorepo)

```text
renmaeai/
├── apps/
│   ├── web/          # Frontend Next.js 15
│   └── api/          # Backend NestJS 11 (Sắp triển khai)
├── packages/
│   ├── database/     # Prisma Schema & Shared Database Client
│   └── ui/           # Shared UI components (nếu có)
├── docs/             # Quy trình, Spec và Tài liệu thiết kế
└── docker-compose.yml # Cấu trúc Deployment Self-hosted
```

---

## 🚀 Bắt đầu nhanh (Getting Started)

### Yêu cầu hệ thống
- **Node.js:** >= 20.x
- **Docker & Docker Compose**
- **NPM:** >= 10.x

### Cài đặt cục bộ
1. **Clone dự án & Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Sao chép file `.env.example` thành `.env` và điền các thông số:
   ```bash
   cp .env.example .env
   ```

3. **Khởi tạo Database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Chạy Production/Development:**
   ```bash
   # Chạy Full-stack Development
   npm run dev
   ```

---

## 🗺️ Lộ trình phát triển (Roadmap)

- [x] **Phase 0:** Brainstorm & Chốt kiến trúc SaaS v2.
- [x] **Phase 1:** Thiết lập Monorepo & UI Foundation (Shadcn Reskin).
- [ ] **Phase 2:** Triển khai Core Pipeline (YouTube Extract & Script Gen).
- [ ] **Phase 3:** Tích hợp G-Labs Webhook & WebSockets.
- [ ] **Phase 4:** Hoàn mĩ hóa trình render FFmpeg.wasm.
- [ ] **Phase 5:** Launch Beta & Payment Integration (Polar.sh).

---

## 🛡️ Giấy phép (License)

Dự án này là tài sản riêng tư (**Private Property**). Mọi hành vi sao chép hoặc sử dụng trái phép đều bị nghiêm cấm.

---
🎨 **Designed with Visual Excellence by Antigravity**
📦 **Powered by RenmaeAI Engine**
