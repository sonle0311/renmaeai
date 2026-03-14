/**
 * Pipeline Processor — BullMQ Worker (13-Step Full Pipeline)
 *
 * Phase A (Input): YouTube Extract → Style → Script → Scenes → AI Director
 * Phase B (Audio): Voice TTS
 * Phase C (Visual): Video Direction → VEO Prompts → Entity Extraction → Reference Prompts → Scene Builder
 * Phase D (Finalize): Metadata/SEO → Finalize
 *
 * Uses existing Prisma schema — stores intermediate data in outputData JSON.
 */

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { ScriptEngineService } from "../pipeline/script-engine.service";
import { SceneSplitterService } from "../pipeline/scene-splitter.service";
import { VeoPromptService } from "../pipeline/veo-prompt.service";
import { PromptSafetyService } from "../pipeline/prompt-safety.service";
import { YoutubeExtractService } from "../pipeline/youtube-extract.service";
import { TtsService } from "../pipeline/tts.service";
import { ConceptAnalysisService } from "../pipeline/concept-analysis.service";
import { VideoDirectionService } from "../pipeline/video-direction.service";
import { EntityExtractionService } from "../pipeline/entity-extraction.service";
import { ReferencePromptService } from "../pipeline/reference-prompt.service";
import { SceneBuilderPromptService } from "../pipeline/scene-builder-prompt.service";
import { VideoSegmentService } from "../pipeline/video-segment.service";
import type { UserAISettings } from "../ai/ai-client.types";
import { AiClientService } from "../ai/ai-client.service";
import type { ScriptPipelineInput, StyleA } from "../pipeline/script-engine.types";
import type {
    PipelineJobData,
    ProjectSettings,
    ProductionOutputData,
} from "../pipeline/pipeline.types";
import { PIPELINE_STEPS } from "../pipeline/pipeline.constants";

@Processor("pipeline")
export class PipelineProcessor extends WorkerHost {
    private readonly logger = new Logger(PipelineProcessor.name);

    constructor(
        private prisma: PrismaService,
        private realtimeGateway: RealtimeGateway,
        // Existing services
        private scriptEngine: ScriptEngineService,
        private sceneSplitter: SceneSplitterService,
        private veoPrompt: VeoPromptService,
        private promptSafety: PromptSafetyService,
        private youtubeExtract: YoutubeExtractService,
        private ttsService: TtsService,
        // NEW services (Phase 02)
        private conceptAnalysis: ConceptAnalysisService,
        private videoDirection: VideoDirectionService,
        private entityExtraction: EntityExtractionService,
        private referencePrompt: ReferencePromptService,
        private sceneBuilderPrompt: SceneBuilderPromptService,
        private videoSegment: VideoSegmentService,
        private aiClientService: AiClientService,
    ) {
        super();
    }

