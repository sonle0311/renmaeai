/**
 * Pipeline Constants — Step definitions, VEO modes, Image prompt modes.
 * Single source of truth for both backend processor and frontend UI.
 */

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

export const PIPELINE_STEP_LIST = [
    { number: 1, name: "YouTube Extract" },
    { number: 2, name: "Style Analysis" },
    { number: 3, name: "Script Generation" },
    { number: 4, name: "Scene Splitting" },
    { number: 5, name: "AI Director" },
    { number: 6, name: "Voice TTS" },
    { number: 7, name: "Video Direction" },
    { number: 8, name: "VEO Prompts" },
    { number: 9, name: "Entity Extraction" },
    { number: 10, name: "Reference Prompts" },
    { number: 11, name: "Scene Builder" },
    { number: 12, name: "Metadata & SEO" },
    { number: 13, name: "Finalize" },
] as const;

export const PIPELINE_STEP_NAMES: Record<number, string> = {
    1: "Lấy nội dung",
    2: "Phân tích phong cách",
    3: "Viết script AI",
    4: "Chia cảnh",
    5: "AI Director",
    6: "Giọng đọc TTS",
    7: "Phân tích đạo diễn",
    8: "Tạo prompt video",
    9: "Trích xuất nhân vật",
    10: "Prompt ảnh reference",
    11: "Prompt scene builder",
    12: "Metadata & SEO",
    13: "Hoàn tất",
};

export const VEO_MODES = ["text_to_video", "ingredients_to_video", "first_last_frame", "scenebuilder"] as const;
export type VeoModeType = (typeof VEO_MODES)[number];

export const IMAGE_PROMPT_MODES = ["reference", "scene_builder", "concept"] as const;
export type ImagePromptMode = (typeof IMAGE_PROMPT_MODES)[number];

/** Max scenes per AI batch call (prevents timeout + quality degradation) */
export const DIRECTION_BATCH_SIZE = 25;
export const ENTITY_BATCH_SIZE = 50;
export const SCENE_BUILDER_BATCH_SIZE = 25;
