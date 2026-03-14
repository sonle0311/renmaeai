"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BillingSyncButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/billing/sync", {
                method: "POST",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data.message || "Không thể đồng bộ từ Polar");
                return;
            }

            if (data.synced) {
                toast.success(`Đã đồng bộ thành công → ${data.tier}`);
                router.refresh();
            } else {
                toast.info("Không tìm thấy subscription active trên Polar");
            }
        } catch {
            toast.error("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5"
            title="Đồng bộ lại gói từ Polar nếu thanh toán thành công nhưng chưa lên plan"
        >
            {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang đồng bộ...</>
            ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Đồng bộ gói từ Polar</>
            )}
        </Button>
    );
}
