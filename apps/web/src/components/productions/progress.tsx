"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePipelineSocket } from "@/hooks/use-pipeline-socket";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
    Youtube, Palette, FileText, Scissors,
    Video, Mic, CheckCircle, Loader2, XCircle,
    Clock, SkipForward, Copy, Check, ChevronRight,
    Volume2, Sparkles, RefreshCw, Maximize2,
    Brain, Clapperboard, Users, Image, LayoutGrid, BarChart3,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { StepVisualizerRouter } from "./step-visualizer";

const STEP_ICONS: Record<number, React.ReactNode> = {
    1: <Youtube className="h-4 w-4" />,
    2: <Palette className="h-4 w-4" />,
    3: <FileText className="h-4 w-4" />,
    4: <Scissors className="h-4 w-4" />,
    5: <Brain className="h-4 w-4" />,
    6: <Mic className="h-4 w-4" />,
    7: <Clapperboard className="h-4 w-4" />,
    8: <Sparkles className="h-4 w-4" />,
    9: <Users className="h-4 w-4" />,
    10: <Image className="h-4 w-4" />,
    11: <LayoutGrid className="h-4 w-4" />,
    12: <BarChart3 className="h-4 w-4" />,
    13: <CheckCircle className="h-4 w-4" />,
};

const STEP_LABELS: Record<number, string> = {
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

/** Phase groups for visual separation */
const PHASE_GROUPS = [
    { label: "📥 Chuẩn bị", steps: [1, 2, 3, 4, 5] },
    { label: "🗣️ Audio", steps: [6] },
    { label: "🎬 Visual", steps: [7, 8, 9, 10, 11] },
    { label: "📦 Hoàn tất", steps: [12, 13] },
];

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case "processing": return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
        case "completed": return <CheckCircle className="h-4 w-4 text-green-400" />;
        case "failed": return <XCircle className="h-4 w-4 text-red-400" />;
        case "skipped": return <SkipForward className="h-4 w-4 text-muted-foreground" />;
        default: return <Clock className="h-4 w-4 text-muted-foreground/50" />;
    }
}

/**
 * Render the output content for each step.
 */
