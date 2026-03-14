"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";
import { useEffect } from "react";
import {
    Plus, Youtube, Film, FileText, CheckCircle, XCircle,
    Clock, Loader2, ChevronRight, RefreshCw, Trash2, AlertTriangle,
    Copy, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CreateProductionForm } from "@/components/forms/create-production";
import { ProductionProgress } from "@/components/productions/progress";
import { useVideoMuxer } from "@/hooks/use-video-muxer";

type Production = {
    id: string;
    title: string;
    status: "DRAFT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
    currentStep: number;
    mediaGeneration: boolean;
    createdAt: string;
    // Output data (populated after pipeline completes)
    generatedScript?: string;
    wordCount?: number;
    totalScenes?: number;
    scenes?: Array<{
        id: number;
        text: string;
        wordCount: number;
        estimatedDurationSeconds: number;
        veoPrompt?: string;
        veoMode?: string;
    }>;
    totalDurationSeconds?: number;
    youtubeTitle?: string;
    youtubeDescription?: string;
    thumbnailPrompt?: string;
};

const STATUS_CONFIG = {
    DRAFT: { label: "Nháp", icon: FileText, color: "text-muted-foreground", bg: "bg-muted/50" },
    QUEUED: { label: "Chờ xử lý", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    PROCESSING: { label: "Đang xử lý", icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10" },
    COMPLETED: { label: "Hoàn thành", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    FAILED: { label: "Lỗi", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

export function ProjectWorkspace({
    projectId,
    projectSettings,
    initialProductions,
}: {
    projectId: string;
    projectSettings: Record<string, unknown>;
    initialProductions: Production[];
}) {
    const [productions, setProductions] = useState(initialProductions);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const socket = useSocket();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Retry handler
    async function handleRetry(productionId: string) {
        setRetrying(true);
        try {
            const res = await fetch(`/api/proxy/productions/${productionId}/retry`, {
                method: "POST",
            });
            if (res.ok) {
                setProductions(prev =>
                    prev.map(p =>
                        p.id === productionId
                            ? { ...p, status: "QUEUED" as const, currentStep: 0 }
                            : p
                    ),
                );
                toast.success("Đang chạy lại pipeline...");
            } else {
                toast.error("Đã thử lại thất bại");
            }
        } catch (e) {
            toast.error("Không kết nối được server");
        } finally {
            setRetrying(false);
        }
    }

    // Delete handler
    async function handleDelete(productionId: string) {
        if (!confirm("Bạn có chắc chắn muốn xóa video này không? Thao tác này không thể hoàn tác.")) return;

        setDeletingId(productionId);
        try {
            const res = await fetch(`/api/proxy/productions/${productionId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setProductions(prev => prev.filter(p => p.id !== productionId));
                if (selectedId === productionId) setSelectedId(null);
                toast.success("Đã xóa video thành công");
                router.refresh();
            } else {
                toast.error("Không thể xóa video");
            }
        } catch (e) {
            toast.error("Lỗi kết nối server");
        } finally {
            setDeletingId(null);
        }
    }



    const selected = productions.find(p => p.id === selectedId);

    // Download helpers
    const muxer = useVideoMuxer();

    const handleDownloadScripts = (prod: Production) => {
        const scriptText = prod.scenes
            ? prod.scenes.map((s, i) => `--- Cảnh ${i + 1} ---\n${s.text}\n\nVEO Prompt:\n${s.veoPrompt || '(chưa có)'}\n`).join('\n')
            : prod.generatedScript || '';
        const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${prod.title || 'script'}.txt`; a.click();
        URL.revokeObjectURL(url);
    };


    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleStepStarted = (data: { productionId: string; stepNumber: number }) => {
            setProductions(prev =>
                prev.map(p =>
                    p.id === data.productionId
                        ? { ...p, currentStep: data.stepNumber, status: "PROCESSING" as const }
                        : p
                ),
            );
        };

        const handleCompleted = async (data: { productionId: string }) => {
            // Fetch full production data with outputData
            try {
                const res = await fetch(`/api/proxy/productions/${data.productionId}`);
                if (res.ok) {
                    const prod = await res.json();
                    const out = prod.outputData || {};
                    setProductions(prev =>
                        prev.map(p =>
                            p.id === data.productionId
                                ? {
                                    ...p,
                                    status: "COMPLETED" as const,
                                    generatedScript: out.generatedScript,
                                    wordCount: out.wordCount,
                                    totalScenes: out.totalScenes,
                                    scenes: out.scenes,
                                    totalDurationSeconds: out.totalDurationSeconds,
                                }
                                : p
                        ),
                    );
                    return;
                }
            } catch { /* fallback below */ }
            // Fallback: just mark completed
            setProductions(prev =>
                prev.map(p =>
                    p.id === data.productionId ? { ...p, status: "COMPLETED" as const } : p
                ),
            );
        };

        const handleFailed = (data: { productionId: string }) => {
            setProductions(prev =>
                prev.map(p =>
                    p.id === data.productionId ? { ...p, status: "FAILED" as const } : p
                ),
            );
        };

        // Real-time output streaming: merge step output data as it arrives
        const handleStepOutput = (data: {
            productionId: string;
            stepNumber: number;
            output: Record<string, unknown>;
        }) => {
            setProductions(prev =>
                prev.map(p =>
                    p.id === data.productionId
                        ? { ...p, ...data.output } as Production
                        : p
                ),
            );
        };

        socket.on("pipeline:step:started", handleStepStarted);
        socket.on("pipeline:step:completed", handleStepStarted);
        socket.on("pipeline:step:output", handleStepOutput);
        socket.on("pipeline:completed", handleCompleted);
        socket.on("pipeline:step:failed", handleFailed);

        return () => {
            socket.off("pipeline:step:started", handleStepStarted);
            socket.off("pipeline:step:completed", handleStepStarted);
            socket.off("pipeline:step:output", handleStepOutput);
            socket.off("pipeline:completed", handleCompleted);
            socket.off("pipeline:step:failed", handleFailed);
        };
    }, [socket]);

    // Counts
    const counts = {
        total: productions.length,
        processing: productions.filter(p => ["QUEUED", "PROCESSING"].includes(p.status)).length,
        completed: productions.filter(p => p.status === "COMPLETED").length,
        failed: productions.filter(p => p.status === "FAILED").length,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Stats bar + Create button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Badge className="gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 px-3 py-1 font-semibold rounded-md">
                        <Film className="h-3 w-3" /> {counts.total} video
                    </Badge>
                    {counts.processing > 0 && (
                        <Badge variant="outline" className="gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] px-3 py-1 font-semibold rounded-md">
                            <Loader2 className="h-3 w-3 animate-spin" /> {counts.processing} đang xử lý
                        </Badge>
                    )}
                    {counts.completed > 0 && (
                        <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 font-semibold rounded-md">
                            <CheckCircle className="h-3 w-3" /> {counts.completed} xong
                        </Badge>
                    )}
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <Button className="h-9 gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Tạo Video
                    </Button>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-red-500" />
                                Tạo Video mới
                            </DialogTitle>
                        </DialogHeader>
                        <CreateProductionForm
                            projectId={projectId}
                            projectSettings={projectSettings}
                            onCreated={(newProd) => {
                                // ⚡ Optimistic update: add to state immediately
                                setProductions(prev => [newProd, ...prev]);
                                setSelectedId(newProd.id);
                                setCreateOpen(false);
                                // Sync server state in background
                                router.refresh();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main content: List + Detail */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left: Production list */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                    {productions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16 bg-black/40 border border-white/5 rounded-2xl">
                            <Youtube className="h-12 w-12 text-slate-500/50 mb-4" />
                            <p className="text-slate-400 text-sm mb-1">Chưa có video nào</p>
                            <p className="text-slate-500 text-xs mb-4">
                                Dán link YouTube → AI viết script → render video
                            </p>
                            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-2" /> Tạo video đầu tiên
                            </Button>
                        </div>
                    ) : (
                        productions.map(prod => {
                            const config = STATUS_CONFIG[prod.status];
                            const StatusIcon = config.icon;
                            const isActive = selectedId === prod.id;
                            const isProcessing = prod.status === "QUEUED" || prod.status === "PROCESSING";

                            return (
                                <button
                                    key={prod.id}
                                    onClick={() => setSelectedId(prod.id)}
                                    className={cn(
                                        "w-full text-left rounded-xl p-3 transition-all relative overflow-hidden group border",
                                        isActive
                                            ? "bg-white/5 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                            : "bg-black/40 border-white/5 hover:bg-white/5 cursor-pointer",
                                    )}
                                >
                                    {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-l-xl"></div>}
                                    <div className={cn("flex items-start gap-3", isActive && "pl-2")}>
                                        <StatusIcon className={cn(
                                            "h-4 w-4 mt-0.5 flex-shrink-0 transition-colors",
                                            isProcessing ? "text-cyan-400" : (prod.status === "COMPLETED" ? "text-emerald-500" : "text-slate-500"),
                                            prod.status === "PROCESSING" && "animate-spin",
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-[13px] font-semibold truncate transition-colors", isActive ? "text-white" : "text-slate-300 group-hover:text-white")}>
                                                {prod.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={cn("text-[10px] font-bold uppercase", isProcessing ? "text-cyan-400" : (prod.status === "COMPLETED" ? "text-emerald-500" : "text-slate-500"))}>
                                                    {config.label}
                                                </span>
                                                {prod.status === "PROCESSING" && (
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        Step {prod.currentStep}/13
                                                    </span>
                                                )}
                                            </div>
                                            {prod.status === "PROCESSING" && (
                                                <Progress
                                                    value={(prod.currentStep / 13) * 100}
                                                    className="mt-2 h-1.5 w-full bg-black/50"
                                                />
                                            )}
                                        </div>
                                        <ChevronRight className={cn(
                                            "h-4 w-4 text-muted-foreground/30 mt-0.5 flex-shrink-0",
                                            "group-hover:text-muted-foreground transition-colors",
                                            isActive && "text-primary",
                                        )} />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Right: Detail panel */}
                <div className="flex-1 border border-white/10 rounded-2xl bg-black/40 overflow-hidden flex flex-col shadow-inner">
                    {selected ? (
                        <div className="flex flex-col h-full">
                            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div>
                                    <h2 className="text-[15px] font-bold text-white mb-1">{selected.title}</h2>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                        {new Date(selected.createdAt).toLocaleDateString("vi-VN", {
                                            day: "2-digit", month: "2-digit", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="px-3 py-1.5 rounded-lg bg-black border border-white/10 flex items-center gap-2 text-slate-300">
                                        {selected.mediaGeneration ? (
                                            <><Film className="h-3.5 w-3.5 text-cyan-400" /> Full Video</>
                                        ) : (
                                            <><FileText className="h-3.5 w-3.5 text-cyan-400" /> Text Only</>
                                        )}
                                    </Badge>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleDelete(selected.id)}
                                        disabled={deletingId === selected.id}
                                        className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30 ml-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                        title="Xóa Video"
                                    >
                                        {deletingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {/* Progress tracker — always visible */}
                                <ProductionProgress productionId={selected.id} />

                                {/* Export section — shown when COMPLETED */}
                                {selected.status === "COMPLETED" && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">📦 Xuất Kết Quả</h3>

                                        {/* SEO Metadata */}
                                        {(selected.youtubeTitle || selected.youtubeDescription) && (
                                            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
                                                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">📺 YouTube SEO</p>
                                                {selected.youtubeTitle && (
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-slate-500 mb-0.5">Title</p>
                                                            <p className="text-sm text-white font-medium">{selected.youtubeTitle}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                                                            onClick={() => navigator.clipboard.writeText(selected.youtubeTitle || '')}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {selected.youtubeDescription && (
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 mb-0.5">Description</p>
                                                        <p className="text-xs text-slate-400 leading-relaxed">{selected.youtubeDescription}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Script download */}
                                        {(selected.generatedScript || selected.scenes?.length) && (
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2 bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.07]"
                                                onClick={() => handleDownloadScripts(selected)}
                                            >
                                                <FileText className="h-4 w-4 text-cyan-400" />
                                                Tải xuống Script + VEO Prompts (.txt)
                                            </Button>
                                        )}

                                        {/* Scenes ZIP download */}
                                        {selected.scenes && selected.scenes.length > 0 && (
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2 bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.07]"
                                                disabled={muxer.status === 'processing' || muxer.status === 'loading'}
                                                onClick={async () => {
                                                    const scenes = selected.scenes!.filter(s => s.veoPrompt);
                                                    if (!scenes.length) { toast.error('Chưa có VEO Prompts để xuất'); return; }
                                                    const toMux: Array<{videoUrl: string; audioUrl: string; name: string; script?: string}> = scenes.map((s, i) => ({
                                                        videoUrl: '', audioUrl: '', // placeholder (no video files yet)
                                                        name: `scene_${String(i+1).padStart(2,'0')}`,
                                                        script: `${s.text}\n\nVEO Prompt:\n${s.veoPrompt}`,
                                                    }));
                                                    await muxer.downloadScenesZip(toMux, selected.title || 'scenes');
                                                }}
                                            >
                                                {muxer.status === 'processing' ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin" /> {muxer.message} ({muxer.progress}%)</>
                                                ) : (
                                                    <><Download className="h-4 w-4 text-emerald-400" /> Xuất ZIP (Script + Prompts)</>  
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {(selected.status === "FAILED" || selected.status === "COMPLETED") && (
                                    <div className="mt-6">
                                        <Button
                                            className="gap-2 bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-lg transition-all"
                                            disabled={retrying}
                                            onClick={() => handleRetry(selected.id)}
                                        >
                                            {retrying ? (
                                                <><Loader2 className="h-4 w-4 animate-spin" /> Đang thử...</>
                                            ) : (
                                                <><RefreshCw className="h-4 w-4 text-cyan-400" /> {selected.status === "FAILED" ? "Thử lại Pipeline" : "Chạy lại Pipeline"}</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative overflow-hidden">
                            <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
                            <Film className="h-16 w-16 text-white/5 mb-6" />
                            <p className="text-slate-300 text-sm font-medium">
                                Chọn một video trong danh sách để xem chi tiết
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
