# 💡 BRIEF: Full Pipeline Overhaul — Prompt Generation System

**Ngày tạo:** 2026-03-09
**Brainstorm session:** Pipeline & Prompt Gen alignment with V1 core

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

V2 pipeline hiện tại **thiếu 10 steps** so với V1, khiến:
- Video prompts chất lượng thấp (không có AI Director, không có direction analysis)
- VEO I2V/Scenebuilder mode **không hoạt động** (thiếu Entity + Reference prompts)
- Không có character/environment consistency giữa các cảnh
- Không có image prompts để tạo ảnh thay thế stock footage (mục tiêu core của V2)
- TTS chạy **sau** visual prompts (sai thứ tự, không tận dụng parallel processing)

## 2. GIẢI PHÁP ĐỀ XUẤT

**Full Pipeline Overhaul (Option B)** — Refactor pipeline.processor.ts từ 7 steps → 13 steps, port logic từ V1 Python → V2 NestJS/TypeScript, đồng thời redesign UI để hỗ trợ user review/edit prompts.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Primary:** Content creators dùng RenmaeAI SaaS để tạo video tự động
- **Secondary:** Developers maintain/extend hệ thống

---

## 4. PHÂN TÍCH V1 → V2

### V1 Full Pipeline (12 steps — verified from submodule)
```
Step  1: Script Remake (12-step AI)
Step  2: Scene Splitting
Step  3: Voice TTS ← CHẠY TRƯỚC visual!
Step 3a: Build 8s Video Segments (từ voice durations)
Step 3.5: YouTube Metadata
Step 3b: Concept Analysis (AI Director)
Step  4: Keyword Generation
Step  5: Video Direction Analysis (6 pillars + tags) ← STEP MỚI
Step  6: Video Prompts (4 VEO modes: T2V/I2V/F&LF/SB)
Step  7: Entity Extraction
Step  8: Reference Image Prompts (character sheets)
Step  9: Scene Builder Image Prompts ([Name] tokens)
Step 10: Video Assembly
Step 11: SEO Data
Step 12: Export
```

### V2 Current Pipeline (7 steps)
```
Step 1: YouTube Extract       ✅
Step 2: Style Analysis        ✅
Step 3: Script Gen            ✅
Step 4: Scene Splitting       ✅
Step 5: VEO Prompt Gen        ⚠️ Hardcoded scenebuilder, no direction/entities
Step 6: Voice TTS             ✅
Step 7: Finalize              ✅
```

### Gap Summary
| Missing Component | Why Critical |
|-------------------|-------------|
| Concept Analysis (AI Director) | Genre/arc/character context cho tất cả prompts |
| Build 8s Video Segments | Audio-video sync (VEO luôn tạo 8s) |
| Video Direction Analysis | 6-pillar cinematography → prompts có chiều sâu |
| Entity Extraction | Consistency characters/environments across scenes |
| Reference Image Prompts | Character sheets cho VEO I2V mode |
| Scene Builder Image Prompts | Scene blueprints cho VEO Scenebuilder mode |
| VEO Mode Selection | 4 modes nhưng hardcoded 1 mode |
| Image Prompt Mode Selection | 3 modes (reference/scene_builder/concept) |
| Visual Context Inputs | Main character, environment, style theme |

---

## 5. TÍNH NĂNG

### 🚀 MVP (Full Overhaul Scope)

#### Backend Services (NestJS)
- [ ] `ConceptAnalysisService` — AI Director: genre, emotional_arc, character_phrase, key_moments
- [ ] `VideoDirectionService` — 6-pillar direction analysis per scene
- [ ] `EntityExtractionService` — Scan video prompts → recurring characters/envs/props
- [ ] `ReferencePromptService` — Character sheet + context sheet prompts
- [ ] `SceneBuilderPromptService` — Static scene images with [Name] entity tokens
- [ ] `VideoSegmentService` — Build 8s segments from TTS durations
- [ ] Refactor `VeoPromptService` — Support 4 VEO modes (T2V/I2V/F&LF/SB)
- [ ] Refactor `pipeline.processor.ts` — 13 steps, correct order, parallel Audio/Visual tracks

