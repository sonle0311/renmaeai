# Plan: Pipeline UI Alignment — Fix Frontend ↔ Backend Flow
Created: 2026-03-08T02:43
Status: 🟡 In Progress

## Vấn đề
Frontend hiện tại KHÔNG khớp với pipeline v1 đã port. Form "Tạo Video" yêu cầu user nhập script thủ công,
nhưng pipeline thực tế lấy YouTube URL → tự extract transcript → AI viết lại.

## Phases

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 01 | Project Settings UI | ⬜ | 6 |
| 02 | Production Form Redesign | ⬜ | 5 |
| 03 | YouTube Transcript Extract | ⬜ | 4 |
| 04 | Pipeline Processor Fix | ⬜ | 3 |
| 05 | Realtime Progress UI | ⬜ | 4 |

## Quick Commands
- `/code phase-01`
- `/next`
