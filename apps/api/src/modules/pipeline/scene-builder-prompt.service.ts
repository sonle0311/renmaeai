/**
 * Scene Builder Prompt Service
 *
 * Takes video prompts + extracted entities → injects [EntityName] tokens
 * to create static scene image prompts for VEO Scenebuilder mode.
 *
 * V1 ref: script_workflow.py:3676-3892 (Step 5: Scene Builder Prompts)
 */

import { Injectable, Logger } from "@nestjs/common";
import { AiClientService } from "../ai/ai-client.service";
import type { UserAISettings } from "../ai/ai-client.types";
import type {
    SceneBuilderPromptInput,
    SceneBuilderPromptOutput,
    EntityOutput,
    VideoDirectionOutput,
} from "./pipeline.types";
import { SCENE_BUILDER_BATCH_SIZE } from "./pipeline.constants";

@Injectable()
export class SceneBuilderPromptService {
    private readonly logger = new Logger(SceneBuilderPromptService.name);

    constructor(private readonly aiClient: AiClientService) { }

    async generate(
        settings: UserAISettings,
        input: SceneBuilderPromptInput,
        onProgress?: (message: string, percentage: number) => void,
    ): Promise<SceneBuilderPromptOutput[]> {
        if (!input.videoPrompts.length) return [];

        const entityBlock = this.buildEntityBlock(input.entities);
        const batches = this.chunkArray(input.videoPrompts, SCENE_BUILDER_BATCH_SIZE);
        const allResults: SceneBuilderPromptOutput[] = [];

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const pct = Math.round(((batchIdx + 1) / batches.length) * 100);

            onProgress?.(
                `Scene Builder ${batchIdx + 1}/${batches.length}`,
                pct,
            );

            const prompt = this.buildBatchPrompt(
                batch,
                entityBlock,
                input.directions,
                input.promptStyle,
                batchIdx + 1,
                batches.length,
            );

            const response = await this.aiClient.generate(settings, prompt, {
                temperature: 0.5,
                model: settings.geminiModel || undefined,
            });

            const batchResults = this.parseBatchResponse(response.text, batch);
            allResults.push(...batchResults);
        }

        this.logger.log(`Generated ${allResults.length} scene builder prompts`);
        return allResults;
    }

    private buildEntityBlock(entities: EntityOutput[]): string {
        if (!entities.length) return "";

        const lines = entities.map(
            (e) => `[${e.name}] (${e.type}): ${e.description}`,
        );
        return `══ ENTITY LIBRARY (use [Name] tokens) ══\n${lines.join("\n")}`;
    }

    private buildBatchPrompt(
        scenes: Array<{ sceneId: number; videoPrompt: string }>,
        entityBlock: string,
        directions?: VideoDirectionOutput[],
        promptStyle?: string,
        batchNum?: number,
        totalBatches?: number,
    ): string {
        const scenesBlock = scenes
            .map((s) => {
                const dir = directions?.find((d) => d.sceneId === s.sceneId);
                const dirLine = dir
                    ? `\nDirection: ${dir.tags ? `[${dir.tags}] ` : ""}${dir.directionNotes.slice(0, 200)}`
                    : "";
                return `Scene ${s.sceneId}: ${s.videoPrompt}${dirLine}`;
            })
            .join("\n\n");

        return `You are a SCENE IMAGE PROMPT GENERATOR for VEO Scenebuilder mode.

${entityBlock}
${promptStyle ? `\n══ VISUAL STYLE ══\n${promptStyle}` : ""}

══ RULES ══
- Generate a STATIC IMAGE prompt for each scene (NOT video — a single frame)
- Use [EntityName] tokens to reference entities from the library above
- Edge-to-edge composition, no empty space
- 40-60 words per scene prompt
- Include: composition, lighting, atmosphere, key elements
- Style must be consistent across all scenes

══ SCENES (batch ${batchNum || 1}/${totalBatches || 1}) ══
${scenesBlock}

Return EXACTLY ${scenes.length} prompts in this format:

===SCENE ${scenes[0].sceneId}===
A wide establishing shot of [CityPark] at golden hour, [YoungWoman] standing...

===SCENE ${scenes[scenes.length - 1].sceneId}===
...

Return ONLY scene blocks.`;
    }

    private parseBatchResponse(
        text: string,
        originalScenes: Array<{ sceneId: number; videoPrompt: string }>,
    ): SceneBuilderPromptOutput[] {
        const results: SceneBuilderPromptOutput[] = [];

        const blocks = text.split(/===SCENE\s+(\d+)===/);

        if (blocks.length >= 3) {
            for (let i = 1; i < blocks.length; i += 2) {
                const sceneId = parseInt(blocks[i], 10);
                const prompt = (blocks[i + 1] || "").trim();
                if (!isNaN(sceneId) && prompt) {
                    results.push({ sceneId, prompt });
                }
            }
        }

        // Fallback for unparseable responses
        if (results.length === 0 && originalScenes.length > 0) {
            this.logger.warn("SceneBuilder: parse failed, using video prompts as fallback");
            for (const scene of originalScenes) {
                results.push({
                    sceneId: scene.sceneId,
                    prompt: `A cinematic still frame: ${scene.videoPrompt.slice(0, 100)}`,
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
