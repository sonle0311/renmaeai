# Phase 02: Backend Services (6 New Services)
Status: ⬜ Pending
Dependencies: Phase 01 (Data Structures)

## Objective
Tạo 6 NestJS services mới, port logic từ V1 Python → TypeScript.
Mỗi service là 1 injectable class, gọi Gemini API, parse response.

## Implementation Steps

### 1. ConceptAnalysisService (AI Director)
File: `apps/api/src/modules/pipeline/concept-analysis.service.ts`
V1 ref: `ScriptWorkflow.tsx:9416-9435` (frontend call to `workflowApi.advancedRemake.analyzeConcept`)

**Logic:**
- Input: full script text
- AI prompt: "Analyze this script and extract: genre, emotional arc (3 acts), genre-specific visual rules, character identity phrase, key narrative moments"
- Output: `ConceptAnalysisOutput`
- Non-blocking: if fails, pipeline continues without AI Director context

```typescript
@Injectable()
export class ConceptAnalysisService {
  async analyze(input: ConceptAnalysisInput, aiClient: any): Promise<ConceptAnalysisOutput> {
    const prompt = buildConceptPrompt(input.script);
    const response = await aiClient.generate(prompt);
    return parseConceptResponse(response);
  }
}
```

### 2. VideoDirectionService
File: `apps/api/src/modules/pipeline/video-direction.service.ts`
V1 ref: `script_workflow.py:2300-2500` (6-pillar Scene Builder methodology)

**Logic:**
- Input: scenes[] + style + AI Director context
- Batch size: 25 scenes per AI call
- AI prompt: 6 pillars (Subject, Action, Environment, Camera, Lighting, Audio)
- Tags: `[NARRATIVE_ROLE|VOICEOVER_REL|SHOT_SIZE|MOVEMENT|LIGHTING_MOOD|EMOTION]`
- Parse format: `===SCENE N===\n[tags]\nparagraph...`
- Output: `VideoDirectionOutput[]`

**Key prompt elements from V1:**
- Scene Builder Methodology (6 pillars)
- Emotion Mapping (positive/negative/dramatic → visual parameters)
- Voiceover Relationship Tags (ILL, CTR, AMP, FSH, REV)
- Narrative Role Tags (SET, FSH, CLX, TWS, REV, RES)

### 3. EntityExtractionService
File: `apps/api/src/modules/pipeline/entity-extraction.service.ts`
V1 ref: `script_workflow.py:3342-3465` (Step 3: Extract Entities)

**Logic:**
- Input: all video prompts + original script scenes
- AI prompt: "Scan prompts, find characters/environments/props appearing ≥2 times"
- Entity names: CamelCase, min 3 chars
- Output: `EntityOutput[]`
- Batch support for large prompt sets

### 4. ReferencePromptService
File: `apps/api/src/modules/pipeline/reference-prompt.service.ts`
V1 ref: `script_workflow.py:3471-3671` (Step 4: Reference Image Prompts)

**Logic:**
- Input: entities[]
- For each entity, generate reference sheet prompts:
  - Characters: front + back + detail grids (120-180 words)
  - Environments: establishing + multi-angle + detail panels
  - Props: hero view + orthographic + close-ups
- I2V mode: max 3 entities (priority: character → env → prop)
- Output: `ReferencePromptOutput[]`

### 5. SceneBuilderPromptService
File: `apps/api/src/modules/pipeline/scene-builder-prompt.service.ts`
V1 ref: `script_workflow.py:3676-3892` (Step 5: Scene Builder Prompts)

**Logic:**
- Input: video prompts + entities + direction notes
- Inject `[EntityName]` tokens into scene descriptions
- Batch size: configurable, progress callback per batch
- F&LF mode: add N+1 "final frame" scene
- Rules: edge-to-edge composition, style lock, 40-60 words
- Output: `SceneBuilderPromptOutput[]`

### 6. VideoSegmentService
File: `apps/api/src/modules/pipeline/video-segment.service.ts`
V1 ref: `ScriptWorkflow.tsx:9291-9314` (Step 3a: Build 8s segments)

**Logic:**
- Input: scenes[] with voice durations
- Algorithm: split scenes into 8-second segments
- Handle overlap: scene content split across segments
- No AI needed — deterministic algorithm
- Output: `VideoSegmentOutput[]`

### 7. Refactor existing VeoPromptService
File: `apps/api/src/modules/pipeline/veo-prompt.service.ts` (MODIFY)

**Changes:**
- Accept `veoMode` parameter (not hardcode 'scenebuilder')
- Accept `directionNotes` to enrich prompts
- Accept `conceptAnalysis` for AI Director context
- Different word counts per mode:
  - T2V: 80-120 words
  - I2V: 60-90 words (action + physics + camera only)
  - F&LF: 40-60 words (transition prompts)
  - SB: 50-120 words (extend/jump_to)

## Files to Create/Modify
| Action | File | Est. Lines |
|--------|------|-----------|
| **CREATE** | `concept-analysis.service.ts` | ~150 |
| **CREATE** | `video-direction.service.ts` | ~250 |
| **CREATE** | `entity-extraction.service.ts` | ~200 |
| **CREATE** | `reference-prompt.service.ts` | ~250 |
| **CREATE** | `scene-builder-prompt.service.ts` | ~250 |
| **CREATE** | `video-segment.service.ts` | ~100 |
| **MODIFY** | `veo-prompt.service.ts` | +100 |
| **MODIFY** | `queue.module.ts` | Register 6 new providers |

## AI Prompt Templates
Tất cả prompt templates cho services mới sẽ được thêm vào:
`apps/api/src/modules/pipeline/script-engine.prompts.ts` (hoặc file mới `pipeline.prompts.ts`)

## Test Criteria
- [ ] Mỗi service compile thành công
- [ ] Unit test: ConceptAnalysisService parse response đúng
- [ ] Unit test: VideoDirectionService parse ===SCENE N=== format
- [ ] Unit test: EntityExtractionService parse entity list
- [ ] Unit test: VideoSegmentService tính 8s segments chính xác
- [ ] VeoPromptService chạy đúng với từng VEO mode

---
Next Phase: `phase-03-pipeline-processor.md`