#### Data Structures
- [ ] Extend `ProjectSettings` — add `visualTheme`, `characterDescriptions`, `environmentDescription`
- [ ] Extend `ProductionOutputData` — add entities, referencePrompts, sceneBuilderPrompts, directionNotes, conceptAnalysis, veoMode, imagePromptMode
- [ ] Pipeline Job Data — add `imagePromptMode`, `emotionalArc`, `genreBlock`, `characterPhrase`, `keyMoments`

#### Frontend (Next.js)
- [ ] VEO Mode Selector component (T2V/I2V/F&LF/SB) in create-production
- [ ] Image Prompt Mode Selector (reference/scene_builder/concept) in create-production
- [ ] Visual Context inputs (main character, environment, style theme)
- [ ] Updated `progress.tsx` — show all 13 steps with correct grouping
- [ ] Updated `use-pipeline-socket.ts` — handle new step events

#### Socket.IO Events
- [ ] New events: `step:concept_analysis`, `step:video_direction`, `step:entity_extraction`, `step:reference_prompts`, `step:scene_builder_prompts`, `step:video_segments`

### 🎁 Phase 2 (Làm sau)
- [ ] Prompt Editor UI — review, edit, re-generate, approve prompts before saving
- [ ] Entity Browser — visual display of extracted characters/environments/props
- [ ] Direction Tags Viewer — show [SET|ILL|MS|dolly_in|warm_golden|calm] tags per scene
- [ ] Compliance Results UI — show prompt safety check details
- [ ] YouTube Metadata / SEO step
- [ ] Client-side FFmpeg.wasm video assembly
- [ ] ZIP export

### 💭 Backlog
- [ ] Per-scene VEO mode override (different mode per scene)
- [ ] Manual entity editing before reference prompt gen
- [ ] Prompt version history (track edits)
- [ ] A/B prompt comparison

---

## 6. THIẾT KẾ KỸ THUẬT SƠ BỘ

