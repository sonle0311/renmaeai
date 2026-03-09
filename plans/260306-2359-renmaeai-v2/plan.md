# Plan: RenmaeAI v2 (Client-Side SaaS Architecture)
Created: 2026-03-06
Status: 🟡 In Progress

## Overview
Dự án nhằm tái cấu trúc RenmaeAI từ một ứng dụng Desktop (v1) cồng kềnh thành một Nền tảng SaaS Web-based (v2) linh hoạt, phi tập trung. Điểm mấu chốt là tích hợp 100% Bring-Your-Own-Key (BYOK) qua G-Labs Token, chuyển giao gánh nặng xử lý ghép video (Muxing bằng FFmpeg.wasm) và nén tệp tin (JSZip) về RAM/GPU của trình duyệt người dùng, giải cứu hoàn toàn băng thông và CPU của server máy chủ.

## Tech Stack
- Kiến trúc: **100% CLI-based** (Không dùng Boilerplate clone)
- Deployment: Docker Compose (VPS Self-Hosted)
- Frontend: Next.js 15 (App Router), TailwindCSS, **Shadcn/UI** + dnd-kit, JSZip, FFmpeg.wasm
- Backend: NestJS 11 (TypeScript), BullMQ + Redis, Socket.IO
- Database: PostgreSQL 15 (Prisma ORM)
- Auth & Payment: NextAuth.js (Auth.js v5), Polar.sh

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Setup Environment | ⬜ Pending | 0% |
| 02 | Database Schema | ⬜ Pending | 0% |
| 03 | Backend API & Queue | ⬜ Pending | 0% |
| 04 | Frontend UI & Auth | ⬜ Pending | 0% |
| 05 | Client-side Assembly (JSZip + FFmpeg.wasm) | ⬜ Pending | 0% |
| 06 | Testing & VPS Deployment | ⬜ Pending | 0% |

## Quick Commands
- Start Phase 1: `/code phase-01`
- Next Step: `/design` (để AI thiết kế DB Prisma và API)
- Check progress: `/next`
- Save context: `/save-brain`
