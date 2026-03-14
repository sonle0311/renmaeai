"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingCheckoutButton({ tier }: { tier: "pro" | "business" }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || "Không thể tạo checkout link");
                return;
            }

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                toast.error("Không nhận được checkout URL từ Polar");
            }
        } catch {
            toast.error("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
        >
            {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
            ) : (
                <>Nâng cấp {tier === "pro" ? "Pro" : "Business"} <ArrowRight className="h-4 w-4" /></>
            )}
        </Button>
    );
}