function StepOutputRenderer({ stepNumber, output }: { stepNumber: number; output: Record<string, unknown> }) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    switch (stepNumber) {
        case 1: {
            const source = output.scriptSource as string;
            const meta = output.youtubeMetadata as any;
            const len = output.workingScriptLength as number;
            return (
                <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                            {source === "youtube" ? "YouTube" : source === "manual" ? "Thủ công" : "Project"}
                        </Badge>
                        <span>{len?.toLocaleString()} ký tự</span>
                    </div>
                    {meta?.title && (
                        <p className="truncate text-xs opacity-70">📺 {meta.title}</p>
                    )}
                </div>
            );
        }

        case 2: {
            const hasStyle = output.hasStyleProfile as boolean;
            return (
                <p className="text-xs text-muted-foreground">
                    {hasStyle ? "✅ Style profile đã load" : "⚠️ Chưa có style profile"}
                </p>
            );
        }

        case 3: {
            const script = output.generatedScript as string;
            const words = output.wordCount as number;
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs gap-1">
                            <FileText className="h-3 w-3" /> {words} từ
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => copyText(script, "script")}
                        >
                            {copied === "script"
                                ? <><Check className="h-3 w-3 text-green-500" /> Copied</>
                                : <><Copy className="h-3 w-3" /> Copy</>
                            }
                        </Button>
                    </div>
                    <details className="group">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                            Xem script
                        </summary>
                        <div className="mt-2 rounded border border-border/50 bg-muted/30 p-2 max-h-[200px] overflow-y-auto">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {script}
                            </p>
                        </div>
                    </details>
                </div>
            );
        }

        case 4: {
            const scenes = output.scenes as any[];
            const total = output.totalScenes as number;
            const totalDur = scenes?.reduce((s, sc) => s + (sc.estimatedDurationSeconds || 0), 0) || 0;
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="gap-1">
                        <Scissors className="h-3 w-3" /> {total} cảnh
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" /> ~{Math.round(totalDur)}s
                    </Badge>
                </div>
            );
        }

        case 5: {
            // AI Director (Concept Analysis)
            const genre = output.genre as string;
            const charPhrase = output.characterPhrase as string;
            const keyMomentCount = output.keyMomentCount as number;
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    {genre && (
                        <Badge variant="secondary" className="gap-1">
                            <Brain className="h-3 w-3" /> {genre}
                        </Badge>
                    )}
                    {keyMomentCount > 0 && (
                        <Badge variant="outline" className="text-xs">{keyMomentCount} key moments</Badge>
                    )}
                    {charPhrase && (
                        <p className="text-xs text-muted-foreground truncate w-full mt-1" title={charPhrase}>
                            🎭 {charPhrase}
                        </p>
                    )}
                </div>
            );
        }

        case 6: {
            const provider = output.ttsProvider as string;
            const voice = output.ttsVoice as string;
            const audioUrls = output.ttsAudioUrls as any[];
            const successCount = audioUrls?.filter(a => a.audioUrl).length || 0;
            const segmentCount = output.segmentCount as number;
            return (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="gap-1">
                            <Volume2 className="h-3 w-3" /> {successCount} audio
                        </Badge>
                        <Badge variant="outline" className="text-xs">{provider}</Badge>
                        {voice && <Badge variant="outline" className="text-xs">{voice}</Badge>}
                        {segmentCount > 0 && (
                            <Badge variant="outline" className="text-xs">{segmentCount} segments (8s)</Badge>
                        )}
                    </div>
                    {audioUrls?.some(a => a.audioUrl) && (
                        <details className="group">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1">
                                <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                Nghe thử
                            </summary>
                            <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                                {audioUrls.filter(a => a.audioUrl).slice(0, 5).map((a: any) => (
                                    <div key={a.sceneId} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-16 shrink-0">Cảnh {a.sceneId}</span>
                                        <audio controls className="h-8 flex-1" preload="none">
                                            <source src={`/api/proxy${a.audioUrl}`} type="audio/mpeg" />
                                        </audio>
                                    </div>
                                ))}
                                {audioUrls.filter(a => a.audioUrl).length > 5 && (
                                    <p className="text-xs text-muted-foreground">
                                        ...và {audioUrls.filter(a => a.audioUrl).length - 5} audio khác
                                    </p>
                                )}
                            </div>
                        </details>
                    )}
                </div>
            );
        }

        case 7: {
            // Video Direction
            const dirCount = output.directionCount as number;
            const sampleTags = output.sampleTags as string;
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="gap-1">
                        <Clapperboard className="h-3 w-3" /> {dirCount} cảnh đã phân tích
                    </Badge>
                    {sampleTags && (
                        <Badge variant="outline" className="text-xs font-mono">[{sampleTags}]</Badge>
                    )}
                </div>
            );
        }

        case 8: {
            // VEO Prompts
            const scenes = output.scenes as any[];
            const mode = output.veoMode as string;
            const promptScenes = scenes?.filter(s => s.veoPrompt) || [];
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs gap-1 text-green-400">
                            <Sparkles className="h-3 w-3" /> {promptScenes.length} prompts
                        </Badge>
                        <Badge variant="outline" className="text-xs">{mode}</Badge>
                        {promptScenes.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1"
                                onClick={() => {
                                    const prompts = promptScenes
                                        .map(s => `--- Cảnh ${s.id} ---\n${s.veoPrompt}`)
                                        .join("\n\n");
                                    copyText(prompts, "veo");
                                }}
                            >
                                {copied === "veo"
                                    ? <><Check className="h-3 w-3 text-green-500" /> Copied</>
                                    : <><Copy className="h-3 w-3" /> Copy All</>
                                }
                            </Button>
                        )}
                    </div>
                    {promptScenes.length > 0 && (
                        <details className="group">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1">
                                <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                Xem prompts
                            </summary>
                            <div className="mt-2 rounded border border-border/50 bg-muted/30 p-2 max-h-[200px] overflow-y-auto space-y-3">
                                {promptScenes.map((s: any) => (
                                    <div key={s.id}>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Cảnh {s.id}:</p>
                                        <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap">{s.veoPrompt}</p>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            );
        }

        case 9: {
            // Entity Extraction
            const entityCount = output.entityCount as number;
            const entities = output.entities as any[];
            return (
                <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs gap-1">
                        <Users className="h-3 w-3" /> {entityCount} nhân vật/bối cảnh
                    </Badge>
                    {entities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {entities.slice(0, 5).map((e: any) => (
                                <Badge key={e.name} variant="outline" className="text-xs">
                                    {e.type === "character" ? "👤" : e.type === "environment" ? "🌍" : "📦"} {e.name}
                                </Badge>
                            ))}
                            {entities.length > 5 && (
                                <Badge variant="outline" className="text-xs">+{entities.length - 5}</Badge>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        case 10: {
            // Reference Prompts
            const refCount = output.referencePromptCount as number;
            const entityNames = output.entityNames as string[];
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="gap-1">
                        <Image className="h-3 w-3" /> {refCount} reference sheets
                    </Badge>
                    {entityNames?.slice(0, 3).map((name: string) => (
                        <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                    ))}
                </div>
            );
        }

        case 11: {
            // Scene Builder Prompts
            const sbCount = output.sceneBuilderCount as number;
            return (
                <Badge variant="secondary" className="text-xs gap-1">
                    <LayoutGrid className="h-3 w-3" /> {sbCount} scene prompts
                </Badge>
            );
        }

        case 12: {
            // Metadata / SEO
            const hasTitle = output.hasTitle as boolean;
            const hasDesc = output.hasDescription as boolean;
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant={hasTitle ? "secondary" : "outline"} className="text-xs">
                        {hasTitle ? "✅" : "⬜"} Title
                    </Badge>
                    <Badge variant={hasDesc ? "secondary" : "outline"} className="text-xs">
                        {hasDesc ? "✅" : "⬜"} Description
                    </Badge>
                </div>
            );
        }

        case 13: {
            const dur = output.totalDurationSeconds as number;
            const ready = output.readyForAssembly as boolean;
            return (
                <div className="flex flex-wrap gap-2 text-xs">
                    {dur > 0 && (
                        <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" /> Tổng ~{Math.round(dur)}s
                        </Badge>
                    )}
                    {ready && (
                        <Badge variant="secondary" className="gap-1 text-green-400">
                            <Video className="h-3 w-3" /> Sẵn sàng ghép
                        </Badge>
                    )}
                </div>
            );
        }

        default: return null;
    }
}

export function ProductionProgress({
    productionId,
}: {
    productionId: string;
}) {
    const { steps, isCompleted, isFailed, errorMessage } = usePipelineSocket(productionId);
    const [retryingStep, setRetryingStep] = useState<number | null>(null);

    const handleRetryStep = async (stepNumber: number) => {
        setRetryingStep(stepNumber);
        try {
            const res = await fetch(`/api/proxy/productions/${productionId}/retry-step/${stepNumber}`, {
                method: "POST",
            });
            if (!res.ok) {
                toast.error(`Thử lại bước ${stepNumber} thất bại`);
            } else {
                toast.success(`Đang chạy lại bước ${stepNumber}...`);
            }
        } catch (e) {
            toast.error("Không kết nối được server");
        } finally {
            setRetryingStep(null);
        }
    };

    const completedCount = steps.filter(s => s.status === "completed").length;
    const overallProgress = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="space-y-4">
            {/* Overall progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tiến trình</span>
                    <span className="font-mono">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Step list */}
            <div className="space-y-1">
                {steps.map(step => (
                    <div key={step.stepNumber} className="rounded-lg transition-colors">
                        {/* Step header */}
                        <div
                            className={`flex items-center gap-3 px-3 py-2 ${step.status === "processing"
                                ? "bg-blue-500/10 border border-blue-500/20 rounded-lg"
                                : step.status === "completed"
                                    ? "bg-green-500/5 rounded-lg"
                                    : step.status === "failed"
                                        ? "bg-red-500/10 border border-red-500/20 rounded-lg"
                                        : "opacity-50"
                                }`}
                        >
                            <div className="flex-shrink-0 text-muted-foreground">
                                {STEP_ICONS[step.stepNumber]}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                        {STEP_LABELS[step.stepNumber]}
                                    </span>
                                    {step.status === "processing" && step.percentage != null && (
                                        <Badge variant="secondary" className="text-xs font-mono">
                                            {step.percentage}%
                                        </Badge>
                                    )}
                                </div>
                                {step.message && step.status === "processing" && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {step.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Per-step retry button for failed or skipped steps */}
                                {(step.status === "failed" || step.status === "skipped" || step.status === "completed") && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 px-2.5 text-[10px] gap-1.5 rounded-md font-semibold uppercase tracking-wider transition-all",
                                            step.status === "failed"
                                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                                                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/30 shadow-sm"
                                        )}
                                        disabled={retryingStep === step.stepNumber}
                                        onClick={() => handleRetryStep(step.stepNumber)}
                                    >
                                        {retryingStep === step.stepNumber
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <RefreshCw className="h-3.5 w-3.5" />
                                        }
                                        {step.status === "failed" ? "Thử lại" : step.status === "skipped" ? "Chạy" : "Gen lại"}
                                    </Button>
                                )}
                                <div className="p-1.5 bg-black/40 rounded-md border border-white/5">{<StatusIcon status={step.status} />}</div>
                            </div>
                        </div>

                        {/* Error message for failed steps */}
                        {step.status === "failed" && step.message && (
                            <div className="px-3 py-1.5 ml-7 border-l-2 border-red-500/30">
                                <p className="text-xs text-red-400/80 truncate">
                                    ⚠️ {step.message}
                                </p>
                            </div>
                        )}

                        {/* Step output — shown when completed and has output */}
                        {step.status === "completed" && step.output && (
                            <div className="px-3 py-3 ml-7 mt-2 border border-white/5 bg-white/[0.02] rounded-xl flex flex-col gap-3">
                                <StepOutputRenderer
                                    stepNumber={step.stepNumber}
                                    output={step.output}
                                />

                                {/* AI Details Modal */}
                                <Dialog>
                                    <DialogTrigger
                                        render={
                                            <button className="mt-1 text-[10px] text-slate-500 hover:text-cyan-400 font-medium uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-1.5 select-none w-fit group/btn">
                                                <div className="p-1 rounded bg-white/5 group-hover/btn:bg-cyan-500/20 transition-colors">
                                                    <Maximize2 className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                                                </div>
                                                Xem chi tiết thông số AI
                                            </button>
                                        }
                                    />
                                    <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] h-[90vh] overflow-hidden flex flex-col bg-background/95 border-white/10 shadow-2xl backdrop-blur-3xl p-0 gap-0">
                                        <DialogHeader className="px-6 py-5 border-b border-white/5 space-y-1.5 bg-white/[0.02]">
                                            <DialogTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                                                <Brain className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                Chi Tiết Tham Số AI (Raw Data)
                                            </DialogTitle>
                                            <DialogDescription className="text-[13px] text-slate-400">
                                                Toàn bộ kết quả xử lý và tham số đầu ra của bước hiện tại từ hệ thống Pipeline.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/20 z-0"></div>
                                            <div className="relative z-10 w-full">
                                                <StepVisualizerRouter stepNumber={step.stepNumber} output={step.output} />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Completion / Error */}
            {isCompleted && (
                <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                        Pipeline hoàn thành!
                    </AlertDescription>
                </Alert>
            )}

            {isFailed && errorMessage && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
