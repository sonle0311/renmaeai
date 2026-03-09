"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { Download, Film, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ProductionProgress } from "@/components/productions/progress";

type Production = {
    id: string;
    title: string;
    status: "DRAFT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
    currentStep: number;
    mediaGeneration: boolean;
    createdAt: string;
};

const COLUMNS: {
    key: Production["status"];
    label: string;
    variant: "secondary" | "outline" | "default" | "destructive";
    borderColor: string;
}[] = [
        { key: "DRAFT", label: "Nháp", variant: "secondary", borderColor: "border-t-muted-foreground" },
        { key: "QUEUED", label: "Đang chờ", variant: "outline", borderColor: "border-t-yellow-500" },
        { key: "PROCESSING", label: "Đang xử lý", variant: "default", borderColor: "border-t-primary" },
        { key: "COMPLETED", label: "Hoàn thành", variant: "default", borderColor: "border-t-green-500" },
        { key: "FAILED", label: "Lỗi", variant: "destructive", borderColor: "border-t-destructive" },
    ];

export function KanbanBoard({
    projectId,
    initialProductions,
}: {
    projectId: string;
    initialProductions: Production[];
}) {
    const [productions, setProductions] = useState(initialProductions);
    const [selectedProd, setSelectedProd] = useState<Production | null>(null);
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleStepStarted = (data: { productionId: string; stepNumber: number }) => {
            setProductions((prev) =>
                prev.map((p) =>
                    p.id === data.productionId
                        ? { ...p, currentStep: data.stepNumber, status: "PROCESSING" as const }
                        : p,
                ),
            );
        };

        const handleStepCompleted = (data: { productionId: string; stepNumber: number }) => {
            setProductions((prev) =>
                prev.map((p) =>
                    p.id === data.productionId
                        ? { ...p, currentStep: data.stepNumber, status: "PROCESSING" as const }
                        : p,
                ),
            );
        };

        const handleCompleted = (data: { productionId: string }) => {
            setProductions((prev) =>
                prev.map((p) =>
                    p.id === data.productionId ? { ...p, status: "COMPLETED" as const } : p,
                ),
            );
        };

        const handleFailed = (data: { productionId: string }) => {
            setProductions((prev) =>
                prev.map((p) =>
                    p.id === data.productionId ? { ...p, status: "FAILED" as const } : p,
                ),
            );
        };

        socket.on("pipeline:step:started", handleStepStarted);
        socket.on("pipeline:step:completed", handleStepCompleted);
        socket.on("pipeline:completed", handleCompleted);
        socket.on("pipeline:step:failed", handleFailed);

        return () => {
            socket.off("pipeline:step:started", handleStepStarted);
            socket.off("pipeline:step:completed", handleStepCompleted);
            socket.off("pipeline:completed", handleCompleted);
            socket.off("pipeline:step:failed", handleFailed);
        };
    }, [socket]);

    const grouped = COLUMNS.map((col) => ({
        ...col,
        items: productions.filter((p) => p.status === col.key),
    }));

    return (
        <>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {grouped.map((column) => (
                    <div
                        key={column.key}
                        className={cn(
                            "flex-shrink-0 w-64 rounded-xl border border-border bg-card/50 border-t-2",
                            column.borderColor
                        )}
                    >
                        <div className="p-3 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-card-foreground">
                                    {column.label}
                                </h3>
                                <Badge variant="secondary" className="text-xs h-5">
                                    {column.items.length}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-2 space-y-2 min-h-[200px]">
                            {column.items.map((prod) => (
                                <Card
                                    key={prod.id}
                                    className="hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedProd(prod)}
                                >
                                    <CardContent className="p-3">
                                        <h4 className="text-sm font-medium truncate">
                                            {prod.title}
                                        </h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant="outline" className="text-xs gap-1">
                                                {prod.mediaGeneration ? (
                                                    <><Film className="h-3 w-3" /> Full</>
                                                ) : (
                                                    <><FileText className="h-3 w-3" /> Text</>
                                                )}
                                            </Badge>
                                            {prod.status === "PROCESSING" && (
                                                <span className="text-xs text-primary font-medium">
                                                    Step {prod.currentStep}/7
                                                </span>
                                            )}
                                            {prod.status === "COMPLETED" && (
                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-400 hover:text-green-300">
                                                    <Download className="h-3 w-3" />
                                                    Tải
                                                </Button>
                                            )}
                                        </div>
                                        {prod.status === "PROCESSING" && (
                                            <Progress
                                                value={(prod.currentStep / 7) * 100}
                                                className="mt-2 h-1"
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {column.items.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    Không có video
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedProd} onOpenChange={(open) => !open && setSelectedProd(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="truncate">{selectedProd?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedProd && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    {selectedProd.mediaGeneration ? "Full Video" : "Text Only"}
                                </Badge>
                                <Badge
                                    variant={
                                        selectedProd.status === "COMPLETED" ? "default" :
                                            selectedProd.status === "FAILED" ? "destructive" :
                                                "secondary"
                                    }
                                >
                                    {selectedProd.status}
                                </Badge>
                            </div>

                            {(selectedProd.status === "PROCESSING" || selectedProd.status === "QUEUED") && (
                                <ProductionProgress productionId={selectedProd.id} />
                            )}

                            {selectedProd.status === "COMPLETED" && (
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full gap-2">
                                        <FileText className="h-4 w-4" />
                                        Xem Script
                                    </Button>
                                    {selectedProd.mediaGeneration && (
                                        <Button className="w-full gap-2">
                                            <Download className="h-4 w-4" />
                                            Tải Video
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
