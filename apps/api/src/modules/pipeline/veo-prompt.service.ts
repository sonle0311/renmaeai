/**
 * VEO Prompt Service — VEO 3.1 Prompt Routing (4 Modes)
 *
 * Port from v1 script_workflow.py VEO prompt router.
 * Core Analysis §3: "Xử lý prompt cho VEO 3.1 cực kỳ am hiểu đặc tính của model."
 *
 * 4 Modes:
 * - Text-to-Video: Full scene description from scratch
 * - Ingredients-to-Video: Motion/action focus (has reference images)
 * - First & Last Frame: Interpolation between 2 frames
 * - Scenebuilder: 100% self-contained prompts (NO memory across scenes)
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../ai/ai-client.service';
import type { UserAISettings } from '../ai/ai-client.types';
import type { Scene } from './script-engine.types';
import { VeoMode } from './script-engine.types';
import { PromptSafetyService } from './prompt-safety.service';

@Injectable()
export class VeoPromptService {
    private readonly logger = new Logger(VeoPromptService.name);

    constructor(
        private readonly aiClient: AiClientService,
        private readonly promptSafety: PromptSafetyService,
    ) { }

    /**
     * Generate VEO prompts for all scenes.
     * Routes each scene through the correct VEO mode prompt template.
     */
    async generateVeoPrompts(
        settings: UserAISettings,
        scenes: Scene[],
        veoMode: VeoMode,
        globalContext?: {
            visualTheme?: string;
            characterDescriptions?: string;
            environmentDescription?: string;
        },
    ): Promise<Scene[]> {
        const enrichedScenes: Scene[] = [];

        for (const scene of scenes) {
            const prompt = await this.buildVeoPrompt(
                settings, scene, veoMode,
                globalContext, scenes.length,
            );

            enrichedScenes.push({
                ...scene,
                veoPrompt: prompt,
                veoMode,
            });
        }

        // Append safety negatives
        const negative = this.promptSafety.buildVideoNegativeWithMode(veoMode);
        for (const scene of enrichedScenes) {
            if (scene.veoPrompt) {
                scene.veoPrompt += `\n\n${negative}`;
            }
        }

        this.logger.log(`Generated ${enrichedScenes.length} VEO prompts (mode: ${veoMode})`);
        return enrichedScenes;
    }

    private async buildVeoPrompt(
        settings: UserAISettings,
        scene: Scene,
        mode: VeoMode,
        context?: {
            visualTheme?: string;
            characterDescriptions?: string;
            environmentDescription?: string;
        },
        totalScenes?: number,
    ): Promise<string> {
        const aiPrompt = this.getAiPromptForMode(scene, mode, context, totalScenes);

        try {
            const response = await this.aiClient.generate(settings, aiPrompt, {
                temperature: 0.5,
                model: settings.geminiModel || undefined,
            });
            return response.text.trim();
        } catch (error) {
            this.logger.warn(`VEO prompt generation failed for scene ${scene.id}: ${error.message}`);
            return this.buildFallbackPrompt(scene, mode);
        }
    }

    private getAiPromptForMode(
        scene: Scene,
        mode: VeoMode,
        context?: {
            visualTheme?: string;
            characterDescriptions?: string;
            environmentDescription?: string;
        },
        totalScenes?: number,
    ): string {
        const visualTheme = context?.visualTheme || 'cinematic, warm lighting';
        const characters = context?.characterDescriptions || '';
        const environment = context?.environmentDescription || '';

        switch (mode) {
            case VeoMode.TEXT_TO_VIDEO:
                return `Create a VEO 3.1 text-to-video prompt for this scene voiceover:

"${scene.text}"

Rules:
- Describe the FULL visual scene from scratch: subject, environment, lighting, camera movement
- DO NOT include dialogue or voiceover text in the prompt
- Focus on visual storytelling that matches the narration mood
- Include: light source direction, camera angle, subject action
- Target duration: ${scene.estimatedDurationSeconds}s
- Visual theme: ${visualTheme}

Return ONLY the video generation prompt, nothing else.`;

            case VeoMode.INGREDIENTS_TO_VIDEO:
                return `Create a VEO 3.1 Ingredients-to-Video (I2V) prompt. VEO already has the reference character/environment image.

Scene voiceover: "${scene.text}"

Rules:
- DO NOT describe character appearance (VEO already knows from reference image)
- Focus ONLY on MOTION and ACTION: what happens, how characters move
- Describe camera movement and transitions
- Keep visual consistency with existing reference
${characters ? `- Characters present: ${characters}` : ''}
- Target duration: ${scene.estimatedDurationSeconds}s

Return ONLY the motion/action prompt.`;

            case VeoMode.FIRST_LAST_FRAME:
                return `Create a VEO 3.1 First & Last Frame prompt. VEO will interpolate between 2 keyframes.

Scene voiceover: "${scene.text}"

Rules:
- Describe WHAT HAPPENS between the first and last frame
- Focus on the TRANSITION and TRANSFORMATION
- DO NOT re-describe the frames themselves
- Duration: ${scene.estimatedDurationSeconds}s

Return ONLY the interpolation prompt.`;

            case VeoMode.SCENEBUILDER:
                // CRITICAL: Each scene must be 100% self-contained
                return `Create a VEO 3.1 Scenebuilder prompt for scene ${scene.id}/${totalScenes || '?'}.

⚠️ CRITICAL: VEO has NO MEMORY between scenes. This prompt must be 100% SELF-CONTAINED.
You MUST describe FROM SCRATCH:
- Full character appearance (age, clothing, hair, skin tone)
- Complete environment (location, time of day, weather)
- Lighting setup (source, direction, quality)
- Camera angle and movement

Scene voiceover: "${scene.text}"

${characters ? `Character descriptions (RE-DESCRIBE fully): ${characters}` : ''}
${environment ? `Environment: ${environment}` : ''}
Visual theme: ${visualTheme}
Duration: ${scene.estimatedDurationSeconds}s

❌ BANNED: Do NOT include dialogue, voiceover, spoken quotes, whispers, or any audio descriptions.
✅ ONLY describe visual elements.

Return ONLY the self-contained video prompt.`;

            default:
                return this.getAiPromptForMode(scene, VeoMode.SCENEBUILDER, context, totalScenes);
        }
    }

    private buildFallbackPrompt(scene: Scene, mode: VeoMode): string {
        return `Cinematic scene depicting: ${scene.text.slice(0, 200)}. Duration: ${scene.estimatedDurationSeconds}s. Style: ${mode}.`;
    }
}
