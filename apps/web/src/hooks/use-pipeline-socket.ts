"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface PipelineStep {
    stepNumber: number;
    stepName: string;
    status: "pending" | "processing" | "completed" | "failed" | "skipped";
    percentage?: number;
    message?: string;
    output?: Record<string, unknown>;
}

interface PipelineState {
    steps: PipelineStep[];
    currentStep: number;
    isCompleted: boolean;
    isFailed: boolean;
    errorMessage?: string;
}

const DEFAULT_STEPS: PipelineStep[] = [
    { stepNumber: 1, stepName: "YouTube Extract", status: "pending" },
    { stepNumber: 2, stepName: "Style Analysis", status: "pending" },
    { stepNumber: 3, stepName: "Script Generation", status: "pending" },
    { stepNumber: 4, stepName: "Scene Splitting", status: "pending" },
    { stepNumber: 5, stepName: "AI Director", status: "pending" },
    { stepNumber: 6, stepName: "Voice TTS", status: "pending" },
    { stepNumber: 7, stepName: "Video Direction", status: "pending" },
    { stepNumber: 8, stepName: "VEO Prompts", status: "pending" },
    { stepNumber: 9, stepName: "Entity Extraction", status: "pending" },
    { stepNumber: 10, stepName: "Reference Prompts", status: "pending" },
    { stepNumber: 11, stepName: "Scene Builder", status: "pending" },
    { stepNumber: 12, stepName: "Metadata & SEO", status: "pending" },
    { stepNumber: 13, stepName: "Finalize", status: "pending" },
];

export function usePipelineSocket(productionId: string | null) {
    const socket = useSocket();
    const [state, setState] = useState<PipelineState>({
        steps: DEFAULT_STEPS.map(s => ({ ...s })),
        currentStep: 0,
        isCompleted: false,
        isFailed: false,
    });

    const resetState = useCallback(() => {
        setState({
            steps: DEFAULT_STEPS.map(s => ({ ...s })),
            currentStep: 0,
            isCompleted: false,
            isFailed: false,
        });
    }, []);

    // Fetch initial checkpoint state + output data from API
    useEffect(() => {
        if (!productionId) return;

        async function loadCheckpoints() {
            try {
                const res = await fetch(`/api/proxy/productions/${productionId}`);
                if (!res.ok) return;

                const data = await res.json();
                const checkpoints = data.checkpoints || [];
                const outputData = data.outputData || {};

                if (checkpoints.length === 0 && data.status === "QUEUED") return;

                const mappedSteps: PipelineStep[] = DEFAULT_STEPS.map(def => {
                    const cp = checkpoints.find((c: any) => c.stepNumber === def.stepNumber);
                    if (!cp) {
                        // Step has no checkpoint — if production is done, mark as skipped
                        if (data.status === "COMPLETED" || data.status === "FAILED") {
                            return { ...def, status: "skipped" as const };
                        }
                        return { ...def };
                    }

                    let status: PipelineStep["status"] = "pending";
                    if (cp.status === "SUCCESS") status = "completed";
                    else if (cp.status === "ERROR" || cp.status === "FAILED") status = "failed";
                    else if (cp.status === "PROCESSING") status = "processing";
                    else if (cp.status === "SKIPPED") status = "skipped";

                    // Build output from production outputData based on step
                    const output = buildStepOutput(def.stepNumber, outputData);

                    return {
                        ...def,
                        status,
                        output,
                        message: cp.errorMessage || undefined,
                    };
                });

                const allCompleted = mappedSteps.every(s =>
                    s.status === "completed" || s.status === "skipped"
                );
                const anyFailed = mappedSteps.some(s => s.status === "failed");

                setState({
                    steps: mappedSteps,
                    currentStep: data.currentStep || 0,
                    isCompleted: allCompleted || data.status === "COMPLETED",
                    isFailed: anyFailed || data.status === "FAILED",
                    errorMessage: data.errorMessage,
                });
            } catch {
                // silently fail — socket will update
            }
        }

        loadCheckpoints();
    }, [productionId]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !productionId) return;

        function handleStepStarted(data: { productionId: string; stepNumber: number; stepName: string }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                currentStep: data.stepNumber,
                steps: prev.steps.map(s =>
                    s.stepNumber === data.stepNumber
                        ? { ...s, status: "processing" as const, message: "Đang xử lý..." }
                        : s
                ),
            }));
        }

        function handleStepProgress(data: {
            productionId: string; stepNumber: number;
            substep: string; percentage: number; message: string;
        }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                steps: prev.steps.map(s =>
                    s.stepNumber === data.stepNumber
                        ? { ...s, percentage: data.percentage, message: data.message }
                        : s
                ),
            }));
        }

        function handleStepCompleted(data: { productionId: string; stepNumber: number }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                steps: prev.steps.map(s =>
                    s.stepNumber === data.stepNumber
                        ? { ...s, status: "completed" as const, percentage: 100, message: "Hoàn thành" }
                        : s
                ),
            }));
        }

        function handleStepOutput(data: { productionId: string; stepNumber: number; output: Record<string, unknown> }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                steps: prev.steps.map(s =>
                    s.stepNumber === data.stepNumber
                        ? { ...s, output: data.output }
                        : s
                ),
            }));
        }

        function handleCompleted(data: { productionId: string }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                isCompleted: true,
                steps: prev.steps.map(s =>
                    s.status === "pending" ? { ...s, status: "completed" as const } : s
                ),
            }));
        }

        function handleFailed(data: { productionId: string; stepNumber?: number; error: string }) {
            if (data.productionId !== productionId) return;
            setState(prev => ({
                ...prev,
                isFailed: true,
                errorMessage: data.error,
                steps: prev.steps.map(s => {
                    if (data.stepNumber) {
                        // Per-step failure — mark only this step as failed
                        return s.stepNumber === data.stepNumber
                            ? { ...s, status: "failed" as const, message: data.error }
                            : s;
                    }
                    // Legacy: mark any processing step as failed
                    return s.status === "processing"
                        ? { ...s, status: "failed" as const, message: data.error }
                        : s;
                }),
            }));
        }

        socket.on("pipeline:step:started", handleStepStarted);
        socket.on("pipeline:step:progress", handleStepProgress);
        socket.on("pipeline:step:completed", handleStepCompleted);
        socket.on("pipeline:step:output", handleStepOutput);
        socket.on("pipeline:completed", handleCompleted);
        socket.on("pipeline:step:failed", handleFailed);

        return () => {
            socket.off("pipeline:step:started", handleStepStarted);
            socket.off("pipeline:step:progress", handleStepProgress);
            socket.off("pipeline:step:completed", handleStepCompleted);
            socket.off("pipeline:step:output", handleStepOutput);
            socket.off("pipeline:completed", handleCompleted);
            socket.off("pipeline:step:failed", handleFailed);
        };
    }, [socket, productionId]);

    return { ...state, resetState };
}