    async process(job: Job<PipelineJobData>): Promise<void> {
        const { productionId, userId, mediaGeneration } = job.data;
        this.logger.log(`Processing pipeline for production ${productionId}`);

        try {
            await this.prisma.production.update({
                where: { id: productionId },
                data: { status: "PROCESSING" },
            });

            // Fetch user (only needed fields) and production in parallel
            const [user, production] = await Promise.all([
                this.prisma.user.findUniqueOrThrow({
                    where: { id: userId },
                    select: { aiSettings: true, role: true },
                }),
                this.prisma.production.findUniqueOrThrow({
                    where: { id: productionId },
                    include: { project: { select: { globalSettings: true } } },
                }),
            ]);
            const aiSettings = (user.aiSettings || {}) as unknown as UserAISettings;

            const projectSettings = (production.project.globalSettings || {}) as unknown as ProjectSettings;
            let outputData = (production.outputData || {}) as unknown as ProductionOutputData;

            const checkpoints = await this.prisma.pipelineCheckpoint.findMany({
                where: { productionId },
                orderBy: { stepNumber: "asc" },
            });

            for (const checkpoint of checkpoints) {
                // Skip steps that already completed successfully
                if (checkpoint.status === "SUCCESS") {
                    this.logger.log(`[${productionId}] Step ${checkpoint.stepNumber} already SUCCESS — skipping`);

                    // Still emit output for already-completed steps so UI shows data
                    this.realtimeGateway.emitToUser(userId, "pipeline:step:output", {
                        productionId,
                        stepNumber: checkpoint.stepNumber,
                        output: this.getStepOutput(checkpoint.stepNumber, outputData),
                    });
                    continue;
                }

                await this.prisma.pipelineCheckpoint.update({
                    where: { id: checkpoint.id },
                    data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null },
                });

                this.realtimeGateway.emitToUser(userId, "pipeline:step:started", {
                    productionId,
                    stepNumber: checkpoint.stepNumber,
                    stepName: checkpoint.stepName,
                });

                // currentStep now updated inline with outputData in transaction below

                try {
                    // Process this step
                    outputData = await this.processStep(
                        checkpoint.stepNumber, productionId, userId,
                        aiSettings, projectSettings, outputData, production,
                    );

                    // ⚡ PERF: Merge outputData + checkpoint update into single transaction
                    // Avoids separate production.update(outputData) per step (was 13x writes)
                    await this.prisma.$transaction([
                        this.prisma.production.update({
                            where: { id: productionId },
                            data: { outputData: outputData as object, currentStep: checkpoint.stepNumber },
                        }),
                        this.prisma.pipelineCheckpoint.update({
                            where: { id: checkpoint.id },
                            data: { status: "SUCCESS", completedAt: new Date() },
                        }),
                    ]);

                    this.realtimeGateway.emitToUser(userId, "pipeline:step:completed", {
                        productionId,
                        stepNumber: checkpoint.stepNumber,
                    });

                    // Stream output data to client in real-time
                    this.realtimeGateway.emitToUser(userId, "pipeline:step:output", {
                        productionId,
                        stepNumber: checkpoint.stepNumber,
                        output: this.getStepOutput(checkpoint.stepNumber, outputData),
                    });
                } catch (stepError) {
                    // Mark THIS step as failed, not the whole pipeline
                    this.logger.error(`[${productionId}] Step ${checkpoint.stepNumber} failed: ${stepError.message}`);

                    await this.prisma.pipelineCheckpoint.update({
                        where: { id: checkpoint.id },
                        data: { status: "ERROR", errorMessage: stepError.message },
                    });

                    this.realtimeGateway.emitToUser(userId, "pipeline:step:failed", {
                        productionId,
                        stepNumber: checkpoint.stepNumber,
                        error: stepError.message,
                    });

                    // Stop pipeline execution — remaining steps stay PENDING
                    throw stepError;
                }
            }

            const pendingSteps = await this.prisma.pipelineCheckpoint.count({
                where: { productionId, status: { in: ["PENDING", "PROCESSING"] } },
            });

            if (pendingSteps === 0) {
                await this.markCompleted(productionId, userId);
            }
        } catch (error) {
            this.logger.error(`Pipeline failed for ${productionId}: ${error.message}`);
            await this.prisma.production.update({
                where: { id: productionId },
                data: { status: "FAILED", errorMessage: error.message },
            });

            // Refund video quota for non-admin users
            try {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true, usedVideoCount: true },
                });
                if (user && user.role !== "ADMIN" && user.usedVideoCount > 0) {
                    await this.prisma.$transaction(async (tx) => {
                        await tx.user.update({
                            where: { id: userId },
                            data: { usedVideoCount: { decrement: 1 } },
                        });
                        await tx.auditLog.create({
                            data: {
                                userId,
                                action: "refund_quota",
                                description: `Hoàn trả 1 video do pipeline lỗi (Production ${productionId})`,
                                metadata: { productionId, error: error.message?.substring(0, 200) },
                            },
                        });
                    });
                    this.logger.log(`[${productionId}] Refunded 1 video quota for user ${userId}`);
                }
            } catch (refundErr) {
                this.logger.error(`[${productionId}] Failed to refund quota: ${refundErr.message}`);
            }

            this.realtimeGateway.emitToUser(userId, "pipeline:step:failed", {
                productionId, error: error.message,
            });
        }
    }

    /**
     * Extract relevant output data for a specific step to stream to client.
     * Keeps socket payloads small by only sending what changed.
     */
    private getStepOutput(stepNumber: number, outputData: ProductionOutputData): Record<string, unknown> {
        switch (stepNumber) {
            case PIPELINE_STEPS.YOUTUBE_EXTRACT:
                return {
                    scriptSource: outputData.scriptSource,
                    youtubeMetadata: outputData.youtubeMetadata,
                    workingScriptLength: outputData.workingScript?.length || 0,
                    workingScript: outputData.workingScript,
                };
            case PIPELINE_STEPS.STYLE_ANALYSIS:
                return {
                    hasStyleProfile: outputData.hasStyleProfile,
                    styleProfile: outputData.styleProfile,
                };
            case PIPELINE_STEPS.SCRIPT_GENERATION:
                return {
                    generatedScript: outputData.generatedScript,
                    wordCount: outputData.wordCount,
                    sectionsCount: outputData.sectionsCount,
                    originalAnalysis: outputData.originalAnalysis,
                    outlineA: outputData.outlineA,
                    draftSections: outputData.draftSections,
                };
            case PIPELINE_STEPS.SCENE_SPLITTING:
                return {
                    scenes: outputData.scenes,
                    totalScenes: outputData.totalScenes,
                };
            case PIPELINE_STEPS.CONCEPT_ANALYSIS:
                return {
                    genre: outputData.conceptAnalysis?.genre,
                    hasEmotionalArc: !!outputData.conceptAnalysis?.emotionalArc,
                    characterPhrase: outputData.conceptAnalysis?.characterPhrase,
                    keyMomentCount: outputData.conceptAnalysis?.keyMoments?.length || 0,
                    conceptAnalysis: outputData.conceptAnalysis,
                };
            case PIPELINE_STEPS.VOICE_TTS:
                return {
                    ttsGenerated: outputData.ttsGenerated,
                    ttsProvider: outputData.ttsProvider,
                    ttsVoice: outputData.ttsVoice,
                    ttsAudioUrls: outputData.ttsAudioUrls,
                    segmentCount: outputData.videoSegments?.length || 0,
                    videoSegments: outputData.videoSegments,
                };
            case PIPELINE_STEPS.VIDEO_DIRECTION:
                return {
                    directionCount: outputData.directionNotes?.length || 0,
                    sampleTags: outputData.directionNotes?.[0]?.tags || "",
                    directionNotes: outputData.directionNotes,
                };
            case PIPELINE_STEPS.VEO_PROMPTS:
                return {
                    scenes: outputData.scenes,
                    veoPromptsGenerated: outputData.veoPromptsGenerated,
                    veoMode: outputData.veoMode,
                };
            case PIPELINE_STEPS.ENTITY_EXTRACTION:
                return {
                    entityCount: outputData.entities?.length || 0,
                    entities: outputData.entities,
                };
            case PIPELINE_STEPS.REFERENCE_PROMPTS:
                return {
                    referencePromptCount: outputData.referencePrompts?.length || 0,
                    entityNames: (outputData.referencePrompts || []).map((r) => r.entityName),
                    referencePromptsText: outputData.referencePromptsText,
                    referencePrompts: outputData.referencePrompts,
                };
            case PIPELINE_STEPS.SCENE_BUILDER_PROMPTS:
                return {
                    sceneBuilderCount: outputData.sceneBuilderPrompts?.length || 0,
                    sceneBuilderPromptsText: outputData.sceneBuilderPromptsText,
                    sceneBuilderPrompts: outputData.sceneBuilderPrompts,
                };
            case PIPELINE_STEPS.METADATA_SEO:
                return {
                    hasTitle: !!outputData.youtubeTitle,
                    hasDescription: !!outputData.youtubeDescription,
                    hasThumbnail: !!outputData.thumbnailPrompt,
                    youtubeTitle: outputData.youtubeTitle,
                    youtubeDescription: outputData.youtubeDescription,
                    thumbnailPrompt: outputData.thumbnailPrompt,
                };
            case PIPELINE_STEPS.FINALIZE:
                return {
                    finalizedAt: outputData.finalizedAt,
                    readyForAssembly: outputData.readyForAssembly,
                    totalDurationSeconds: outputData.totalDurationSeconds,
                };
            default:
                return {};
        }
    }

    private async processStep(
        stepNumber: number,
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
        production: { inputScript: string | null; youtubeUrl: string | null; language: string },
    ): Promise<ProductionOutputData> {
        switch (stepNumber) {
            case PIPELINE_STEPS.YOUTUBE_EXTRACT:
                return this.stepExtractInputs(productionId, projectSettings, outputData, production);
            case PIPELINE_STEPS.STYLE_ANALYSIS:
                return this.stepStyleAnalysis(productionId, projectSettings, outputData);
            case PIPELINE_STEPS.SCRIPT_GENERATION:
                return this.stepScriptGeneration(productionId, userId, aiSettings, projectSettings, outputData, production);
            case PIPELINE_STEPS.SCENE_SPLITTING:
                return this.stepSceneSplitting(productionId, projectSettings, outputData);
            case PIPELINE_STEPS.CONCEPT_ANALYSIS:
                return this.stepConceptAnalysis(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.VOICE_TTS:
                return this.stepTtsPreparation(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.VIDEO_DIRECTION:
                return this.stepVideoDirection(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.VEO_PROMPTS:
                return this.stepVeoPromptGeneration(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.ENTITY_EXTRACTION:
                return this.stepEntityExtraction(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.REFERENCE_PROMPTS:
                return this.stepReferencePrompts(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.SCENE_BUILDER_PROMPTS:
                return this.stepSceneBuilderPrompts(productionId, userId, aiSettings, projectSettings, outputData);
            case PIPELINE_STEPS.METADATA_SEO:
                return this.stepMetadataSeo(productionId, outputData, aiSettings, projectSettings);
            case PIPELINE_STEPS.FINALIZE:
                return this.stepFinalize(productionId, outputData);
            default:
                return outputData;
        }
    }

    // ─────────────────────────────────────────────────────
    // Step 1: Extract inputs
    // ─────────────────────────────────────────────────────

    private async stepExtractInputs(
        productionId: string,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
        production: { inputScript: string | null; youtubeUrl: string | null },
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 1: Extracting inputs...`);

        let workingScript = "";
        let scriptSource: "youtube" | "manual" | "project" = "manual";

        // Priority 1: YouTube URL → extract transcript
        if (production.youtubeUrl) {
            this.logger.log(`[${productionId}] Extracting from YouTube: ${production.youtubeUrl}`);
            const result = await this.youtubeExtract.extract(production.youtubeUrl);

            if (result.success && result.transcript) {
                workingScript = result.transcript;
                scriptSource = "youtube";
                this.logger.log(`[${productionId}] YouTube transcript: ${workingScript.length} chars`);

                // Auto-fill title if empty
                if (result.metadata?.title) {
                    await this.prisma.production.update({
                        where: { id: productionId },
                        data: { title: result.metadata.title },
                    });
                }

                return {
                    ...outputData,
                    inputsValidated: true,
                    workingScript,
                    scriptSource,
                    youtubeMetadata: result.metadata,
                };
            } else {
                this.logger.warn(`[${productionId}] YouTube extract failed: ${result.error}`);
            }
        }

        // Priority 2: Manual script
        if (production.inputScript) {
            workingScript = production.inputScript;
            scriptSource = "manual";
            this.logger.log(`[${productionId}] Using manual script: ${workingScript.length} chars`);
        }
        // Priority 3: Project default script
        else if (projectSettings.script) {
            workingScript = projectSettings.script;
            scriptSource = "project";
            this.logger.log(`[${productionId}] Using project script: ${workingScript.length} chars`);
        }

        if (!workingScript) {
            throw new Error("No input script found. Provide a YouTube URL or manual script.");
        }

        return {
            ...outputData,
            inputsValidated: true,
            workingScript,
            scriptSource,
        };
    }

    // ─────────────────────────────────────────────────────
    // Step 2: Style Analysis
    // ─────────────────────────────────────────────────────

    private async stepStyleAnalysis(
        productionId: string,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 2: Style analysis...`);
        // For now, just check if StyleA exists in project settings
        const styleProfile = projectSettings.styleA;
        const hasStyleProfile = !!styleProfile;
        this.logger.log(`[${productionId}] Step 2: Style profile ${hasStyleProfile ? "found" : "not found"}`);
        return { ...outputData, hasStyleProfile, styleProfile };
    }

    // ─────────────────────────────────────────────────────
    // Step 3: Script Generation (12-step AI pipeline)
    // ─────────────────────────────────────────────────────

    private async stepScriptGeneration(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
        production: { language: string },
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 3: Generating script...`);

        const originalScript = outputData.workingScript || "";
        const language = projectSettings.language || production.language || "vi";

        if (!originalScript) {
            throw new Error("No working script found. Step 1 may have failed.");
        }

        const pipelineInput: ScriptPipelineInput = {
            originalScript,
            targetWordCount: projectSettings.targetWordCount || 800,
            language,
            dialect: projectSettings.dialect,
            channelName: projectSettings.channelName,
            country: projectSettings.country,
            addQuiz: projectSettings.addQuiz || false,
            valueType: projectSettings.valueType,
            storytellingStyle: projectSettings.storytellingStyle,
            narrativeVoice: projectSettings.narrativeVoice,
            customNarrativeVoice: projectSettings.customNarrativeVoice,
            audienceAddress: projectSettings.audienceAddress,
            customAudienceAddress: projectSettings.customAudienceAddress,
            styleProfile: projectSettings.styleA,
            sourceLanguage: projectSettings.sourceLanguage,
        };

        const result = await this.scriptEngine.runPipeline(
            aiSettings, pipelineInput,
            (step, pct, msg) => {
                this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
                    productionId, stepNumber: 3,
                    substep: step, percentage: pct, message: msg,
                });
            },
        );

        if (!result.success) {
            throw new Error(`Script generation failed: ${result.error}`);
        }

        this.logger.log(`[${productionId}] Step 3: Script generated (${result.wordCount} words)`);
        return {
            ...outputData,
            generatedScript: result.finalScript,
            wordCount: result.wordCount,
            sectionsCount: result.draftSections?.length || 0,
            originalAnalysis: result.originalAnalysis,
            outlineA: result.outlineA,
            draftSections: result.draftSections,
        };
    }

    // ─────────────────────────────────────────────────────
    // Step 4: Scene Splitting
    // ─────────────────────────────────────────────────────

    private async stepSceneSplitting(
        productionId: string,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 4: Splitting scenes...`);

        const script = outputData.generatedScript || "";
        const language = projectSettings.language || "en";

        if (!script) {
            throw new Error("No generated script found. Step 3 may have failed.");
        }

        const scenes = this.sceneSplitter.splitToScenes(script, language);

        this.logger.log(`[${productionId}] Step 4: ${scenes.length} scenes created`);
        return { ...outputData, scenes, totalScenes: scenes.length };
    }

    // ─────────────────────────────────────────────────────
    // Step 5: Concept Analysis (AI Director) — NON-BLOCKING
    // ─────────────────────────────────────────────────────

    private async stepConceptAnalysis(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 5: Concept Analysis (AI Director)...`);

        const script = outputData.generatedScript || outputData.workingScript || "";

        try {
            const result = await this.conceptAnalysis.analyze(aiSettings, {
                script,
                language: projectSettings.language,
            });

            this.logger.log(`[${productionId}] Step 5: AI Director → genre="${result.genre}", ${result.keyMoments.length} key moments`);

            this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
                productionId,
                stepNumber: 5,
                message: `Genre: ${result.genre} | ${result.keyMoments.length} key moments`,
            });

            return { ...outputData, conceptAnalysis: result };
        } catch (err) {
            // Non-blocking — pipeline continues without AI Director context
            this.logger.warn(`[${productionId}] Step 5: Concept analysis failed (non-blocking): ${err.message}`);
            return { ...outputData, conceptAnalysis: null };
        }
    }

    // ─────────────────────────────────────────────────────
    // Step 6: Voice TTS + Video Segments
    // ─────────────────────────────────────────────────────

    private async stepTtsPreparation(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 6: Generating TTS audio...`);

        if (!outputData.scenes || outputData.scenes.length === 0) {
            throw new Error("No scenes found. Step 4 may have failed.");
        }

        const ttsProvider = (aiSettings as any).tts_provider || "edge-tts";
        const ttsVoice = (aiSettings as any).tts_voice || "vi-VN-HoaiMyNeural";

        this.logger.log(`[${productionId}] Step 6: TTS provider=${ttsProvider}, voice=${ttsVoice}`);

        // Generate audio for each scene
        const ttsResults: Array<{ sceneId: number; audioUrl: string; durationSeconds: number; text: string }> = [];

        for (let i = 0; i < outputData.scenes.length; i++) {
            const scene = outputData.scenes[i];
            const cleanedText = this.cleanForTts(scene.text);

            // Rate-limit: wait between requests to avoid Microsoft 403
            if (i > 0) {
                await this.sleep(1500);
            }

            let success = false;
            let lastError: Error | null = null;

            // Retry up to 3 attempts with exponential backoff
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const result = await this.ttsService.synthesize({
                        text: cleanedText,
                        voice: ttsVoice,
                        productionId,
                        sceneId: scene.id,
                    });

                    ttsResults.push({
                        sceneId: scene.id,
                        audioUrl: result.audioUrl,
                        durationSeconds: result.durationSeconds,
                        text: cleanedText,
                    });

                    // Stream progress per scene
                    this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
                        productionId,
                        stepNumber: 6,
                        percentage: Math.round(((i + 1) / outputData.scenes.length) * 100),
                        message: `TTS ${i + 1}/${outputData.scenes.length} cảnh`,
                    });
                    success = true;
                    break;
                } catch (error) {
                    lastError = error;
                    const is403 = error.message?.includes("403");
                    if (is403 && attempt < 2) {
                        const backoffMs = 2000 * Math.pow(2, attempt);
                        this.logger.warn(`[${productionId}] TTS scene ${scene.id} got 403, retry ${attempt + 1}/2 after ${backoffMs}ms`);
                        await this.sleep(backoffMs);
                    } else {
                        break;
                    }
                }
            }

            if (!success) {
                this.logger.warn(`[${productionId}] TTS failed for scene ${scene.id}: ${lastError?.message}`);
                ttsResults.push({
                    sceneId: scene.id,
                    audioUrl: "",
                    durationSeconds: scene.estimatedDurationSeconds,
                    text: cleanedText,
                });
            }
        }

        // Build 8s video segments from TTS durations
        const videoSegments = this.videoSegment.build({
            scenes: ttsResults.map((t) => ({
                sceneId: t.sceneId,
                content: t.text,
                voiceDurationSeconds: t.durationSeconds,
            })),
        });

        this.logger.log(`[${productionId}] Step 6: TTS completed for ${ttsResults.length} scenes, ${videoSegments.length} segments`);

        return {
            ...outputData,
            ttsGenerated: true,
            ttsProvider,
            ttsVoice,
            ttsAudioUrls: ttsResults,
            videoSegments,
        };
    }

    // ─────────────────────────────────────────────────────
    // Step 7: Video Direction Analysis (6 Pillars)
    // ─────────────────────────────────────────────────────

    private async stepVideoDirection(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 7: Video Direction Analysis...`);

        if (!outputData.scenes?.length) {
            throw new Error("No scenes — run scene splitting first");
        }

        const directions = await this.videoDirection.analyze(
            aiSettings,
            {
                scenes: outputData.scenes.map((s) => ({
                    sceneId: s.id,
                    content: s.text,
                })),
                language: projectSettings.language,
                promptStyle: projectSettings.promptStyle || projectSettings.visualTheme,
                mainCharacter: projectSettings.mainCharacter,
                environmentDescription: projectSettings.environmentDescription,
                conceptAnalysis: outputData.conceptAnalysis,
            },
            (message, percentage) => {
                this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
                    productionId,
                    stepNumber: 7,
                    message,
                    percentage,
                });
            },
        );

        this.logger.log(`[${productionId}] Step 7: ${directions.length} direction notes generated`);

        // Enrich scenes with direction data
        const enrichedScenes = outputData.scenes.map((scene) => {
            const dir = directions.find((d) => d.sceneId === scene.id);
            return {
                ...scene,
                directionNotes: dir?.directionNotes,
                directionTags: dir?.tags,
            };
        });

        return { ...outputData, scenes: enrichedScenes, directionNotes: directions };
    }

    // ─────────────────────────────────────────────────────
    // Step 8: VEO Prompt Generation (4 modes)
    // ─────────────────────────────────────────────────────

    private async stepVeoPromptGeneration(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 8: Generating VEO prompts...`);

        if (!outputData.scenes || outputData.scenes.length === 0) {
            throw new Error("No scenes found. Step 4 may have failed.");
        }

        // Use mode from project settings (not hardcoded anymore!)
        const veoMode = (projectSettings.veoMode || "scenebuilder") as any;
        const enrichedScenes = await this.veoPrompt.generateVeoPrompts(
            aiSettings,
            outputData.scenes as any,
            veoMode,
            {
                visualTheme: projectSettings.visualTheme || "cinematic, warm lighting",
                characterDescriptions: projectSettings.mainCharacter,
                environmentDescription: projectSettings.environmentDescription,
            },
        );

        this.logger.log(`[${productionId}] Step 8: VEO prompts generated for ${enrichedScenes.length} scenes (mode: ${veoMode})`);

        this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
            productionId,
            stepNumber: 8,
            message: `${enrichedScenes.length} VEO prompts (${veoMode})`,
        });

        return {
            ...outputData,
            scenes: enrichedScenes as any,
            veoPromptsGenerated: true,
            veoMode,
        };
    }

    // ─────────────────────────────────────────────────────
    // Step 9: Entity Extraction
    // ─────────────────────────────────────────────────────

    private async stepEntityExtraction(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 9: Entity Extraction...`);

        const videoPrompts = (outputData.scenes || [])
            .filter((s) => s.veoPrompt)
            .map((s) => ({ sceneId: s.id, videoPrompt: s.veoPrompt! }));

        if (videoPrompts.length === 0) {
            this.logger.warn(`[${productionId}] Step 9: No video prompts found — skipping entity extraction`);
            return { ...outputData, entities: [] };
        }

        const entities = await this.entityExtraction.extract(aiSettings, {
            videoPrompts,
            scriptScenes: (outputData.scenes || []).map((s) => ({
                sceneId: s.id,
                content: s.text,
            })),
            language: projectSettings.language,
        });

        this.logger.log(`[${productionId}] Step 9: Extracted ${entities.length} entities`);

        this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
            productionId,
            stepNumber: 9,
            message: `${entities.length} nhân vật/bối cảnh/đạo cụ`,
        });

        return { ...outputData, entities };
    }

    // ─────────────────────────────────────────────────────
    // Step 10: Reference Image Prompts
    // ─────────────────────────────────────────────────────

    private async stepReferencePrompts(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 10: Reference Image Prompts...`);

        if (!outputData.entities?.length) {
            this.logger.log(`[${productionId}] Step 10: No entities — skipping`);
            return { ...outputData, referencePrompts: [], referencePromptsText: "" };
        }

        const result = await this.referencePrompt.generate(aiSettings, {
            entities: outputData.entities,
            promptStyle: projectSettings.promptStyle || projectSettings.visualTheme,
        });

        const refText = result
            .map((r) => `[${r.entityName}] (${r.entityType}):\n${r.prompt}`)
            .join("\n\n---\n\n");

        this.logger.log(`[${productionId}] Step 10: ${result.length} reference prompts`);

        return { ...outputData, referencePrompts: result, referencePromptsText: refText };
    }

    // ─────────────────────────────────────────────────────
    // Step 11: Scene Builder Prompts
    // ─────────────────────────────────────────────────────

    private async stepSceneBuilderPrompts(
        productionId: string,
        userId: string,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 11: Scene Builder Prompts...`);

        if (!outputData.entities?.length || !outputData.scenes?.some((s) => s.veoPrompt)) {
            this.logger.log(`[${productionId}] Step 11: No entities or prompts — skipping`);
            return { ...outputData, sceneBuilderPrompts: [], sceneBuilderPromptsText: "" };
        }

        const result = await this.sceneBuilderPrompt.generate(
            aiSettings,
            {
                videoPrompts: outputData.scenes
                    .filter((s) => s.veoPrompt)
                    .map((s) => ({ sceneId: s.id, videoPrompt: s.veoPrompt! })),
                entities: outputData.entities,
                directions: outputData.directionNotes,
                promptStyle: projectSettings.promptStyle || projectSettings.visualTheme,
                veoMode: projectSettings.veoMode,
            },
            (message, percentage) => {
                this.realtimeGateway.emitToUser(userId, "pipeline:step:progress", {
                    productionId,
                    stepNumber: 11,
                    message,
                    percentage,
                });
            },
        );

        const sbText = result.map((sb) => `Scene ${sb.sceneId}: ${sb.prompt}`).join("\n\n");

        this.logger.log(`[${productionId}] Step 11: ${result.length} scene builder prompts`);

        return { ...outputData, sceneBuilderPrompts: result, sceneBuilderPromptsText: sbText };
    }

    // ─────────────────────────────────────────────────────
    // Step 12: Metadata / SEO — AI-generated title, description, thumbnail
    // ─────────────────────────────────────────────────────

    private async stepMetadataSeo(
        productionId: string,
        outputData: ProductionOutputData,
        aiSettings: UserAISettings,
        projectSettings: ProjectSettings,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 12: Generating Metadata/SEO...`);

        const script = outputData.generatedScript || outputData.workingScript || "";
        const language = projectSettings.language || "vi";
        const channelName = projectSettings.channelName || "";
        const fallbackTitle = outputData.youtubeMetadata?.title || "";

        if (!script) {
            this.logger.warn(`[${productionId}] Step 12: No script found — using fallback metadata`);
            return {
                ...outputData,
                youtubeTitle: fallbackTitle,
                youtubeDescription: "",
                thumbnailPrompt: "",
            };
        }

        // Truncate script to first 3000 chars for prompt efficiency
        const scriptExcerpt = script.substring(0, 3000);

        const prompt = `You are a YouTube SEO expert. Based on the video script below, generate:
1. A compelling YouTube TITLE (max 70 characters, includes main keyword)
2. A YouTube DESCRIPTION (max 400 characters, hooks viewer, includes keywords)
3. A THUMBNAIL PROMPT for AI image generation (describe a visually striking scene)[Language: ${language}][Channel: ${channelName || "General"}]

Script excerpt:
"""${scriptExcerpt}"""

Respond ONLY with valid JSON (no markdown):
{
  "title": "...",
  "description": "...",
  "thumbnailPrompt": "..."
}`;

        try {
            const result = await this.aiClientService.generate(aiSettings, prompt, { temperature: 0.7 });
            const raw = result.text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(raw) as { title?: string; description?: string; thumbnailPrompt?: string };

            const youtubeTitle = (parsed.title || fallbackTitle).substring(0, 100);
            const youtubeDescription = (parsed.description || "").substring(0, 500);
            const thumbnailPrompt = parsed.thumbnailPrompt || "";

            this.logger.log(`[${productionId}] Step 12: SEO generated — title="${youtubeTitle.substring(0, 50)}..."`);

            return { ...outputData, youtubeTitle, youtubeDescription, thumbnailPrompt };
        } catch (err) {
            // Non-blocking: pipeline continues with fallback values
            this.logger.warn(`[${productionId}] Step 12: AI SEO generation failed (non-blocking): ${err.message}`);
            return {
                ...outputData,
                youtubeTitle: fallbackTitle,
                youtubeDescription: "",
                thumbnailPrompt: "",
            };
        }
    }

    // ─────────────────────────────────────────────────────
    // Step 13: Finalize
    // ─────────────────────────────────────────────────────

    private async stepFinalize(
        productionId: string,
        outputData: ProductionOutputData,
    ): Promise<ProductionOutputData> {
        this.logger.log(`[${productionId}] Step 13: Finalizing...`);

        const totalDuration = (outputData.ttsAudioUrls || []).reduce(
            (sum, t) => sum + (t.durationSeconds || 0),
            0,
        ) || (outputData.scenes || []).reduce(
            (sum, s) => sum + (s.estimatedDurationSeconds || 0),
            0,
        );

        return {
            ...outputData,
            finalizedAt: new Date().toISOString(),
            readyForAssembly: true,
            totalDurationSeconds: totalDuration,
        };
    }

    // ─────────────────────────────────────────────────────
    // Utility methods
    // ─────────────────────────────────────────────────────

    private cleanForTts(text: string): string {
        return text
            .replace(/[\[\]{}()*_~`]/g, "")
            .replace(/"{2,}/g, "\"")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s{2,}/g, " ")
            .trim();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async markCompleted(productionId: string, userId: string): Promise<void> {
        await this.prisma.production.update({
            where: { id: productionId },
            data: { status: "COMPLETED" },
        });
        this.realtimeGateway.emitToUser(userId, "pipeline:completed", { productionId });
        this.logger.log(`Pipeline completed for production ${productionId}`);
    }
}
