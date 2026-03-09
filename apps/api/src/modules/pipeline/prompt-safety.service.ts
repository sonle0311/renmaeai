/**
 * Prompt Safety Service — Policy Negatives + Compliance
 *
 * Port from v1 prompt_safety.py.
 * Core Analysis §4: "Màng lọc cực kỳ quan trọng để đảm bảo
 * video ra mắt không bị fail hoặc vi phạm policy."
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../ai/ai-client.service';
import type { UserAISettings } from '../ai/ai-client.types';

// ═══════════════════════════════════════════════════════════════
// POLICY NEGATIVES — Google Generative AI Terms of Service
// ═══════════════════════════════════════════════════════════════

const POLICY_NEGATIVE = [
    'no minors in unsafe situations',
    'no violence or gore',
    'no weapons aimed at people',
    'no nudity or sexually explicit content',
    'no hate symbols',
    'no real person likeness',
    'no copyrighted characters',
    'no illegal activity depictions',
].join(', ');

const TECHNICAL_NEGATIVE = [
    'no blurry',
    'no distorted faces',
    'no extra limbs',
    'no floating objects',
    'no mutated hands',
    'no extra fingers',
    'no watermark',
    'no text overlays',
    'no out of frame',
    'no morphed faces',
].join(', ');

// ═══════════════════════════════════════════════════════════════
// VEO MODE-SPECIFIC NEGATIVES
// ═══════════════════════════════════════════════════════════════

const VIDEO_MODE_NEGATIVES: Record<string, string> = {
    text_to_video: 'no blurry, no distorted faces, no extra limbs, no floating objects',
    ingredients_to_video: 'no identity drift, no wardrobe change, no appearance shift, no expression mismatch',
    first_last_frame: 'no abrupt jump cuts, no teleporting objects, no inconsistent lighting changes',
    scenebuilder: 'no repeated frames, no identity drift across scenes, no inconsistent settings',
};

@Injectable()
export class PromptSafetyService {
    private readonly logger = new Logger(PromptSafetyService.name);

    constructor(private readonly aiClient: AiClientService) { }

    /** Build complete negative suffix for image prompts */
    buildImageNegative(): string {
        return `Negative: ${POLICY_NEGATIVE}, ${TECHNICAL_NEGATIVE}`;
    }

    /** Build complete negative suffix for video prompts */
    buildVideoNegative(): string {
        return `Negative: ${POLICY_NEGATIVE}, ${TECHNICAL_NEGATIVE}`;
    }

    /** Build negative suffix for video prompts with VEO mode-specific additions */
    buildVideoNegativeWithMode(veoMode: string): string {
        const modeNeg = VIDEO_MODE_NEGATIVES[veoMode] || '';
        return `Negative: ${POLICY_NEGATIVE}, ${TECHNICAL_NEGATIVE}${modeNeg ? ', ' + modeNeg : ''}`;
    }

    /**
     * AI-powered content compliance check.
     * Reviews prompts against Google's policies before dispatch.
     */
    async checkContentCompliance(
        settings: UserAISettings,
        prompts: Array<{ sceneId: number; prompt: string; type: 'image' | 'video' }>,
    ): Promise<{
        compliant: boolean;
        violations: Array<{
            sceneId: number;
            rule: string;
            severity: 'warning' | 'critical';
            suggestion: string;
        }>;
    }> {
        if (prompts.length === 0) {
            return { compliant: true, violations: [] };
        }

        const promptList = prompts
            .map(p => `Scene ${p.sceneId} (${p.type}): ${p.prompt}`)
            .join('\n\n');

        const checkPrompt = `You are a content safety reviewer. Check these ${prompts.length} AI generation prompts against Google's Generative AI policies:

PROMPTS TO CHECK:
${promptList}

CHECK FOR:
1. Violence, gore, weapons
2. Nudity, sexual content
3. Minors in unsafe situations
4. Hate speech, discrimination
5. Real person likeness without consent
6. Copyrighted characters
7. Illegal activities

Return JSON:
{"compliant": true/false, "violations": [{"scene_id": 1, "rule": "description", "severity": "warning or critical", "suggestion": "how to fix"}]}

If ALL prompts are safe, return: {"compliant": true, "violations": []}
Return ONLY JSON.`;

        try {
            const response = await this.aiClient.generate(settings, checkPrompt, {
                temperature: 0.1,
            });

            const data = this.parseJson(response.text) as {
                compliant?: boolean;
                violations?: Array<Record<string, unknown>>;
            } | null;
            if (!data) return { compliant: true, violations: [] };

            return {
                compliant: data.compliant !== false,
                violations: (data.violations || []).map((v) => ({
                    sceneId: (v.scene_id as number) || 0,
                    rule: (v.rule as string) || '',
                    severity: ((v.severity as string) || 'warning') as 'warning' | 'critical',
                    suggestion: (v.suggestion as string) || '',
                })),
            };
        } catch (error) {
            this.logger.warn(`Compliance check failed: ${error.message}`);
            return { compliant: true, violations: [] };
        }
    }

    private parseJson(text: string): Record<string, unknown> | null {
        let clean = text.trim();
        if (clean.startsWith('```')) {
            clean = clean.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '');
        }
        const start = clean.indexOf('{');
        if (start === -1) return null;
        let braceCount = 0;
        let end = start;
        for (let i = start; i < clean.length; i++) {
            if (clean[i] === '{') braceCount++;
            if (clean[i] === '}') braceCount--;
            if (braceCount === 0) { end = i + 1; break; }
        }
        try { return JSON.parse(clean.slice(start, end)); } catch { return null; }
    }
}