### Proposed V2 Pipeline (13 Steps, 4 Phases)

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE A: INPUT & ANALYSIS (Sequential)                        │
├──────┬──────────────────────────────────────────────────────────┤
│  1   │ 📥 YouTube Extract                                      │
│  2   │ 🎨 Style Analysis                                       │
│  3   │ 📝 Script Gen (12-step AI)                              │
│  4   │ ✂️  Scene Splitting                                      │
│  5   │ 🧠 Concept Analysis (AI Director)                       │
├──────┼──────────────────────────────────────────────────────────┤
│  PHASE B: AUDIO TRACK (After Step 4, parallel with Phase C)    │
├──────┼──────────────────────────────────────────────────────────┤
│  6   │ 🗣️  Voice TTS                                           │
│  6a  │ 🎬 Build 8s Video Segments                              │
├──────┼──────────────────────────────────────────────────────────┤
│  PHASE C: VISUAL TRACK (After Step 5, parallel with Phase B)   │
├──────┼──────────────────────────────────────────────────────────┤
│  7   │ 🎬 Video Direction Analysis (6 pillars)                 │
│  8   │ 📹 Video Prompt Gen (VEO: T2V/I2V/F&LF/SB)             │
│  9   │ 👤 Entity Extraction                                    │
│ 10   │ 🖼️  Reference Image Prompts                              │
│ 11   │ 🎨 Scene Builder / Concept Image Prompts                │
├──────┼──────────────────────────────────────────────────────────┤
│  PHASE D: FINALIZE (Needs both Audio + Visual)                 │
├──────┼──────────────────────────────────────────────────────────┤
│ 12   │ 📊 YouTube Metadata / SEO                               │
│ 13   │ 📦 Finalize + Export                                     │
└──────┴──────────────────────────────────────────────────────────┘
```

### Key V1 Logic to Port

#### 1. Concept Analysis (AI Director)
- Input: `finalScript`
- Output: `{ genre, emotional_arc: { act_1, act_2, act_3 }, genre_block, character_phrase, key_moments }`
- Feeds into: Steps 7, 8 (Direction + Video Prompts)

#### 2. Video Direction Analysis
- Input: `scenes[]` + `style` + `AI Director context`
- Process: 6-pillar decomposition per scene (Subject, Action, Environment, Camera, Lighting, Audio)
- Output: `{ scene_id, direction_notes, tags: [NARRATIVE_ROLE|VOICEOVER_REL|SHOT|MOVEMENT|LIGHT|EMOTION] }`
- Voiceover Relationship: ILL (Illustrate), CTR (Counterpoint), AMP (Amplify), FSH (Foreshadow), REV (Reveal)
- Narrative Role: SET, FSH, CLX, TWS, REV, RES
- Batch size: 25 scenes per AI call

#### 3. Video Prompts (4 VEO Modes)
- T2V (Text-to-Video): 80-120 words, full self-contained description
- I2V (Ingredients-to-Video): 60-90 words, action + physics + camera only
- F&LF (First & Last Frame): 40-60 words, transition between frames
- SB (Scenebuilder): 50-120 words, extend/jump_to with Character Bible

#### 4. Entity Extraction
- Input: all video prompts + original script scenes
- Process: AI scans for recurring entities (≥2 appearances)
- Output: `[{ name, type: character|environment|prop, description, scene_ids, count }]`
- Names: CamelCase, min 3 chars, extracted from script

#### 5. Reference Image Prompts
- Characters: 3-panel sheet (front + back + detail grids)
- Environments: establishing shot + multi-angle views + detail panels
- Props: hero view + orthographic views + detail close-ups
- I2V mode: limit to max 3 entities (1 char + 1 env + 1 prop)
- Word count: 120-180 per entity prompt

#### 6. Scene Builder Image Prompts
- Input: video prompts + entities + direction notes
- Process: Generate STATIC scene images with [Name] tokens
- Output: `{ scene_id, scene_builder_prompt }` per scene
- Rules: Edge-to-edge, style lock, 40-60 words
- F&LF mode: adds N+1 "final frame" scene

### Dependency Chain
```
scenes[] ──→ TTS ──→ 8s Segments ──→ ┐
    │                                  │
    └──→ Concept Analysis              │
              │                        │
              ├──→ Direction Analysis   ├──→ Finalize
              │        │               │
              └──→ Video Prompts       │
                       │               │
                  Entity Extraction    │
                       │               │
                  Ref Image Prompts ──→┘
                       │
                  Scene Builder ──────→┘
```

---

## 7. ƯỚC TÍNH SƠ BỘ

### Độ phức tạp: ⚠️ PHỨC TẠP (nhiều tuần)

| Component | Effort | Files affected |
|-----------|--------|---------------|
| 6 new backend services | 3-4 days | 6 new files in `modules/pipeline/` |
| Refactor `pipeline.processor.ts` | 2-3 days | 1 major file |
| Data structures update | 1 day | types, interfaces, socket events |
| Frontend UI updates | 2-3 days | create-production, progress, hooks |
| Testing & integration | 2-3 days | E2E pipeline testing |
| **Total** | **~10-14 days** | |

### Rủi ro
- **Prompt quality regression** — Porting from Python to TypeScript may change prompt formatting
- **AI token cost** — More steps = more Gemini API calls per production
- **Socket event complexity** — 13 steps means more real-time events to manage
- **Backward compatibility** — Existing productions need to handle old data format

---

## 8. BƯỚC TIẾP THEO

→ Chạy `/plan` để tạo task list chi tiết cho từng phase:
  1. Backend services implementation order
  2. Pipeline processor refactor plan
  3. Data structure changes
  4. Frontend component updates
  5. Testing strategy
