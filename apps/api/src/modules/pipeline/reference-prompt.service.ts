/**
 * Reference Prompt Service — VEO3 Reference Image Generation
 *
 * Generates multi-panel reference sheet prompts for each entity:
 * - Characters: front + back + detail grids (120-180 words)
 * - Environments: establishing + multi-angle + detail panels
 * - Props: hero view + orthographic views + close-ups
 *
 * V1 ref: script_workflow.py:3471-3671 (Step 4: Reference Image Prompts)
 */

import { Injectable, Logger } from "@nestjs/common";
import { AiClientService } from "../ai/ai-client.service";
import type { UserAISettings } from "../ai/ai-client.types";
import type { ReferencePromptInput, ReferencePromptOutput, EntityOutput } from "./pipeline.types";

@Injectable()
export class ReferencePromptService {
    private readonly logger = new Logger(ReferencePromptService.name);

    constructor(private readonly aiClient: AiClientService) { }

    async generate(
        settings: UserAISettings,
        input: ReferencePromptInput,
    ): Promise<ReferencePromptOutput[]> {
        if (!input.entities.length) return [];

        const results: ReferencePromptOutput[] = [];

        for (const entity of input.entities) {
            const prompt = this.buildEntityPrompt(entity, input.promptStyle);

            try {
                const response = await this.aiClient.generate(settings, prompt, {
                    temperature: 0.5,
                    model: settings.geminiModel || undefined,
                });

                results.push({
                    entityName: entity.name,
                    entityType: entity.type,
                    prompt: response.text.trim(),
                });
            } catch (error) {
                this.logger.warn(`ReferencePrompt failed for ${entity.name}: ${error.message}`);
                results.push({
                    entityName: entity.name,
                    entityType: entity.type,
                    prompt: this.buildFallbackPrompt(entity),
                });
            }
        }

        this.logger.log(`Generated ${results.length} reference prompts`);
        return results;
    }

    private buildEntityPrompt(entity: EntityOutput, promptStyle?: string): string {
        const styleDirective = promptStyle
            ? `\nVisual style: ${promptStyle}`
            : "";

        switch (entity.type) {
            case "character":
                return `Generate a VEO3 CHARACTER REFERENCE SHEET prompt for image generation.

Entity: "${entity.name}"
Description: ${entity.description}${styleDirective}

Create a SINGLE IMAGE prompt that describes a multi-panel character reference sheet:
- Panel 1: Full-body FRONT view with neutral pose, detailed clothing and features
- Panel 2: Full-body BACK view showing hair, outfit from behind
- Panel 3: CLOSE-UP face grid showing: neutral, happy, sad, angry expressions

Rules:
- 120-180 words total
- White/light grey background for clean isolation
- Consistent proportions across all panels
- Include specific details: skin tone, hair style/color, eye color, clothing details
- Edge-to-edge composition, no empty space

Return ONLY the image generation prompt text, nothing else.`;

            case "environment":
                return `Generate a VEO3 ENVIRONMENT REFERENCE SHEET prompt for image generation.

Entity: "${entity.name}"
Description: ${entity.description}${styleDirective}

Create a SINGLE IMAGE prompt that describes a multi-panel environment reference:
- Panel 1: Wide ESTABLISHING SHOT showing full environment
- Panel 2: MEDIUM shot from different angle
- Panel 3: DETAIL panels showing key textures, props, atmospheric elements

Rules:
- 120-180 words total
- Consistent lighting and time-of-day across panels
- Include: architecture style, vegetation, weather, ambient lighting
- Edge-to-edge composition

Return ONLY the image generation prompt text.`;

            case "prop":
            default:
                return `Generate a VEO3 PROP REFERENCE SHEET prompt for image generation.

Entity: "${entity.name}"
Description: ${entity.description}${styleDirective}

Create a SINGLE IMAGE prompt that describes a multi-panel prop reference:
- Panel 1: HERO shot at 3/4 angle
- Panel 2: ORTHOGRAPHIC views (front, side, top)
- Panel 3: DETAIL close-ups of key features, textures, markings

Rules:
- 100-150 words total
- Clean white background
- Show scale reference if applicable

Return ONLY the image generation prompt text.`;
        }
    }

    private buildFallbackPrompt(entity: EntityOutput): string {
        return `A detailed multi-panel reference sheet of ${entity.name}: ${entity.description}. Clean white background, multiple angles, consistent style.`;
    }
}
