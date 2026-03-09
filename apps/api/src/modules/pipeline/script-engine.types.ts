/**
 * Script Engine Types — Port from v1 script_generator.py dataclasses
 *
 * Core data structures for the 7-step recursive writing pipeline.
 */

// ═══════════════════════════════════════════════════════════════
// STYLE PROFILE (from ConversationStyleAnalyzer)
// ═══════════════════════════════════════════════════════════════

/** StyleA — DNA profile distilled from analyzing sample scripts */
export interface StyleA {
    // DNA FIXED (doesn't change per script — general patterns)
    tone: string;
    vocabularyLevel: string;
    sentenceStructure: string;
    pacing: string;
    keyPhrases: string[];
    emotionalRange: string;
    hookStyle: string;
    transitionPatterns: string[];
    narrativeVoice: string;
    audienceAddress: string;
    uniquePatterns: string[];
    // METADATA
    culturalMarkers: string;
    sourceScriptsCount: number;
    confidenceScore: number;
}

// ═══════════════════════════════════════════════════════════════
// 7-STEP PIPELINE DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════

/** Step 1: Original Script Analysis */
export interface OriginalScriptAnalysis {
    coreAngle: string;
    mainIdeas: string[];
    viewerInsight: string;
    hookAnalysis: string;
    writingStyle: Record<string, string>;
    culturalContext: string;
    narrativeVoice: string;
    retentionEngine: string;
    ctaStrategy: string;
}

/** Step 2: Structure Analysis */
export interface StructureAnalysis {
    wordCount: number;
    hookDuration: string;
    introAnalysis: Record<string, unknown>;
    bodyAnalysis: Record<string, unknown>;
    conclusionAnalysis: Record<string, unknown>;
    sectionBreakdown: SectionBreakdownItem[];
    climaxLocation: string;
    payoffLocation: string;
}

export interface SectionBreakdownItem {
    id: string;
    title: string;
    wordCount: number;
    purpose: string;
}

/** Step 3: Outline with word allocation */
export interface OutlineA {
    sections: OutlineSection[];
    totalTargetWords: number;
    language: string;
    dialect: string;
    channelName: string;
    storytellingStyle: string;
    narrativeVoice: string;
    audienceAddress: string;
}

export interface OutlineSection {
    id: string;
    title: string;
    description: string;
    order: number;
    wordCountTarget: number;
    keyPoints: string[];
    specialInstructions: string;
}

/** Step 4-5: Draft sections */
export interface DraftSection {
    sectionId: string;
    content: string;
    version: number;
    wordCount: number;
    status: 'draft' | 'refined' | 'final';
}

/** Step 6: Similarity Review */
export interface SimilarityReview {
    similarityScore: number;
    issuesFound: string[];
    isTooSimilar: boolean;
    isTooDifferent: boolean;
    ethicsViolations: string[];
    suggestions: string[];
    countryChecked: string;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════

/** Input parameters for the script pipeline */
export interface ScriptPipelineInput {
    originalScript: string;
    targetWordCount: number;
    sourceLanguage?: string;
    language: string;
    dialect?: string;
    channelName?: string;
    country?: string;
    addQuiz?: boolean;
    valueType?: string;
    storytellingStyle?: string;
    narrativeVoice?: string;
    customNarrativeVoice?: string;
    audienceAddress?: string;
    customAudienceAddress?: string;
    styleProfile?: StyleA;
    customValue?: string;
}

/** Complete pipeline output — all intermediate + final results */
export interface ScriptPipelineOutput {
    success: boolean;
    finalScript: string;
    wordCount: number;
    // Intermediate results (stored in checkpoint outputData)
    originalAnalysis?: OriginalScriptAnalysis;
    structureAnalysis?: StructureAnalysis;
    outlineA?: OutlineA;
    draftSections?: DraftSection[];
    refinedSections?: DraftSection[];
    similarityReview?: SimilarityReview;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════
// SCENE SPLITTING
// ═══════════════════════════════════════════════════════════════

export interface Scene {
    id: number;
    text: string;
    wordCount: number;
    estimatedDurationSeconds: number;
    // After VEO prompt generation
    veoPrompt?: string;
    veoMode?: VeoMode;
}

export enum VeoMode {
    TEXT_TO_VIDEO = 'text_to_video',
    INGREDIENTS_TO_VIDEO = 'ingredients_to_video',
    FIRST_LAST_FRAME = 'first_last_frame',
    SCENEBUILDER = 'scenebuilder',
}

/** TTS speed parameters per language (words per second) */
export const TTS_SPEED_BY_LANGUAGE: Record<string, number> = {
    vi: 3.1,
    en: 2.8,
    zh: 2.5,
    ja: 2.6,
    ko: 2.7,
    es: 3.0,
    fr: 2.9,
    th: 2.8,
    de: 2.7,
    pt: 3.0,
    ru: 2.6,
};

/** Target scene duration range (seconds) — must match VEO video length */
export const SCENE_DURATION_RANGE = {
    min: 3,
    max: 8,
    target: 5,
} as const;
