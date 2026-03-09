# Phase 01: Project Setup
Status: ⬜ Pending | 🟡 In Progress | ✅ Complete
Dependencies: None

## Objective
Khởi tạo repo monorepo với Turborepo, cài đặt các service cơ bản như Next.js, NestJS và thiết lập môi trường bằng Docker Compose cho toàn bộ hệ thống v2 SaaS (Front-end, Back-end, Postgres, Redis).

## Requirements
### Functional
- [ ] Thiết lập hệ thống Turborepo chia packages dùng chung (e.g. database, lint, tsconfig).
- [ ] Khởi tạo 02 ứng dụng cốt lõi: `apps/web` (Next.js) và `apps/api` (NestJS).
- [ ] Thiết lập file `docker-compose.yml` tích hợp Postgres, Redis, NestJS, Next.js.
- [ ] Cài đặt Prisma ORM và khởi tạo Database Schema ban đầu.

### Non-Functional
- [ ] Môi trường Docker phải đồng bộ giữa Development (Hot-reloading) và Production (Standalone).
- [ ] Thiết lập chuẩn ESLint, Prettier và TypeScript strict mode cho toàn bộ monorepo.

## Implementation Steps
1. [ ] Step 1 - Chạy lệnh Turborepo khởi tạo repo trống.
2. [ ] Step 2 - Khởi tạo `apps/web` bằng **`create-next-app`** (Next.js 15) và cài đặt **Shadcn/UI** (dùng các Blocks để sinh code UI chuẩn SaaS).
3. [ ] Step 3 - Khởi tạo `apps/api` bằng NestJS CLI gốc (`nest new api`) hoàn toàn sạch sẽ không dùng Boilerplate.
4. [ ] Step 4 - Viết file cấu hình `docker-compose.yml` (`postgres:15`, `redis:7`).
5. [ ] Step 5 - Thiết lập `packages/database` chứa Prisma, tạo schema init và seed configs.
6. [ ] Step 6 - Tạo file `.env.example` cung cấp mẫu config cho việc local self-host.

## Files to Create/Modify
- `docker-compose.yml` - Khung sườn môi trường Docker.
- `apps/web/package.json` - Setup phụ thuộc của Front-end (UI).
- `apps/api/package.json` - Setup phụ thuộc của Back-end (API).
- `packages/database/prisma/schema.prisma` - Cấu trúc Database thô ban đầu.

## Test Criteria
- [ ] `docker compose up -d` khởi động 4 container (web, api, postgres, redis) mượt mà.
- [ ] `npm run dev` qua Turborepo chạy được Hot-reloading cho cả 2 Frontend và Backend.
- [ ] Backend có thể kết nối được Postgres (Prisma Migrate check OK).

## Notes
- Phase này là bước ĐÚNG TRỌNG TÂM DUY NHẤT để cài đặt tất cả các package NPM chủ chốt (BullMQ, FFmpeg.wasm, JSZip, NextAuth...).
- Prisma sẽ được đẩy thành một package riêng biệt (`packages/database`) để chia sẻ Types giữa Frontend và Backend, giúp dev Type-safe toàn diện.

---
Next Phase: [Phase 02: Database Schema](phase-02-database.md)
