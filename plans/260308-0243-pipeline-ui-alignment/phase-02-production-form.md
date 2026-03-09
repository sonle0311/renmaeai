# Phase 02: Production Form Redesign
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Redesign form "Tạo Video" cho đúng flow pipeline v1:
- YouTube URL là đầu vào CHÍNH
- Script chỉ là tùy chọn nâng cao (cho user muốn tự viết)
- Inherit settings từ Project

## Hiện trạng (SAI)
```
Form hiện tại:
├── Tiêu đề (required)
├── Kịch bản / Prompt (trống — gây lỗi pipeline!)
├── YouTube URL (tùy chọn)
├── Ngôn ngữ (vi/en)
└── Gen Video checkbox
```

## Flow ĐÚNG
```
Form mới:
├── YouTube URL (chính) ← user dán link
├── Hoặc: Nhập script thủ công (accordion mở rộng)
├── Tiêu đề (auto-fill nếu có YouTube)
├── Ngôn ngữ (inherit từ Project, có thể override)
├── Gen Video toggle
└── Nút "Tạo Video" — validate: phải có URL HOẶC script ≥ 50 chars
```

## Tasks
- [ ] 1. Redesign `CreateProductionForm` theo flow mới
  - YouTube URL là input chính (nổi bật, to, rõ)
  - Script input trong accordion/collapsible "Nhập script thủ công"
  - Validation: phải có URL hoặc script ≥ 50 chars
- [ ] 2. Auto-fill title từ YouTube URL (gọi API lấy video title)
- [ ] 3. Inherit language + settings từ Project globalSettings
- [ ] 4. Show preview sau khi dán URL (thumbnail, title, duration)
- [ ] 5. Cập nhật API `POST /productions` — chấp nhận chỉ có youtubeUrl

## Files
- `apps/web/src/components/forms/create-production.tsx` (rewrite)
- `apps/api/src/modules/productions/productions.service.ts` (sửa validation)
