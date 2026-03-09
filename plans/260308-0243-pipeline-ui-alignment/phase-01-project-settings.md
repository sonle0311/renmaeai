# Phase 01: Project Settings UI
Status: ⬜ Pending
Dependencies: None

## Objective
Project cần lưu các cài đặt pipeline (channelName, styleA, narrativeVoice, targetWordCount...)
trong `globalSettings` JSON. Cần UI để user config trước khi tạo production.

## Hiện trạng
- `Project.globalSettings` tồn tại (Json?) nhưng CHƯA có UI nào dùng
- Pipeline processor đã đọc `globalSettings` → OK
- Thiếu form để user configure project settings

## Tasks
- [ ] 1. Tạo component `ProjectSettingsForm` — form config pipeline
  - Các field: `channelName`, `language`, `sourceLanguage`, `targetWordCount`, `narrativeVoice`, `storytellingStyle`, `country`, `dialect`
  - Lưu vào `project.globalSettings` qua API `PATCH /projects/:id`
- [ ] 2. Tạo tab "Cài đặt" trong trang project detail (`/projects/[id]`)
  - Tab 1: Kanban Board (productions) — hiện tại
  - Tab 2: Cài đặt Project (mới)
- [ ] 3. Tạo component `StyleAnalyzer` — UI để user paste script mẫu cho AI phân tích Style DNA
  - Gọi AI (BYOK) phân tích → lưu vào `globalSettings.styleA`
  - Hiển thị kết quả styleA: tone, hookStyle, pacing, etc.
- [ ] 4. Thêm 11 ngôn ngữ vào language selector (hiện chỉ có vi/en)
- [ ] 5. Thêm select cho narrativeVoice (first/second/third person + custom)
- [ ] 6. Thêm select cho storytellingStyle (immersive/documentary/conversational/analytical/narrative)

## Files
- `apps/web/src/components/forms/project-settings.tsx` (mới)
- `apps/web/src/components/forms/style-analyzer.tsx` (mới)
- `apps/web/src/app/(app)/projects/[id]/page.tsx` (sửa — thêm tabs)
