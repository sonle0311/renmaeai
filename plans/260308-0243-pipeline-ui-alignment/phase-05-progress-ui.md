# Phase 05: Realtime Progress UI
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
User cần thấy pipeline đang chạy ở step nào, % bao nhiêu.
Backend đã emit Socket.IO events, FE cần lắng nghe và hiển thị.

## Tasks
- [ ] 1. Tạo `ProductionProgress` component
  - Hiển thị 7 steps với icon + status (pending/processing/done/failed)
  - Progress bar cho Step 3 (script generation) — có substeps
  - Real-time cập nhật qua Socket.IO
- [ ] 2. Tích hợp vào Kanban card — mở dialog khi click card đang processing
- [ ] 3. Hiển thị kết quả sau khi complete
  - Tab "Script": hiển thị generated script
  - Tab "Scenes": hiển thị danh sách scenes + VEO prompts
  - Download button cho script text
- [ ] 4. Error state — hiển thị lỗi thân thiện khi pipeline fail

## Files
- `apps/web/src/components/productions/progress.tsx` (mới)
- `apps/web/src/components/kanban/board.tsx` (sửa — thêm click handler)
- `apps/web/src/hooks/use-pipeline-socket.ts` (mới — Socket.IO hook)
