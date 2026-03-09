"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";
import { useEffect } from "react";
import {
    Plus, Youtube, Film, FileText, CheckCircle, XCircle,
    Clock, Loader2, ChevronRight, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CreateProductionForm } from "@/components/forms/create-production";
import { ProductionProgress } from "@/components/productions/progress";

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



    const selected = productions.find(p => p.id === selectedId);

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
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Stats bar + Create button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1">
                        <Film className="h-3 w-3" /> {counts.total} video
                    </Badge>
                    {counts.processing > 0 && (
                        <Badge variant="outline" className="gap-1 text-blue-500 border-blue-500/30">
                            <Loader2 className="h-3 w-3 animate-spin" /> {counts.processing} đang xử lý
                        </Badge>
                    )}
                    {counts.completed > 0 && (
                        <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
                            <CheckCircle className="h-3 w-3" /> {counts.completed} xong
                        </Badge>
                    )}
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <Button className="gap-2" onClick={() => setCreateOpen(true)}>
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
                            onCreated={() => {
                                setCreateOpen(false);
                                // Reload page to get new production
                                window.location.reload();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main content: List + Detail */}
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Left: Production list */}
                <div className="w-80 flex-shrink-0 overflow-y-auto space-y-1 pr-1">
                    {productions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <Youtube className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-sm mb-1">Chưa có video nào</p>
                            <p className="text-muted-foreground/60 text-xs mb-4">
                                Dán link YouTube → AI viết script → render video
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-3.5 w-3.5" /> Tạo video đầu tiên
                            </Button>
                        </div>
                    ) : (
                        productions.map(prod => {
                            const config = STATUS_CONFIG[prod.status];
                            const StatusIcon = config.icon;
                            const isActive = selectedId === prod.id;

                            return (
                                <button
                                    key={prod.id}
                                    onClick={() => setSelectedId(prod.id)}
                                    className={cn(
                                        "w-full text-left rounded-lg px-3 py-2.5 transition-all",
                                        "hover:bg-accent/50 group",
                                        isActive && "bg-accent ring-1 ring-primary/20",
                                    )}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <StatusIcon className={cn(
                                            "h-4 w-4 mt-0.5 flex-shrink-0",
                                            config.color,
                                            prod.status === "PROCESSING" && "animate-spin",
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {prod.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn("text-xs", config.color)}>
                                                    {config.label}
                                                </span>
                                                {prod.status === "PROCESSING" && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Step {prod.currentStep}/7
                                                    </span>
                                                )}
                                            </div>
                                            {prod.status === "PROCESSING" && (
                                                <Progress
                                                    value={(prod.currentStep / 7) * 100}
                                                    className="mt-1.5 h-1"
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
                <div className="flex-1 border border-border rounded-xl bg-card/30 overflow-y-auto">
                    {selected ? (
                        <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(selected.createdAt).toLocaleDateString("vi-VN", {
                                            day: "2-digit", month: "2-digit", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    {selected.mediaGeneration ? (
                                        <><Film className="h-3 w-3" /> Full Video</>
                                    ) : (
                                        <><FileText className="h-3 w-3" /> Text Only</>
                                    )}
                                </Badge>
                            </div>

                            {/* Progress tracker — always visible */}
                            <ProductionProgress productionId={selected.id} />



                            {(selected.status === "FAILED" || selected.status === "COMPLETED") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    disabled={retrying}
                                    onClick={() => handleRetry(selected.id)}
                                >
                                    {retrying ? (
                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang thử...</>
                                    ) : (
                                        <><RefreshCw className="h-3.5 w-3.5" /> {selected.status === "FAILED" ? "Thử lại" : "Chạy lại"}</>
                                    )}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <ChevronRight className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-muted-foreground text-sm">
                                Chọn video bên trái để xem chi tiết
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
