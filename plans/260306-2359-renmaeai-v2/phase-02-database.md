# Phase 02: Database Schema & Authentication
Status: ✅ Complete
Dependencies: [Phase 01: Project Setup](phase-01-setup.md)

## Objective
Xây dựng khung xương dữ liệu bằng Prisma Schema cho toàn bộ 5 models chính (Users, Projects, Productions, PipelineCheckpoints, AuditLogs) và viết luồng Đăng nhập, Đăng ký qua NextAuth.js lưu phiên vào DB.

## Requirements
### Functional
- [x] Thiết kế Prisma Schema chuẩn 100% dựa theo bảng Design của tài liệu [renmaeai_v2_spec.md](../../specs/renmaeai_v2_spec.md).
- [x] Implement NextAuth.js (v5/Auth.js) ở Frontend để quản lý Authenticate State và Session Security.
- [x] Cấu hình Prisma Adapter cho NextAuth.
- [x] User Register/Login bằng Email (Magic Link) hoặc Google OAuth.
- [x] Cập nhật bảng User để lưu trữ Token BYOK (G-Labs).

### Non-Functional
- [x] Bảo mật JWT: Token Session chia sẻ an toàn giữa Next.js và NestJS qua Header Authorization.
- [x] Đánh Index Prisma (`@index`) tối ưu việc query Logs/Pipelines tốc độ cao.

## Implementation Steps
1. [x] Step 1 - Viết file `schema.prisma`. 
2. [x] Step 2 - Chạy `npx prisma migrate dev --name init` tạo Database lên Postgres Docker.
3. [x] Step 3 - Cài đặt NextAuth.js vào dự án `apps/web`.
4. [x] Step 4 - Xây dựng trang Login UI (`/login`).
5. [x] Step 5 - Xây dựng trang Settings UI (`/settings`) để user nhập G-Labs Token lưu vào Postgres.
6. [x] Step 6 - Setup Guard ở backend NestJS để Verify JWT từ phía Frontend gửi sang.

## Files to Create/Modify
- `packages/database/prisma/schema.prisma` - Khung sườn dữ liệu v2.
- `apps/web/app/api/auth/[...nextauth]/route.ts` - NextAuth logic.
- `apps/web/app/(auth)/login/page.tsx` - Giao diện Đăng nhập.
- `apps/api/src/auth/jwt.strategy.ts` - NestJS check Auth.

## Test Criteria
- [x] Đăng nhập thành công, Frontend hiển thị Session User.
- [x] Người dùng có thể lưu Token G-Labs qua UI và dữ liệu ghi chuẩn vào PrismaDB.
- [x] NestJS từ chối các Request gọi API (HTTP 401) nếu không kèm bearer Token.

## Notes
- `ai_settings` của User Account trong Schema cần được định dạng kiểu `Json` để tiện mở rộng các Token AI của hãng khác trong tương lai ngoài G-Labs.

---
Next Phase: [Phase 03: Backend API & Queue](phase-03-backend.md)
