# Phase 04: Pipeline Processor Data Flow Fix
Status: ⬜ Pending
Dependencies: Phase 03

## Objective
Đảm bảo dữ liệu chạy đúng qua tất cả 7 steps:
URL → Extract → Style → Script → Scenes → Media → TTS → Finalize

## Tasks
- [ ] 1. Fix Step 1: Đọc đúng nguồn script
  - Priority: youtubeUrl extract > inputScript > project.globalSettings.script
  - Lưu `workingScript` vào outputData cho steps sau
- [ ] 2. Fix Step 3: Đọc script từ outputData (không query lại DB)
  - Script phải lấy từ Step 1 outputData, không từ production.inputScript
- [ ] 3. VEO prompt generation integration
  - Sau Step 4 (scene splitting), tự động gọi VeoPromptService
  - Lưu veoPrompt vào mỗi scene trong outputData

## Files
- `apps/api/src/modules/queue/pipeline.processor.ts` (sửa data flow)
