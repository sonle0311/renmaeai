"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * Auto-syncs subscription from Polar when user lands on /billing?checkout=success.
 * Polls /billing/sync every 2s for up to 30s to handle webhook race condition.
 *
 * Security: URL is cleaned immediately on mount (router.replace) to prevent
 * re-triggering on F5 and strip sensitive customer_session_token from URL.
 */
export function CheckoutSuccessBanner() {
    const router = useRouter();
    const [state, setState] = useState<"syncing" | "done" | "timeout">("syncing");
    const attempts = useRef(0);
    const maxAttempts = 15; // 15 × 2s = 30s max wait

    useEffect(() => {
        // ⚡ SECURITY: Strip checkout params from URL immediately on mount.
        // This prevents F5 / share-URL from re-triggering the sync poll.
        // Also removes sensitive customer_session_token from browser history.
        router.replace("/billing", { scroll: false });

        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;

        const trySync = async () => {
            if (controller.signal.aborted) return;
            attempts.current += 1;

            try {
                const res = await fetch("/api/proxy/billing/sync", {
                    method: "POST",
                    signal: controller.signal,
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok && data.synced) {
                    setState("done");
                    setTimeout(() => router.refresh(), 600);
                    return;
                }
            } catch (e: any) {
                if (e?.name === "AbortError") return;
            }

            if (attempts.current >= maxAttempts) {
                setState("timeout");
                return;
            }

            timer = setTimeout(trySync, 2000);
        };

        timer = setTimeout(trySync, 1500);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [router]);

    if (state === "syncing") {
        return (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-400 shrink-0 animate-spin" />
                <div>
                    <p className="text-blue-300 text-sm font-medium">Đang kích hoạt gói của bạn...</p>
                    <p className="text-blue-400/60 text-xs mt-0.5">Thanh toán thành công, đang đồng bộ từ Polar</p>
                </div>
            </div>
        );
    }

    if (state === "done") {
        return (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <p className="text-green-300 text-sm font-medium">
                    🎉 Gói đã được kích hoạt thành công!
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
                <p className="text-yellow-300 text-sm font-medium">Thanh toán thành công!</p>
                <p className="text-yellow-400/60 text-xs mt-0.5">
                    Gói đang được xử lý. Nếu chưa thấy thay đổi, hãy click &quot;Đồng bộ gói từ Polar&quot; bên dưới.
                </p>
            </div>
        </div>
    );
}
