"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[RenmaeAI] Unhandled error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />

            <div className="text-center space-y-6 relative z-10 max-w-md mx-auto p-6">
                <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-white">Đã xảy ra lỗi</h2>
                <p className="text-slate-400 leading-relaxed">
                    {error.message || "Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại."}
                </p>
                <Button
                    onClick={reset}
                    className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                    <RefreshCw className="h-4 w-4" /> Thử lại
                </Button>
            </div>
        </div>
    );
}
