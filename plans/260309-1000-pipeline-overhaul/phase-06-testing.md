# Phase 06: Testing & Polish
Status: ⬜ Pending
Dependencies: Phase 03 + Phase 04 + Phase 05

## Objective
End-to-end testing toàn bộ 13-step pipeline.
Fix edge cases, polish UI, verify backward compatibility.

## Implementation Steps

### 1. E2E Pipeline Test — YouTube URL input
- [ ] Tạo production với YouTube URL
- [ ] Verify 13 checkpoints created
- [ ] Run full pipeline
- [ ] Verify all steps complete (or skip gracefully)
- [ ] Check outputData contains all new fields

### 2. E2E Pipeline Test — Manual script input
- [ ] Tạo production với script text
- [ ] Step 1 should use manual script (no YouTube extract)
- [ ] Full pipeline completes
- [ ] VEO prompts generated with correct mode

### 3. VEO Mode Tests
- [ ] T2V mode: prompts are 80-120 words, self-contained
- [ ] I2V mode: prompts focus on action, ≤90 words, I2V_INGREDIENTS appended
- [ ] F&LF mode: prompts are transition descriptions, 40-60 words
- [ ] Scenebuilder mode: prompts use extend/jump_to syntax

### 4. Edge Case Tests
- [ ] Empty script → pipeline fails gracefully at Step 3
- [ ] Script with 1 scene → Entity Extraction finds no recurring entities (expected)
- [ ] 100+ scenes → Batch processing works in Direction + Video Prompts
- [ ] AI timeout → Step fails, retry works
- [ ] Concept Analysis fails → Pipeline continues (non-blocking)

### 5. Backward Compatibility
- [ ] Existing productions (7-step) still display correctly in Kanban
- [ ] Old outputData format doesn't crash new UI
- [ ] Productions created before overhaul can be viewed

### 6. UI Polish
- [ ] Step grouping (phases) looks visually clear
- [ ] Step icons are consistent and meaningful
- [ ] VEO mode tooltips explain each mode
- [ ] Loading states for each step
- [ ] Error states show helpful messages

### 7. Performance Check
- [ ] Pipeline with 20 scenes completes in < 5 minutes
- [ ] Socket events don't cause UI lag
- [ ] No memory leaks in long-running pipeline

## Test Matrix

| Input | VEO Mode | Expected Steps | Notes |
|-------|---------|----------------|-------|
| YouTube URL | T2V | All 13 | Full pipeline |
| Manual script | I2V | 2-13 (skip 1) | No YouTube extract |
| YouTube URL | F&LF | All 13 | Extra final frame in Step 11 |
| Short script (1 page) | T2V | All, but 9-11 may be empty | Few entities expected |
| Long script (10 pages) | SB | All 13, batched | Performance test |

## Files to Verify
- [ ] `pipeline.processor.ts` — all 13 steps work
- [ ] `progress.tsx` — all 13 steps display correctly
- [ ] `use-pipeline-socket.ts` — all events handled
- [ ] `create-production.tsx` — new fields submitted
- [ ] `board.tsx` — production details show new data

---
✅ Pipeline Overhaul Complete!
