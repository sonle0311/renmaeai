/**
 * Video Direction Service — 6-Pillar Scene Builder Methodology
 *
 * Decomposes script scenes into cinematic directing notes:
 * 1. SUBJECT  2. ACTION  3. ENVIRONMENT  4. CAMERA  5. LIGHTING  6. AUDIO
 *
 * Tags per scene: [NARRATIVE_ROLE|VOICEOVER_REL|SHOT_SIZE|MOVEMENT|LIGHTING_MOOD|EMOTION]
 *
 * V1 ref: script_workflow.py:2300-2500 (analyze-video-direction endpoint)
 */

import { Injectable, Logger } from "@nestjs/common";
import { AiClientService } from "../ai/ai-client.service";
import type { UserAISettings } from "../ai/ai-client.types";
import type { VideoDirectionInput, VideoDirectionOutput, ConceptAnalysisOutput } from "./pipeline.types";
import { DIRECTION_BATCH_SIZE } from "./pipeline.constants";

@Injectable()
export class VideoDirectionService {
    private readonly logger = new Logger(VideoDirectionService.name);

    constructor(private readonly aiClient: AiClientService) { }

    async analyze(
        settings: UserAISettings,
        input: VideoDirectionInput,
        onProgress?: (message: string, percentage: number) => void,
    ): Promise<VideoDirectionOutput[]> {
        if (!input.scenes.length) return [];

        const batches = this.chunkArray(input.scenes, DIRECTION_BATCH_SIZE);
        const allDirections: VideoDirectionOutput[] = [];

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const pct = Math.round(((batchIdx + 1) / batches.length) * 100);

            onProgress?.(
                `Batch ${batchIdx + 1}/${batches.length}: ${batch.length} scenes`,
                pct,
            );

            const prompt = this.buildBatchPrompt(batch, input, batchIdx + 1, batches.length);

            const response = await this.aiClient.generate(settings, prompt, {
                temperature: 0.5,
                model: settings.geminiModel || undefined,
            });

            const batchDirections = this.parseBatchResponse(response.text, batch);
            allDirections.push(...batchDirections);

            this.logger.log(
                `[VideoDirection] Batch ${batchIdx + 1}/${batches.length}: parsed ${batchDirections.length} directions`,
            );
        }

        return allDirections;
    }

    private buildBatchPrompt(
        scenes: Array<{ sceneId: number; content: string }>,
        input: VideoDirectionInput,
        batchNum: number,
        totalBatches: number,
    ): string {
        // Build style/context block
        let styleBlock = "";
        if (input.promptStyle) styleBlock += `\n══ VISUAL STYLE ══\n${input.promptStyle}\n`;
        if (input.mainCharacter) styleBlock += `\n══ MAIN CHARACTER ══\n${input.mainCharacter}\n`;
        if (input.environmentDescription) styleBlock += `\n══ ENVIRONMENT ══\n${input.environmentDescription}\n`;

        // AI Director context
        let directorBlock = "";
        if (input.conceptAnalysis) {
            const ca = input.conceptAnalysis;
            if (ca.emotionalArc) {
                const arcParts = ["act_1", "act_2", "act_3"]
                    .map((k) => {
                        const act = (ca.emotionalArc as any)[k];
                        return act ? `${k}: ${act.tone} | visual: ${act.visual}` : null;
                    })
                    .filter(Boolean);
                if (arcParts.length) directorBlock += `\n══ EMOTIONAL ARC ══\n${arcParts.join("\n")}\n`;
            }
            if (ca.genreBlock) directorBlock += `\n══ GENRE RULES ══\n${ca.genreBlock}\n`;
            if (ca.characterPhrase) directorBlock += `\n══ CHARACTER PHRASE (use every scene) ══\n${ca.characterPhrase}\n`;
        }

        const scenesBlock = scenes.map((s) => `Scene ${s.sceneId}: ${s.content}`).join("\n");

        return `You are an expert VIDEO DIRECTOR converting text script into directing notes.
Output must be in English.

══ SCENE BUILDER METHODOLOGY (6 PILLARS) ══
For each scene, decompose into:
1. SUBJECT: Who is the center? Identity, age, clothing, distinguishing marks.
2. ACTION: One primary action. Avoid abstract verbs.
3. ENVIRONMENT: Where? Time of day? Weather? Spatial details.
4. CAMERA: Shot size (Wide/Medium/Close-up/ECU), movement (Pan/Tilt/Dolly/Track), lens.
5. LIGHTING: Source, quality (Volumetric/Rim/Soft), color temperature.
6. AUDIO: SFX, ambient sounds, music mood.

══ VOICEOVER RELATIONSHIP TAGS ══
- ILL (Illustrate): Visual matches voiceover
- CTR (Counterpoint): Visual contrasts voiceover
- AMP (Amplify): Visual intensifies beyond words
- FSH (Foreshadow): Visual hints at future
- REV (Reveal): Visual shows what words only hint at

══ NARRATIVE ROLE TAGS ══
- SET (Setup) | FSH (Foreshadow) | CLX (Climax) | TWS (Twist) | REV (Reveal) | RES (Resolution)

══ RULES ══
- Each scene = 4-8 seconds of video
- One primary action OR one camera movement per scene
${styleBlock}${directorBlock}
══ SCENES TO ANALYZE (${scenes.length} scenes, batch ${batchNum}/${totalBatches}) ══
${scenesBlock}

Return EXACTLY ${scenes.length} scene blocks using this format:

===SCENE ${scenes[0].sceneId}===
[SET|ILL|MS|dolly_in|warm_golden|calm]
A cinematic medium shot of...

===SCENE ${scenes[scenes.length - 1].sceneId}===
[CLX|AMP|ECU|handheld|cold_blue|intense]
...

Tag format: [NARRATIVE_ROLE|VOICEOVER_REL|SHOT_SIZE|MOVEMENT|LIGHTING_MOOD|EMOTION]
Return ONLY scene blocks.`;
    }

    private parseBatchResponse(
        text: string,
        originalScenes: Array<{ sceneId: number; content: string }>,
    ): VideoDirectionOutput[] {
        const results: VideoDirectionOutput[] = [];

        // Parse ===SCENE N=== format
        const blocks = text.split(/===SCENE\s+(\d+)===/);

        if (blocks.length >= 3) {
            for (let i = 1; i < blocks.length; i += 2) {
                const sceneId = parseInt(blocks[i], 10);
                const content = (blocks[i + 1] || "").trim();
                if (isNaN(sceneId) || !content) continue;

                // Extract tags from first line [TAG|TAG|...]
                const tagMatch = content.match(/^\[([^\]]+)\]/);
                const tags = tagMatch ? tagMatch[1] : undefined;
                const directionNotes = tagMatch ? content.slice(tagMatch[0].length).trim() : content;

                results.push({ sceneId, directionNotes, tags });
            }
        }

        // If parsing failed, create fallback entries
        if (results.length === 0) {
            this.logger.warn("VideoDirection: failed to parse batch, creating fallback entries");
            for (const scene of originalScenes) {
                results.push({
                    sceneId: scene.sceneId,
                    directionNotes: `Medium shot depicting: ${scene.content.slice(0, 100)}`,
                    tags: "SET|ILL|MS|static|neutral|calm",
                });
            }
        }

        return results;
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
}
