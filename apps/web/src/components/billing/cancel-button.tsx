"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BillingCancelButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCancel = async () => {
        if (!confirm("Bạn có chắc muốn hủy gói đăng ký? Bạn sẽ về FREE ngay lập tức.")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/billing/subscription", {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || "Không thể hủy gói");
                return;
            }

            toast.success("Đã hủy gói đăng ký. Tài khoản đã về FREE.");
            router.refresh();
        } catch {
            toast.error("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
        >
            {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang hủy...</>
            ) : (
                <><XCircle className="h-3.5 w-3.5" /> Hủy gói đăng ký</>
            )}
        </Button>
    );
}
