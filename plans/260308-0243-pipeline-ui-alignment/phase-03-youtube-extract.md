# Phase 03: YouTube Transcript Extraction
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Implement Step 1 trong pipeline: tự động lấy transcript từ YouTube URL.
Đây là tính năng CỐT LÕI — nếu không có thì pipeline vô dụng.

## Options cho YouTube transcript
1. **youtube-transcript** npm package (miễn phí, không cần API key)
2. **YouTube Data API v3** (cần Google API key, 10,000 quota/ngày)
3. **yt-dlp** subprocess (mạnh nhất, cần install riêng)

→ Recommend: Option 1 (`youtube-transcript`) cho MVP, fallback sang yt-dlp nếu fail.

## Tasks
- [ ] 1. Install + tạo `youtube-extract.service.ts`
  - Lấy transcript (captions/subtitles) từ YouTube URL
  - Lấy metadata (title, description, duration, thumbnail)
  - Handle: video không có caption → báo lỗi rõ ràng
- [ ] 2. Cập nhật `pipeline.processor.ts` Step 1
  - Nếu có `youtubeUrl` + không có `inputScript` → gọi extract service
  - Lưu transcript vào `outputData.extractedScript`
  - Lưu metadata vào `outputData.youtubeMetadata`
- [ ] 3. Cập nhật Step 3 (Script Engine) — dùng extracted script
  - `originalScript = outputData.extractedScript || production.inputScript`
- [ ] 4. Error handling + fallback
  - Video private/unavailable → lỗi thân thiện
  - Không có captions → gợi ý user nhập script thủ công

## Files
- `apps/api/src/modules/pipeline/youtube-extract.service.ts` (mới)
- `apps/api/src/modules/queue/pipeline.processor.ts` (sửa Step 1)
- `apps/api/src/modules/queue/queue.module.ts` (thêm service)
