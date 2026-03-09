# Phase 05: Client-side Assembly (JSZip + FFmpeg.wasm)
Status: ⬜ Pending | 🟡 In Progress | ✅ Complete
Dependencies: [Phase 04: Frontend UI & Kanban](phase-04-frontend.md)

## Objective
Thực thi cơ chế độc quyền của kiến trúc v2: WebAssembly Video Muxer. Thay vì server ghép video như v1, Trình duyệt của người dùng sẽ sử dụng `ffmpeg.wasm` để tự đo lường độ dài Audio (ElevenLabs/Edge), cắt đuôi thừa của Veo3 Video và trộn lại thành bản MP4 hoàn chỉnh. Toàn bộ files xuất ra cũng được nén thành `.zip` bằng `JSZip` tại ngay trình duyệt.

## Requirements
### Functional
- [ ] Cài đặt `ffmpeg.wasm` sử dụng Web Worker để không chặn (Block) luồng UI của UI Next.js.
- [ ] Khi người dùng bấm "Tải Video Ghép", hệ thống Fetch các file `.mp3` và `.mp4` tĩnh về RAM của trình duyệt.
- [ ] Parse độ dài tệp Audio bằng `new Audio().duration`.
- [ ] Gửi lệnh Terminal FFMPEG thu gọn video đầu vào theo thời lượng âm thanh và nén (Mix).
- [ ] Tích hợp `JSZip` cho những user tick chọn "Tải Tệp Rời".

### Non-Functional
- [ ] File MP4 Render ra không được phép dính Watermark FFmpeg.wasm.
- [ ] Khi FFmpeg.wasm xử lý, Frontend phải có biểu đồ Progress % rõ ràng cho User (Progress Event Listender).
- [ ] Đảm bảo dọn dẹp bộ nhớ RAM (garbage collection) của Trình duyệt sau khi người dùng bấm Lưu file thành công.

## Implementation Steps
1. [ ] Step 1 - Cài đặt gói NPM `@ffmpeg/ffmpeg`, `@ffmpeg/util` và `jszip` vào `apps/web`.
2. [ ] Step 2 - Tạo file `worker.js` chuyên dụng phục vụ Wasm.
3. [ ] Step 3 - Viết module `clientAssemble.ts`: Chứa luồng Fetch -> Đo Duration -> Cắt Video (Cú pháp `-t`).
4. [ ] Step 4 - Viết hàm ghép Media vào MP4 gốc.
5. [ ] Step 5 - Tích hợp Progress Bar component hiển thị khi user Click nút Download ở UI Kanban.
6. [ ] Step 6 - Tích hợp luồng tạo file ZIP (chứa Folder Scene_1, Scene_2...) xuất trực tiếp qua FileSaver.js.

## Files to Create/Modify
- `apps/web/lib/utils/ffmpeg-worker.ts` - Định nghĩa Thread xử lý FFmpeg Local.
- `apps/web/lib/utils/archiver.ts` - Nén File tĩnh (JSZip).
- `apps/web/hooks/useVideoMuxer.ts` - Custom Hook xử lý tín hiệu nút Download.
- `apps/web/next.config.js` - Sửa headers Cross-Origin Isolation để hỗ trợ SharedArrayBuffer cho WebAssembly FFmpeg.

## Test Criteria
- [ ] Khởi chạy lệnh Test: Bấm "Tải Video Ghép" -> Giao diện hiện "Preparing..." -> 15 giây sau bung ra hộp thoại Save File MP4 dài xấp xỉ 6 giây (Khớp chuẩn audio) trên máy tính người dùng.
- [ ] Bấm "Tải Tệp ZIP" -> File nén tải xuống tức thời gồm list các Folder tách biệt.
- [ ] RAM Task Manager của trình duyệt Google Chrome tăng cao lúc xử lý và tự Clear sụt xuống bình thường (Tối ưu Memory Leak).

## Notes
- *Bắt buộc cấu hình Headers HTTP của Next.js*: `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp` trong `next.config.js` thì WebAssembly `ffmpeg.wasm` mới chạy được tính năng Multi-thread. Chú ý kẻo vướng lỗi CORS vặt.

---
Next Phase: [Phase 06: Testing & VPS Deployment](phase-06-testing.md)
