# Phase 01: Data Structures & Types
Status: ⬜ Pending
Dependencies: None

## Objective
Cập nhật tất cả interfaces và types để hỗ trợ 13 steps pipeline mới:
- Mở rộng `PipelineJobData`, `ProjectSettings`, `ProductionOutputData`
- Thêm types cho 6 services mới
- Cập nhật pipeline step constants

## Implementation Steps

### 1. Mở rộng `ProjectSettings` interface
File: `apps/api/src/modules/queue/pipeline.processor.ts` (lines 28-45)

```typescript
interface ProjectSettings {
  // ... existing fields ...
  // NEW: Visual context
  visualTheme?: string;           // e.g. "cinematic dark", "pastel anime"
  mainCharacter?: string;        // e.g. "a young woman with long black hair"
  environmentDescription?: string; // e.g. "modern Tokyo cityscape"
  // NEW: Mode selection
  veoMode?: 'text_to_video' | 'ingredients_to_video' | 'first_last_frame' | 'scenebuilder';
  imagePromptMode?: 'reference' | 'scene_builder' | 'concept';
  // NEW: AI Director
  promptStyle?: string;           // Visual style mandate from style analysis
}
```

### 2. Mở rộng `ProductionOutputData` interface
File: `apps/api/src/modules/queue/pipeline.processor.ts` (lines 47-81)

```typescript
interface ProductionOutputData {
  // ... existing Step 1-4 fields ...
  // Step 5: Concept Analysis (AI Director)
  conceptAnalysis?: {
    genre: string;
    emotionalArc: { act_1: any; act_2: any; act_3: any };
    genreBlock: string;
    characterPhrase: string;
    keyMoments: Array<{ scene_keyword: string; type: string; voiceover_rel: string }>;
  };
  // Step 6: Voice TTS (move from step 6 to new position)
  ttsGenerated?: boolean;
  ttsProvider?: string;
  ttsVoice?: string;
  ttsAudioUrls?: Array<{ sceneId: number; audioUrl: string; durationSeconds: number; text: string }>;
  // Step 6a: Video Segments
  videoSegments?: Array<{
    segmentId: number;
    startTime: number;
    endTime: number;
    duration: number;
    content: string;
    sourceScenes: Array<{ sceneId: number; overlapRatio: number }>;
  }>;
  // Step 7: Video Direction
  directionNotes?: Array<{
    sceneId: number;
    directionNotes: string; // Full directing paragraph
    tags?: string;          // [CLX|AMP|ECU|handheld|cold_blue|intense]
  }>;
  // Step 8: VEO Prompts (enhanced)
  veoPromptsGenerated?: boolean;
  veoMode?: string;
  // Step 9: Entities
  entities?: Array<{
    name: string;
    type: 'character' | 'environment' | 'prop';
    description: string;
    sceneIds: number[];
    count: number;
  }>;
  // Step 10: Reference Image Prompts
  referencePrompts?: Array<{
    entityName: string;
    entityType: string;
    prompts: Array<{ angle: string; prompt: string }>;
  }>;
  referencePromptsText?: string;
  // Step 11: Scene Builder Prompts
  sceneBuilderPrompts?: Array<{
    sceneId: number;
    prompt: string;
  }>;
  sceneBuilderPromptsText?: string;
  // Step 12: Metadata / SEO
  youtubeTitle?: string;
  youtubeDescription?: string;
  thumbnailPrompt?: string;
  // Step 13: Finalize
  finalizedAt?: string;
  readyForAssembly?: boolean;
  totalDurationSeconds?: number;
}
```

### 3. Tạo Pipeline Constants
File mới: `apps/api/src/modules/pipeline/pipeline.constants.ts`

```typescript
export const PIPELINE_STEPS = {
  YOUTUBE_EXTRACT: 1,
  STYLE_ANALYSIS: 2,
  SCRIPT_GENERATION: 3,
  SCENE_SPLITTING: 4,
  CONCEPT_ANALYSIS: 5,
  VOICE_TTS: 6,
  VIDEO_DIRECTION: 7,
  VEO_PROMPTS: 8,
  ENTITY_EXTRACTION: 9,
  REFERENCE_PROMPTS: 10,
  SCENE_BUILDER_PROMPTS: 11,
  METADATA_SEO: 12,
  FINALIZE: 13,
} as const;

export const PIPELINE_STEP_NAMES: Record<number, string> = {
  1: 'Lấy nội dung',
  2: 'Phân tích phong cách',
  3: 'Viết script AI',
  4: 'Chia cảnh',
  5: 'AI Director',
  6: 'Giọng đọc TTS',
  7: 'Phân tích đạo diễn',
  8: 'Tạo prompt video',
  9: 'Trích xuất nhân vật',
  10: 'Prompt ảnh reference',
  11: 'Prompt scene builder',
  12: 'Metadata & SEO',
  13: 'Hoàn tất',
};

export const VEO_MODES = ['text_to_video', 'ingredients_to_video', 'first_last_frame', 'scenebuilder'] as const;
export type VeoMode = typeof VEO_MODES[number];

export const IMAGE_PROMPT_MODES = ['reference', 'scene_builder', 'concept'] as const;
export type ImagePromptMode = typeof IMAGE_PROMPT_MODES[number];
```

