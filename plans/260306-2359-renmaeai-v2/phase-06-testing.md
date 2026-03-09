# Phase 06: Testing & VPS Deployment
Status: ⬜ Pending | 🟡 In Progress | ✅ Complete
Dependencies: [Phase 05: Client-side Assembly](phase-05-integration.md)

## Objective
Kiểm thử toàn diện tích hợp hệ thống Local (Web, API, DB, BullMQ, Trình Duyệt FFmpeg) và đưa dự án lên triển khai thực tế trên máy chủ ảo cá nhân (VPS) thông qua Docker Compose.

## Requirements
### Functional
- [ ] Xây dựng luồng Unit Test cơ bản ở NestJS cho logic Trừ Virtual Quota.
- [ ] E2E Test (Playwright/Cypress) để kiểm thử luồng gen video từ Frontend -> API -> BullMQ -> Webhook -> Socket -> Tải ZIP/MP4.
- [ ] Đóng gói Dockerfile riêng biệt cho `apps/web` (Next.js Standalone mode) và `apps/api` (NestJS prod build).
- [ ] Viết `docker-compose.prod.yml` chạy ổn định trên môi trường Linux Ubuntu.
- [ ] Tích hợp Reverse Proxy (Caddy/Traefik/Nginx) để cấp phát chứng chỉ HTTPS tự động (Let's Encrypt).

### Non-Functional
- [ ] Thiết lập Cloudflare Tunnel (ZRO Trust) hoặc thiết lập IP whitelist cho webhook của Flow2API/G-Labs trỏ thẳng vào Node API.
- [ ] Bảo đảm bảo mật: File `.env.production` không được push lên Git.
- [ ] Logs của Docker Compose phải được Rotate tránh đầy ổ cứng VPS.

## Implementation Steps
1. [ ] Step 1 - Viết Script test tổng hợp chạy toàn hệ thống Local.
2. [ ] Step 2 - Tạo `Dockerfile` tối ưu hóa (Multi-stage build) cho 2 thư mục `apps/web` và `apps/api`.
3. [ ] Step 3 - Thiết lập file `docker-compose.prod.yml` gắn Restart Policy (always).
4. [ ] Step 4 - Commit code lên Github private / Gitlab.
5. [ ] Step 5 - Truy cập VPS (SSH), git clone source code.
6. [ ] Step 6 - Tạo file `.env` thực tế trên Server. Cài đặt Caddyfile cấp SSL.
7. [ ] Step 7 - Khởi chạy `docker compose -f docker-compose.prod.yml up -d` và nghiệm thu.

## Files to Create/Modify
- `apps/web/Dockerfile` - Image UI build nhỏ gọn.
- `apps/api/Dockerfile` - Image API core.
- `docker-compose.prod.yml` - Phiên bản Docker Production Network.
- `Caddyfile` - Thiết lập SSL/TLS (nếu xài Caddy).

## Test Criteria
- [ ] Domain chính (VD: app.renmae.ai) truy cập được bằng HTTPS mượt mà.
- [ ] Webhook G-Labs bắn về Domain Production và cập nhật trạng thái UI Realtime chuẩn.
- [ ] Login, Settings Token, Render Video, Download ZIP/MP4 hoàn toàn nuột nà trên môi trường Prod.

## Notes
- Do có xử lý SharedArrayBuffer (FFmpeg wasm) ở Frontend, `Caddy` / `Nginx` Production **Bắt buộc** phải chèn headers:
  * `add_header Cross-Origin-Embedder-Policy require-corp;`
  * `add_header Cross-Origin-Opener-Policy same-origin;`

---
Kết thúc Kế hoạch Lập trình RenmaeAI v2 - Architectural Foundation.
