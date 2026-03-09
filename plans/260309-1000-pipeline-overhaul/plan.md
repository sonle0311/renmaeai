# Plan: Full Pipeline Overhaul — V1 Parity + V2 Architecture
Created: 2026-03-09 10:00
Status: 🟡 In Progress
Brief: `docs/BRIEF_pipeline_overhaul.md`

## Overview
Refactor V2 pipeline từ 7 steps → 13 steps để đạt parity với V1 core logic.
Port Python backend logic → TypeScript NestJS services, giữ lại BullMQ + Prisma + Socket.IO architecture.

## Tech Stack
- Backend: NestJS + BullMQ + Prisma + Socket.IO
- Frontend: Next.js 15 + shadcn/ui + Sonner toast
- AI: Gemini API via Flow2API
- V1 Reference: `docs/renmaeai/` (git submodule)

## Phases

| Phase | Name | Status | Progress | Est. |
|-------|------|--------|----------|------|
| 01 | Data Structures & Types | ✅ Complete | 100% | 0.5 day |
| 02 | Backend Services (6 new) | ✅ Complete | 100% | 3 days |
| 03 | Pipeline Processor Refactor | ✅ Complete | 100% | 2 days |
| 04 | Frontend UI Updates | ✅ Complete | 100% | 2 days |
| 05 | Integration & Socket Events | ✅ Complete | 100% | 1 day |
| 06 | Testing & Polish | 🟡 In Progress | 50% | 1.5 days |

## Dependency Chain
```
Phase 01 (Types) → Phase 02 (Services) → Phase 03 (Processor)
                                              ↓
Phase 01 (Types) → Phase 04 (Frontend) → Phase 05 (Integration)
                                              ↓
                                         Phase 06 (Testing)
```

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