### 4. Tạo Service Types
File mới: `apps/api/src/modules/pipeline/pipeline.types.ts`

```typescript
// Types cho các services mới
export interface ConceptAnalysisInput { script: string; model?: string; }
export interface ConceptAnalysisOutput {
  genre: string;
  emotionalArc: { act_1: any; act_2: any; act_3: any };
  genreBlock: string;
  characterPhrase: string;
  keyMoments: Array<{ scene_keyword: string; type: string; voiceover_rel: string }>;
}

export interface VideoDirectionInput {
  scenes: Array<{ sceneId: number; content: string }>;
  language?: string;
  promptStyle?: string;
  mainCharacter?: string;
  environmentDescription?: string;
  conceptAnalysis?: ConceptAnalysisOutput;
}
export interface VideoDirectionOutput {
  sceneId: number;
  directionNotes: string;
  tags?: string;
}

export interface EntityExtractionInput {
  videoPrompts: Array<{ sceneId: number; videoPrompt: string }>;
  scriptScenes: Array<{ sceneId: number; content: string }>;
  language?: string;
}
export interface EntityOutput {
  name: string;
  type: 'character' | 'environment' | 'prop';
  description: string;
  sceneIds: number[];
  count: number;
}

export interface ReferencePromptInput {
  entities: EntityOutput[];
  promptStyle?: string;
}
export interface ReferencePromptOutput {
  entityName: string;
  entityType: string;
  prompts: Array<{ angle: string; prompt: string }>;
}

export interface SceneBuilderPromptInput {
  videoPrompts: Array<{ sceneId: number; videoPrompt: string }>;
  entities: EntityOutput[];
  directions?: VideoDirectionOutput[];
  promptStyle?: string;
  veoMode?: string;
}
export interface SceneBuilderPromptOutput {
  sceneId: number;
  prompt: string;
}

export interface VideoSegmentInput {
  scenes: Array<{ sceneId: number; content: string; voiceDurationSeconds: number }>;
  segmentLengthSeconds?: number; // default 8
}
export interface VideoSegmentOutput {
  segmentId: number;
  startTime: number;
  endTime: number;
  duration: number;
  content: string;
  sourceScenes: Array<{ sceneId: number; overlapRatio: number }>;
}
```

### 5. Cập nhật Prisma checkpoint creation
File: nơi tạo pipeline checkpoints khi start production

Thay vì tạo 7 checkpoints, tạo 13 checkpoints:
```typescript
const steps = [
  { stepNumber: 1, stepName: 'Lấy nội dung' },
  { stepNumber: 2, stepName: 'Phân tích phong cách' },
  { stepNumber: 3, stepName: 'Viết script AI' },
  { stepNumber: 4, stepName: 'Chia cảnh' },
  { stepNumber: 5, stepName: 'AI Director' },
  { stepNumber: 6, stepName: 'Giọng đọc TTS' },
  { stepNumber: 7, stepName: 'Phân tích đạo diễn' },
  { stepNumber: 8, stepName: 'Tạo prompt video' },
  { stepNumber: 9, stepName: 'Trích xuất nhân vật' },
  { stepNumber: 10, stepName: 'Prompt ảnh reference' },
  { stepNumber: 11, stepName: 'Prompt scene builder' },
  { stepNumber: 12, stepName: 'Metadata & SEO' },
  { stepNumber: 13, stepName: 'Hoàn tất' },
];
```

## Files to Create/Modify
| Action | File | Purpose |
|--------|------|---------|
| **CREATE** | `apps/api/src/modules/pipeline/pipeline.constants.ts` | Step numbers, names, VEO modes |
| **CREATE** | `apps/api/src/modules/pipeline/pipeline.types.ts` | Input/Output types for all services |
| **MODIFY** | `apps/api/src/modules/queue/pipeline.processor.ts` | Update interfaces (lines 22-81) |
| **MODIFY** | `apps/api/src/modules/pipeline/pipeline.module.ts` (or equivalent) | Register new services |
| **MODIFY** | Pipeline creation endpoint | 13 checkpoints instead of 7 |

## Test Criteria
- [ ] TypeScript builds without errors
- [ ] All new types are importable
- [ ] Constants match BRIEF pipeline order
- [ ] Existing pipeline still works (backward compatible)

---
Next Phase: `phase-02-backend-services.md`
