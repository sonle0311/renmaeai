# Phase 03: Pipeline Processor Refactor
Status: ⬜ Pending
Dependencies: Phase 01 + Phase 02

## Objective
Refactor `pipeline.processor.ts` từ 7 steps → 13 steps.
Inject 6 services mới vào constructor, thêm step methods, update `processStep` switch.

## Implementation Steps

### 1. Update constructor — inject new services
```typescript
constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
    // Existing
    private scriptEngine: ScriptEngineService,
    private sceneSplitter: SceneSplitterService,
    private veoPrompt: VeoPromptService,
    private promptSafety: PromptSafetyService,
    private youtubeExtract: YoutubeExtractService,
    private ttsService: TtsService,
    // NEW services
    private conceptAnalysis: ConceptAnalysisService,
    private videoDirection: VideoDirectionService,
    private entityExtraction: EntityExtractionService,
    private referencePrompt: ReferencePromptService,
    private sceneBuilderPrompt: SceneBuilderPromptService,
    private videoSegment: VideoSegmentService,
) { super(); }
```

### 2. Update `processStep` switch — 13 cases
```typescript
private async processStep(stepNumber, ...args) {
    switch (stepNumber) {
        case 1:  return this.stepExtractInputs(...);
        case 2:  return this.stepStyleAnalysis(...);
        case 3:  return this.stepScriptGeneration(...);
        case 4:  return this.stepSceneSplitting(...);
        case 5:  return this.stepConceptAnalysis(...);     // NEW
        case 6:  return this.stepTtsPreparation(...);      // Moved up
        case 7:  return this.stepVideoDirection(...);      // NEW
        case 8:  return this.stepVeoPromptGeneration(...); // Enhanced
        case 9:  return this.stepEntityExtraction(...);    // NEW
        case 10: return this.stepReferencePrompts(...);    // NEW
        case 11: return this.stepSceneBuilderPrompts(...); // NEW
        case 12: return this.stepMetadataSeo(...);         // NEW
        case 13: return this.stepFinalize(...);            // Existing, renumbered
    }
}
```

### 3. Implement new step methods

#### Step 5: `stepConceptAnalysis`
```typescript
private async stepConceptAnalysis(productionId, userId, aiSettings, projectSettings, outputData) {
    const script = outputData.generatedScript || outputData.workingScript;
    try {
        const result = await this.conceptAnalysis.analyze({ script }, aiClient);
        return { ...outputData, conceptAnalysis: result };
    } catch (err) {
        // Non-blocking — log warning, continue without AI Director
        this.logger.warn(`[${productionId}] Concept analysis failed (non-blocking): ${err.message}`);
        return { ...outputData, conceptAnalysis: null };
    }
}
```

#### Step 7: `stepVideoDirection`
```typescript
private async stepVideoDirection(productionId, userId, aiSettings, projectSettings, outputData) {
    if (!outputData.scenes?.length) throw new Error('No scenes — run scene splitting first');
    
    const directions = await this.videoDirection.analyze({
        scenes: outputData.scenes.map(s => ({ sceneId: s.id, content: s.text })),
        language: projectSettings.language,
        promptStyle: projectSettings.promptStyle,
        mainCharacter: projectSettings.mainCharacter,
        environmentDescription: projectSettings.environmentDescription,
        conceptAnalysis: outputData.conceptAnalysis,
    }, aiClient);
    
    return { ...outputData, directionNotes: directions };
}
```

#### Step 8: Enhanced `stepVeoPromptGeneration`
```typescript
// Enhanced: accept veoMode from settings, pass direction notes
private async stepVeoPromptGeneration(productionId, userId, aiSettings, projectSettings, outputData) {
    const veoMode = projectSettings.veoMode || 'text_to_video';
    const scenes = outputData.scenes || [];
    
    // Enrich scenes with direction notes
    const enrichedScenes = scenes.map(s => ({
        ...s,
        directionNotes: outputData.directionNotes?.find(d => d.sceneId === s.id)?.directionNotes,
    }));
    
    const result = await this.veoPrompt.generateForScenes(enrichedScenes, {
        mode: veoMode,
        conceptAnalysis: outputData.conceptAnalysis,
        language: projectSettings.language,
    }, aiClient);
    
    return {
        ...outputData,
        scenes: result.scenes,
        veoPromptsGenerated: true,
        veoMode,
    };
}
```

