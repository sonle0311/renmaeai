/**
 * Concept Analysis Service (AI Director)
 *
 * Analyzes script text to extract:
 * - Genre classification
 * - 3-act emotional arc
 * - Genre-specific visual rules
 * - Character identity phrase lock
 * - Key narrative moments with voiceover relationships
 *
 * V1 ref: ScriptWorkflow.tsx analyzeConcept() + script_workflow.py
 */

import { Injectable, Logger } from "@nestjs/common";
import { AiClientService } from "../ai/ai-client.service";
import type { UserAISettings } from "../ai/ai-client.types";
import type { ConceptAnalysisInput, ConceptAnalysisOutput } from "./pipeline.types";

@Injectable()
export class ConceptAnalysisService {
    private readonly logger = new Logger(ConceptAnalysisService.name);

    constructor(private readonly aiClient: AiClientService) { }

    async analyze(
        settings: UserAISettings,
        input: ConceptAnalysisInput,
    ): Promise<ConceptAnalysisOutput> {
        const prompt = this.buildPrompt(input.script, input.language);

        const response = await this.aiClient.generate(settings, prompt, {
            temperature: 0.4,
            model: settings.geminiModel || undefined,
        });

        return this.parseResponse(response.text);
    }

    private buildPrompt(script: string, language?: string): string {
        const scriptPreview = script.slice(0, 3000);

        return `You are an AI Film Director. Analyze this script and provide creative direction.

══ SCRIPT ══
${scriptPreview}
${script.length > 3000 ? "\n[...truncated, analyze based on above sample...]" : ""}

══ TASK ══
Analyze the script and return a JSON object with these fields:

1. "genre": Primary genre of the content (e.g., "Documentary", "Drama", "Horror", "Comedy", "Educational")
2. "emotionalArc": 3-act structure
   - "act_1": { "tone": "...", "visual": "..." } (Setup - first 30%)
   - "act_2": { "tone": "...", "visual": "..." } (Confrontation - middle 40%)
   - "act_3": { "tone": "...", "visual": "..." } (Resolution - final 30%)
3. "genreBlock": 2-3 sentences of genre-specific visual rules. E.g., for Horror: "Low-key lighting, Dutch angles, shallow DOF to isolate subjects. Muted desaturated palette with occasional red accents."
4. "characterPhrase": A single phrase describing the main character's visual identity that should appear in EVERY scene prompt. E.g., "a young Vietnamese woman in a white áo dài, long black hair"
5. "keyMoments": Array of max 5 key narrative moments:
   - "scene_keyword": what triggers this moment
   - "type": "CLX" (climax) | "TWS" (twist) | "REV" (reveal) | "SET" (setup) | "RES" (resolution)
   - "voiceover_rel": "ILL" (illustrate) | "CTR" (counterpoint) | "AMP" (amplify) | "FSH" (foreshadow) | "REV" (reveal)

Return ONLY valid JSON, no markdown fences.`;
    }

    private parseResponse(text: string): ConceptAnalysisOutput {
        try {
            // Strip markdown fences if present
            const cleaned = text
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/g, "")
                .trim();

            const parsed = JSON.parse(cleaned);

            return {
                genre: parsed.genre || "General",
                emotionalArc: {
                    act_1: parsed.emotionalArc?.act_1 || { tone: "neutral", visual: "establishing shots" },
                    act_2: parsed.emotionalArc?.act_2 || { tone: "building", visual: "medium shots" },
                    act_3: parsed.emotionalArc?.act_3 || { tone: "resolution", visual: "wide shots" },
                },
                genreBlock: parsed.genreBlock || "",
                characterPhrase: parsed.characterPhrase || "",
                keyMoments: Array.isArray(parsed.keyMoments)
                    ? parsed.keyMoments.slice(0, 5).map((km: any) => ({
                        scene_keyword: km.scene_keyword || "",
                        type: km.type || "SET",
                        voiceover_rel: km.voiceover_rel || "ILL",
                    }))
                    : [],
            };
        } catch (error) {
            this.logger.warn(`Failed to parse concept analysis response: ${error.message}`);
            return {
                genre: "General",
                emotionalArc: {
                    act_1: { tone: "neutral", visual: "establishing shots" },
                    act_2: { tone: "building", visual: "medium shots" },
                    act_3: { tone: "resolution", visual: "wide shots" },
                },
                genreBlock: "",
                characterPhrase: "",
                keyMoments: [],
            };
        }
    }
}
