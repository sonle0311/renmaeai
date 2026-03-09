# Phase 05: Integration & Socket Events  
Status: ⬜ Pending
Dependencies: Phase 03 + Phase 04

## Objective
Kết nối backend 13 steps với frontend, đảm bảo Socket.IO events
cho tất cả steps mới, và checkpoint creation tạo đúng 13 records.

## Implementation Steps

### 1. Update Production creation endpoint
File: `apps/api/src/modules/production/production.service.ts` (hoặc controller)

Khi tạo production mới, tạo 13 checkpoints thay vì 7:
```typescript
const PIPELINE_STEPS = [
  { stepNumber: 1, stepName: 'Lấy nội dung' },
  // ... all 13 steps
];

for (const step of PIPELINE_STEPS) {
  await prisma.pipelineCheckpoint.create({
    data: {
      productionId,
      stepNumber: step.stepNumber,
      stepName: step.stepName,
      status: 'PENDING',
    },
  });
}
```

### 2. Update production creation request to include new fields
Ensure API accepts and stores:
- `veoMode` → `project.globalSettings.veoMode`
- `imagePromptMode` → `project.globalSettings.imagePromptMode`
- `mainCharacter` → `project.globalSettings.mainCharacter`
- `environmentDescription` → `project.globalSettings.environmentDescription`
- `visualTheme` → `project.globalSettings.visualTheme`

### 3. Socket.IO Event consistency
Ensure `getStepOutput()` returns correct data for new steps:

| Step | Event Output |
|------|-------------|
| 5 (Concept) | `{ genre, hasEmotionalArc, characterPhrase }` |
| 7 (Direction) | `{ directionCount, sampleTags }` |
| 9 (Entities) | `{ entityCount, entities: [{ name, type }] }` |
| 10 (Reference) | `{ referencePromptCount, entityNames }` |
| 11 (Scene Builder) | `{ sceneBuilderCount }` |
| 12 (Metadata) | `{ hasTitle, hasDescription, hasThumbnail }` |

### 4. Retry logic compatibility
Ensure `use-pipeline-socket.ts` retry handler works with 13 steps:
- User can retry from any failed step
- Steps before the retried step retain SUCCESS status
- Steps after failed step reset to PENDING

### 5. Kanban board update
File: `apps/web/src/components/kanban/board.tsx`

Production detail dialog should show:
- Which steps completed
- Output summaries for completed visual steps (entities, prompts)
- VEO mode and Image prompt mode used

## Files to Modify
| File | Changes |
|------|---------|
| Production service/controller | 13 checkpoints, new fields accepted |
| `pipeline.processor.ts` | `getStepOutput` cases 5, 7-12 |
| `use-pipeline-socket.ts` | Handle new step outputs |
| `board.tsx` | Show enhanced production details |

## Test Criteria
- [ ] Creating production generates exactly 13 checkpoints
- [ ] Socket events fire for all 13 steps
- [ ] Retry from step 7 works (steps 1-6 stay SUCCESS)
- [ ] Kanban detail shows VEO mode and prompt data
- [ ] API accepts and stores veoMode, imagePromptMode, visual context

---
Next Phase: `phase-06-testing.md`
