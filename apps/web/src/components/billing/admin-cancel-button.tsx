"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AdminSubCancelButton({
    subscriptionId,
    userId,
    userEmail,
}: {
    subscriptionId: string;
    userId: string;
    userEmail: string;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCancel = async () => {
        if (!confirm(`Hủy subscription của ${userEmail}? User sẽ về FREE ngay lập tức.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/proxy/admin/subscriptions/${subscriptionId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || "Không thể hủy subscription");
                return;
            }

            toast.success(`Đã hủy subscription của ${userEmail}`);
            router.refresh();
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
            onClick={handleCancel}
            disabled={loading}
            className="h-7 px-2 gap-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Cancel
        </Button>
    );
}
