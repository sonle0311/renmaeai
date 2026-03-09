# Phase 03: Backend API & Queue (BullMQ)
Status: ⬜ Pending | 🟡 In Progress | ✅ Complete
Dependencies: [Phase 02: Database Schema & Authentication](phase-02-database.md)

## Objective
Xây dựng "Trái tim" của hệ thống xử lý (NestJS). Khởi tạo luồng Queue bằng BullMQ để đảm nhận việc gọi Webhook của hệ thống sinh AI G-Labs và quản lý các luồng (Pipeline Checkpoints) không bị chồng chéo.

## Requirements
### Functional
- [ ] Viết API tạo dự án (`POST /projects`) và tạo Video (`POST /productions`).
- [ ] Khởi tạo BullMQ Queue Worker trong NestJS nhận Job sinh Video nội dung text. 
- [ ] Tích hợp logic Tính toán và Trừ Quota ảo (Virtual Quota) cho User mỗi khi queue thành công.
- [ ] Cài đặt Rate Limit (Throttler) chống spam request.
- [ ] Tạo module nhận Webhook trả về từ G-Labs API.

### Non-Functional
- [ ] BullMQ phải được code chuẩn để hỗ trợ Multi-session theo Gói Cước (VD: Gen 3 video cùng lúc). Chế độ Clean auto xoá job khi xong.
- [ ] Trạng thái mỗi bước của tiến trình (1-7) phải được phát Realtime qua Socket.IO.
- [ ] Ghi lại mọi giao dịch/lỗi tiến trình vào Database `audit_logs`.

## Implementation Steps
1. [ ] Step 1 - Cấu hình NestJS BullMQ kết nối vào Redis Docker.
2. [ ] Step 2 - Viết API CRUD cho Projects và Productions (Gắn Prisma Service).
3. [ ] Step 3 - Xây module Queue: Chia các steps logic gen (Scripts, Gen Prompts, Voice...).
4. [ ] Step 4 - Viết API Webhook Inbound để đón kết quả gen Video Veo3 trả về từ G-Labs.
5. [ ] Step 5 - Tích hợp Socket.IO Gateway để push Event sang Frontend.
6. [ ] Step 6 - Xây Throttler Guard giới hạn tốc độ Request.

## Files to Create/Modify
- `apps/api/src/modules/production/production.service.ts` - Xử lý Video tiến trình.
- `apps/api/src/modules/queue/ai.processor.ts` - Worker gửi job cho G-Labs.
- `apps/api/src/modules/webhook/webhook.controller.ts` - Nhận tín hiệu Render xong.
- `apps/api/src/modules/realtime/socket.gateway.ts` - Gửi tiến độ (% hoàn thành) cho web user.

## Test Criteria
- [ ] Gọi POST tạo video thành công, Database trừ đi 1 Slot Quota của User.
- [ ] BullMQ chạy Job ngầm hiển thị log OK trên Terminal. NestJS không bị treo Request (Trả về HTTP 202 Accepted ngay lập tức).
- [ ] Giả lập G-Labs bắn Webhook tới NestJS thành công, Socket.IO nảy thông báo lên Desktop.

## Notes
- Toàn bộ logic cắt Scene dựa theo Audio TTS phải được cấu trúc ở bước này trong `queue` để truyền chuẩn Parameter ra Webhook.

---
Next Phase: [Phase 04: Frontend UI & Auth](phase-04-frontend.md)