#### Step 9: `stepEntityExtraction`
```typescript
private async stepEntityExtraction(productionId, userId, aiSettings, projectSettings, outputData) {
    const videoPrompts = (outputData.scenes || [])
        .filter(s => s.veoPrompt)
        .map(s => ({ sceneId: s.id, videoPrompt: s.veoPrompt! }));
    
    if (videoPrompts.length === 0) {
        return { ...outputData, entities: [] };
    }
    
    const entities = await this.entityExtraction.extract({
        videoPrompts,
        scriptScenes: (outputData.scenes || []).map(s => ({ sceneId: s.id, content: s.text })),
        language: projectSettings.language,
    }, aiClient);
    
    return { ...outputData, entities };
}
```

#### Step 10: `stepReferencePrompts`
```typescript
private async stepReferencePrompts(productionId, userId, aiSettings, projectSettings, outputData) {
    if (!outputData.entities?.length) {
        return { ...outputData, referencePrompts: [], referencePromptsText: '' };
    }
    
    const result = await this.referencePrompt.generate({
        entities: outputData.entities,
        promptStyle: projectSettings.promptStyle,
    }, aiClient);
    
    const refText = result.map(r => r.prompts.map(p => `[${r.entityName}] ${p.angle}: ${p.prompt}`).join('\n')).join('\n\n');
    
    return { ...outputData, referencePrompts: result, referencePromptsText: refText };
}
```

#### Step 11: `stepSceneBuilderPrompts`
```typescript
private async stepSceneBuilderPrompts(productionId, userId, aiSettings, projectSettings, outputData) {
    if (!outputData.entities?.length || !outputData.scenes?.some(s => s.veoPrompt)) {
        return { ...outputData, sceneBuilderPrompts: [], sceneBuilderPromptsText: '' };
    }
    
    const result = await this.sceneBuilderPrompt.generate({
        videoPrompts: outputData.scenes.filter(s => s.veoPrompt).map(s => ({ sceneId: s.id, videoPrompt: s.veoPrompt! })),
        entities: outputData.entities,
        directions: outputData.directionNotes,
        promptStyle: projectSettings.promptStyle,
        veoMode: projectSettings.veoMode,
    }, aiClient);
    
    const sbText = result.map(sb => sb.prompt).filter(Boolean).join('\n');
    
    return { ...outputData, sceneBuilderPrompts: result, sceneBuilderPromptsText: sbText };
}
```

#### Step 12: `stepMetadataSeo`
```typescript
private async stepMetadataSeo(productionId, userId, aiSettings, projectSettings, outputData) {
    // Placeholder for now — full implementation in Phase 2+
    return {
        ...outputData,
        youtubeTitle: '',
        youtubeDescription: '',
        thumbnailPrompt: '',
    };
}
```

### 4. Update `getStepOutput` — 13 cases
Map each step number to the relevant outputData fields for Socket.IO streaming.

### 5. Update checkpoint creation
Where checkpoints are created (production creation endpoint), generate 13 steps instead of 7.

## Files to Modify
| File | Changes |
|------|---------|
| `pipeline.processor.ts` | Constructor, processStep switch, 6 new methods, getStepOutput |
| `queue.module.ts` | Add 6 new providers |
| Production creation endpoint | 13 checkpoints |

## Test Criteria
- [ ] Pipeline processor compiles with new services
- [ ] processStep handles all 13 cases
- [ ] getStepOutput returns correct data for all 13 steps
- [ ] Existing steps 1-4 still work identically
- [ ] New steps 5-11 call services correctly
- [ ] Step errors are caught and reported per-step (not crash pipeline)
- [ ] Non-blocking steps (Concept Analysis) don't stop pipeline on failure

---
Next Phase: `phase-04-frontend-ui.md`
