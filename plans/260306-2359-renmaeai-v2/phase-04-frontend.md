# Phase 04: Frontend UI & Kanban
Status: ✅ Complete
Dependencies: [Phase 03: Backend API & Queue](phase-03-backend.md)

## Objective
Xây dựng giao diện Web App cho RenmaeAI v2 bằng Next.js 15 (App Router). Trọng tâm bao gồm trang Dashboard dự án, Kanban Board hiển thị tiến độ render Realtime, và trang Settings cho phép cấu hình Token G-Labs.

## Requirements
### Functional
- [x] Giao diện Layout Sidebar + Topbar sử dụng **Shadcn/UI Blocks** (Sidebar Layout chuẩn SaaS) chia theo các Module (Dự án, Pipeline, Settings, Lịch sử).
- [x] Màn hình Settings nhập `API Key` hoặc `G-Labs Token` (BYOK).
- [x] Xây dựng Kanban Board kéo thả bằng **dnd-kit** + Shadcn Card hiển thị 7 cột Tiến trình, lắng nghe sự kiện qua WebSocket (Socket.IO React).
- [x] Form Input Text đa năng cho phép nạp Script/Prompt, chọn Ngôn ngữ, tick chọn "Chỉ Gen Text".

### Non-Functional
- [x] Giao diện thiết kế theo chuẩn **TailwindCSS + Shadcn/UI** (có Dark Mode / Light Mode toggle).
- [x] Mọi Request API giao tiếp với NestJS đều tự động đính kèm Bearer JWT Token của NextAuth thông qua Axios Interceptor (hoặc Fetch Wrapper).
- [x] Áp dụng Next.js Server Actions cho các tác vụ SSR nhằm SEO và bảo mật đầu cuối.

## Implementation Steps
1. [x] Step 1 - Cấu hình Provider cho Socket.IO Client trên Layout Root của Next.js.
2. [x] Step 2 - Xây dựng trang Dashboard quản lý Dự Án (Projects).
3. [x] Step 3 - Xây dựng Kanban Board hiển thị Component Card Video (Productions). Cấu hình Listen Events từ Socket.IO.
4. [x] Step 4 - Viết Hook quản lý trạng thái Tải về (`useDownloader`).
5. [x] Step 5 - Xây trang Settings cho phép User cập nhật thông tin Token vào Postgres thông qua API.
6. [x] Step 6 - Giao diện dành cho Admin xem Audit Logs (Xây Table hiển thị Grid dữ liệu Lỗi/Quota DB).

## Files to Create/Modify
- `apps/web/app/dashboard/page.tsx` - Giao diện Projects.
- `apps/web/components/kanban/Board.tsx` - Bảng Pipeline 7 bước.
- `apps/web/components/providers/SocketProvider.tsx` - Socket Client Config.
- `apps/web/app/settings/page.tsx` - Form Config Token cá nhân.

## Test Criteria
- [x] Chuyển tab Sidebar mượt mà không load lại trang.
- [x] Bấm Nạp Video -> Call POST NestJS -> Nhận Event Socket.IO báo thành công tức thời và Thẻ Kanban nhảy sang cột "Processing".
- [x] Audit Logs hiển thị List dữ liệu 100 dòng phân trang hoạt động tốt.

## Notes
- Toàn bộ Component UI cơ sở (Buttons, Inputs, Modals, Tables, Forms) sử dụng **Shadcn/UI** (copy-paste component sinh từ CLI `npx shadcn-ui@latest add [component]`). Kanban Board dùng **dnd-kit** cho kéo thả.

---
Next Phase: [Phase 05: Client-side Assembly (JSZip + FFmpeg.wasm)](phase-05-integration.md)