/**
 * Build step-specific output from the production's full outputData.
 * Updated for 13-step pipeline.
 */
function buildStepOutput(stepNumber: number, outputData: any): Record<string, unknown> | undefined {
    switch (stepNumber) {
        case 1: {
            if (!outputData.inputsValidated) return undefined;
            return {
                scriptSource: outputData.scriptSource,
                youtubeMetadata: outputData.youtubeMetadata,
                workingScriptLength: outputData.workingScript?.length || 0,
                workingScript: outputData.workingScript,
            };
        }
        case 2: {
            if (outputData.hasStyleProfile === undefined) return undefined;
            return {
                hasStyleProfile: outputData.hasStyleProfile,
                styleProfile: outputData.styleProfile,
            };
        }
        case 3: {
            if (!outputData.generatedScript) return undefined;
            return {
                generatedScript: outputData.generatedScript,
                wordCount: outputData.wordCount,
                sectionsCount: outputData.sectionsCount,
                originalAnalysis: outputData.originalAnalysis,
                outlineA: outputData.outlineA,
                draftSections: outputData.draftSections,
            };
        }
        case 4: {
            if (!outputData.scenes?.length) return undefined;
            return {
                scenes: outputData.scenes,
                totalScenes: outputData.totalScenes,
            };
        }
        case 5: {
            // AI Director (Concept Analysis)
            if (!outputData.conceptAnalysis && outputData.conceptAnalysis !== null) return undefined;
            return {
                genre: outputData.conceptAnalysis?.genre,
                hasEmotionalArc: !!outputData.conceptAnalysis?.emotionalArc,
                characterPhrase: outputData.conceptAnalysis?.characterPhrase,
                keyMomentCount: outputData.conceptAnalysis?.keyMoments?.length || 0,
                conceptAnalysis: outputData.conceptAnalysis,
            };
        }
        case 6: {
            if (!outputData.ttsGenerated) return undefined;
            return {
                ttsGenerated: outputData.ttsGenerated,
                ttsProvider: outputData.ttsProvider,
                ttsVoice: outputData.ttsVoice,
                ttsAudioUrls: outputData.ttsAudioUrls,
                segmentCount: outputData.videoSegments?.length || 0,
                videoSegments: outputData.videoSegments,
            };
        }
        case 7: {
            // Video Direction
            if (!outputData.directionNotes?.length) return undefined;
            return {
                directionCount: outputData.directionNotes?.length || 0,
                sampleTags: outputData.directionNotes?.[0]?.tags || "",
                directionNotes: outputData.directionNotes,
            };
        }
        case 8: {
            if (!outputData.veoPromptsGenerated) return undefined;
            return {
                scenes: outputData.scenes,
                veoPromptsGenerated: outputData.veoPromptsGenerated,
                veoMode: outputData.veoMode,
            };
        }
        case 9: {
            // Entity Extraction
            if (!outputData.entities) return undefined;
            return {
                entityCount: outputData.entities?.length || 0,
                entities: outputData.entities,
            };
        }
        case 10: {
            // Reference Prompts
            if (!outputData.referencePrompts) return undefined;
            return {
                referencePromptCount: outputData.referencePrompts?.length || 0,
                entityNames: (outputData.referencePrompts || []).map((r: any) => r.entityName),
                referencePromptsText: outputData.referencePromptsText,
                referencePrompts: outputData.referencePrompts,
            };
        }
        case 11: {
            // Scene Builder Prompts
            if (!outputData.sceneBuilderPrompts) return undefined;
            return {
                sceneBuilderCount: outputData.sceneBuilderPrompts?.length || 0,
                sceneBuilderPromptsText: outputData.sceneBuilderPromptsText,
                sceneBuilderPrompts: outputData.sceneBuilderPrompts,
            };
        }
        case 12: {
            // Metadata / SEO
            return {
                hasTitle: !!outputData.youtubeTitle,
                hasDescription: !!outputData.youtubeDescription,
                hasThumbnail: !!outputData.thumbnailPrompt,
                youtubeTitle: outputData.youtubeTitle,
                youtubeDescription: outputData.youtubeDescription,
                thumbnailPrompt: outputData.thumbnailPrompt,
            };
        }
        case 13: {
            if (!outputData.finalizedAt) return undefined;
            return {
                finalizedAt: outputData.finalizedAt,
                readyForAssembly: outputData.readyForAssembly,
                totalDurationSeconds: outputData.totalDurationSeconds,
            };
        }
        default: return undefined;
    }
}
