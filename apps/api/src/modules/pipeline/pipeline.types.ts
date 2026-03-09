/**
 * Pipeline Types — Input/Output interfaces for all pipeline services.
 * Used by pipeline.processor.ts and individual service files.
 */

import type { StyleA } from "./script-engine.types";
import type { ImagePromptMode, VeoModeType } from "./pipeline.constants";

// ──────────────────────────────────────────────
// Job & Settings
// ──────────────────────────────────────────────

export interface PipelineJobData {
    productionId: string;
    userId: string;
    mediaGeneration: boolean;
}

export interface ProjectSettings {
    script?: string;
    language?: string;
    sourceLanguage?: string;
    dialect?: string;
    channelName?: string;
    country?: string;
    targetWordCount?: number;
    addQuiz?: boolean;
    valueType?: string;
    storytellingStyle?: string;
    narrativeVoice?: string;
    customNarrativeVoice?: string;
    audienceAddress?: string;
    customAudienceAddress?: string;
    styleA?: StyleA;
    customValue?: string;
    // ── NEW: Visual context ──
    visualTheme?: string;
    mainCharacter?: string;
    environmentDescription?: string;
    promptStyle?: string;
    // ── NEW: Mode selection ──
    veoMode?: VeoModeType;
    imagePromptMode?: ImagePromptMode;
}

// ──────────────────────────────────────────────
// Production Output Data (stored as JSON in DB)
// ──────────────────────────────────────────────

export interface ProductionOutputData {
    // Step 1 (YouTube Extract)
    inputsValidated?: boolean;
    workingScript?: string;
    scriptSource?: "youtube" | "manual" | "project";
    youtubeMetadata?: { videoId: string; title: string; thumbnail?: string };
    // Step 2 (Style Analysis)
    hasStyleProfile?: boolean;
    // Step 3 (Script Generation)
    generatedScript?: string;
    wordCount?: number;
    sectionsCount?: number;
    // Step 4 (Scene Splitting)
    scenes?: SceneItem[];
    totalScenes?: number;
    // Step 5 (Concept Analysis / AI Director)
    conceptAnalysis?: ConceptAnalysisOutput | null;
    // Step 6 (Voice TTS)
    ttsGenerated?: boolean;
    ttsProvider?: string;
    ttsVoice?: string;
    ttsAudioUrls?: TtsAudioUrl[];
    // Step 6a (Video Segments — computed from TTS durations)
    videoSegments?: VideoSegmentOutput[];
    // Step 7 (Video Direction)
    directionNotes?: VideoDirectionOutput[];
    // Step 8 (VEO Prompts)
    veoPromptsGenerated?: boolean;
    veoMode?: string;
    // Step 9 (Entity Extraction)
    entities?: EntityOutput[];
    // Step 10 (Reference Image Prompts)
    referencePrompts?: ReferencePromptOutput[];
    referencePromptsText?: string;
    // Step 11 (Scene Builder Prompts)
    sceneBuilderPrompts?: SceneBuilderPromptOutput[];
    sceneBuilderPromptsText?: string;
    // Step 12 (Metadata / SEO)
    youtubeTitle?: string;
    youtubeDescription?: string;
    thumbnailPrompt?: string;
    // Step 13 (Finalize)
    finalizedAt?: string;
    readyForAssembly?: boolean;
    totalDurationSeconds?: number;
}

export interface SceneItem {
    id: number;
    text: string;
    wordCount: number;
    estimatedDurationSeconds: number;
    veoPrompt?: string;
    veoMode?: string;
    directionNotes?: string;
    directionTags?: string;
}

export interface TtsAudioUrl {
    sceneId: number;
    audioUrl: string;
    durationSeconds: number;
    text: string;
}

// ──────────────────────────────────────────────
// Step 5: Concept Analysis (AI Director)
// ──────────────────────────────────────────────

export interface ConceptAnalysisInput {
    script: string;
    language?: string;
}

export interface ConceptAnalysisOutput {
    genre: string;
    emotionalArc: {
        act_1: { tone: string; visual: string };
        act_2: { tone: string; visual: string };
        act_3: { tone: string; visual: string };
    };
    genreBlock: string;
    characterPhrase: string;
    keyMoments: KeyMoment[];
}

export interface KeyMoment {
    scene_keyword: string;
    type: string;
    voiceover_rel: string;
}

// ──────────────────────────────────────────────
// Step 7: Video Direction Analysis
// ──────────────────────────────────────────────

export interface VideoDirectionInput {
    scenes: Array<{ sceneId: number; content: string }>;
    language?: string;
    promptStyle?: string;
    mainCharacter?: string;
    environmentDescription?: string;
    conceptAnalysis?: ConceptAnalysisOutput | null;
}

export interface VideoDirectionOutput {
    sceneId: number;
    directionNotes: string;
    tags?: string;
}

// ──────────────────────────────────────────────
// Step 9: Entity Extraction
// ──────────────────────────────────────────────

export interface EntityExtractionInput {
    videoPrompts: Array<{ sceneId: number; videoPrompt: string }>;
    scriptScenes?: Array<{ sceneId: number; content: string }>;
    language?: string;
}

export interface EntityOutput {
    name: string;
    type: "character" | "environment" | "prop";
    description: string;
    sceneIds: number[];
    count: number;
}

// ──────────────────────────────────────────────
// Step 10: Reference Image Prompts
// ──────────────────────────────────────────────

export interface ReferencePromptInput {
    entities: EntityOutput[];
    promptStyle?: string;
}

export interface ReferencePromptOutput {
    entityName: string;
    entityType: string;
    prompt: string;
}

// ──────────────────────────────────────────────
// Step 11: Scene Builder Prompts
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Step 6a: Video Segments
// ──────────────────────────────────────────────

export interface VideoSegmentInput {
    scenes: Array<{ sceneId: number; content: string; voiceDurationSeconds: number }>;
    segmentLengthSeconds?: number;
}

export interface VideoSegmentOutput {
    segmentId: number;
    startTime: number;
    endTime: number;
    duration: number;
    content: string;
    sourceScenes: Array<{ sceneId: number; overlapRatio: number }>;
}
