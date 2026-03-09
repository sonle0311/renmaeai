/**
 * Entity Extraction Service
 *
 * Scans video prompts to find recurring characters, environments, and props (≥2 appearances).
 * Outputs structured entity list for reference prompt and scene builder prompt generation.
 *
 * V1 ref: script_workflow.py:3342-3465 (Step 3: Extract Entities)
 */

import { Injectable, Logger } from "@nestjs/common";
import { AiClientService } from "../ai/ai-client.service";
import type { UserAISettings } from "../ai/ai-client.types";
import type { EntityExtractionInput, EntityOutput } from "./pipeline.types";

@Injectable()
export class EntityExtractionService {
    private readonly logger = new Logger(EntityExtractionService.name);

    constructor(private readonly aiClient: AiClientService) { }

    async extract(
        settings: UserAISettings,
        input: EntityExtractionInput,
    ): Promise<EntityOutput[]> {
        if (!input.videoPrompts.length) return [];

        const prompt = this.buildPrompt(input);

        const response = await this.aiClient.generate(settings, prompt, {
            temperature: 0.3,
            model: settings.geminiModel || undefined,
        });

        return this.parseResponse(response.text);
    }

    private buildPrompt(input: EntityExtractionInput): string {
        const promptsBlock = input.videoPrompts
            .map((vp) => `Scene ${vp.sceneId}: ${vp.videoPrompt}`)
            .join("\n\n");

        return `You are an entity extraction specialist for video production.

══ TASK ══
Scan ALL video prompts below and identify RECURRING entities that appear in 2 or more scenes.

══ ENTITY TYPES ══
1. "character" - People, animals, or anthropomorphic entities
2. "environment" - Locations, settings, backgrounds
3. "prop" - Objects, vehicles, tools that appear repeatedly

══ RULES ══
- ONLY include entities appearing in ≥2 different scenes
- Name format: CamelCase, min 3 characters (e.g., "YoungWoman", "CityPark", "RedCar")
- Description: 1-2 sentences of visual appearance details
- Include scene_ids where this entity appears
- Merge similar entities (e.g., "girl" and "young woman" → one entity)

══ VIDEO PROMPTS ══
${promptsBlock}

══ OUTPUT FORMAT ══
Return a JSON array:
[
  {
    "name": "EntityName",
    "type": "character",
    "description": "Visual description...",
    "scene_ids": [1, 3, 5],
    "count": 3
  }
]

Return ONLY valid JSON array, no markdown fences.`;
    }

    private parseResponse(text: string): EntityOutput[] {
        try {
            const cleaned = text
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/g, "")
                .trim();

            // Try to find JSON array in text
            const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!arrayMatch) {
                this.logger.warn("EntityExtraction: no JSON array found in response");
                return [];
            }

            const parsed = JSON.parse(arrayMatch[0]);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .filter((e: any) => e.name && e.type)
                .map((e: any) => ({
                    name: String(e.name),
                    type: e.type === "character" || e.type === "environment" || e.type === "prop"
                        ? e.type
                        : "prop",
                    description: String(e.description || ""),
                    sceneIds: Array.isArray(e.scene_ids) ? e.scene_ids.map(Number) : [],
                    count: typeof e.count === "number" ? e.count : (e.scene_ids?.length || 0),
                }));
        } catch (error) {
            this.logger.warn(`EntityExtraction: parse failed: ${error.message}`);
            return [];
        }
    }
}
