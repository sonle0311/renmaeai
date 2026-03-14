import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Crown, Zap, BarChart3, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingCheckoutButton } from "@/components/billing/checkout-button";
import { BillingCancelButton } from "@/components/billing/cancel-button";
import { BillingSyncButton } from "@/components/billing/sync-button";
import { CheckoutSuccessBanner } from "@/components/billing/checkout-success-banner";

export const metadata = { title: "Billing — RenmaeAI" };

const PLANS = [
    {
        tier: "FREE",
        name: "Free",
        price: "$0",
        icon: Zap,
        color: "text-slate-400",
        bg: "bg-slate-500/10 border-slate-500/20",
        features: ["1 video/tháng", "5 phút xử lý", "1 slot đồng thời"],
    },
    {
        tier: "PRO",
        name: "Pro",
        price: "$19/mo",
        icon: Crown,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10 border-cyan-500/20",
        features: ["60 video/tháng", "600 phút xử lý", "3 slots đồng thời", "Ưu tiên pipeline"],
        polarTier: "pro",
    },
    {
        tier: "BUSINESS",
        name: "Business",
        price: "$49/mo",
        icon: BarChart3,
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20",
        features: ["250 video/tháng", "5,000 phút xử lý", "10 slots đồng thời", "API access (soon)"],
        polarTier: "business",
    },
];

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const params = await searchParams;
    const checkoutSuccess = params.checkout === "success";

    // Fetch subscription data from backend
    let subData: any = null;
    try {
        const res = await fetch(
            `${process.env.INTERNAL_API_URL ?? "http://localhost:4000"}/api/v1/billing/subscription`,
            {
                headers: { Authorization: `Bearer ${(session as any).accessToken ?? ""}` },
                cache: "no-store",
            },
        );
        if (res.ok) subData = await res.json();
    } catch {
        // Backend not running — show basic tier from session
    }

    const currentTier: string = subData?.tier ?? (session.user as any).subscriptionTier ?? "FREE";
    const quota = subData?.quota;
    const polarSub = subData?.polar;

    const statusIcon = (status: string | null) => {
        if (status === "active") return <CheckCircle className="h-4 w-4 text-green-400" />;
        if (status === "canceled") return <XCircle className="h-4 w-4 text-red-400" />;
        return <Clock className="h-4 w-4 text-slate-400" />;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý gói đăng ký và hạn mức sử dụng</p>
            </div>

            {/* Auto-sync on checkout success — polls /billing/sync until webhook arrives */}
            {checkoutSuccess && <CheckoutSuccessBanner />}

            {/* Current plan */}
            <Card className="bg-white/[0.03] border-white/10">
                <CardHeader>
                    <CardTitle className="text-base text-slate-300">Gói hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className={`px-3 py-1.5 text-sm font-bold uppercase ${
                                currentTier === "PRO" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
                                currentTier === "BUSINESS" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" :
                                "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            }`}>
                                {currentTier}
                            </Badge>
                            {subData?.status && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                    {statusIcon(subData.status)}
                                    <span className="capitalize">{subData.status}</span>
                                </div>
                            )}
                        </div>
                        {polarSub?.current_period_end && (
                            <p className="text-xs text-slate-500">
                                Gia hạn: {new Date(polarSub.current_period_end).toLocaleDateString("vi-VN")}
                            </p>
                        )}
                    </div>

                    {/* Quota bars */}
                    {quota && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Videos</span>
                                    <span className="text-white font-medium">{quota.videos.used}/{quota.videos.limit}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (quota.videos.used / quota.videos.limit) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Phút xử lý</span>
                                    <span className="text-white font-medium">{quota.minutes.used}/{quota.minutes.limit}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (quota.minutes.used / quota.minutes.limit) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancel / Sync buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {currentTier !== "FREE" && subData?.status === "active" && (
                            <BillingCancelButton />
                        )}
                        <BillingSyncButton />
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade plans */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Nâng cấp gói</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = currentTier === plan.tier;
                        return (
                            <Card
                                key={plan.tier}
                                className={`relative ${plan.bg} transition-all ${isCurrent ? "ring-1 ring-white/20" : "hover:bg-white/[0.05]"}`}
                            >
                                {isCurrent && (
                                    <div className="absolute top-3 right-3">
                                        <Badge className="text-[10px] bg-white/10 text-white border-white/10">Hiện tại</Badge>
                                    </div>
                                )}
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-5 w-5 ${plan.color}`} />
                                        <span className={`font-bold text-base ${plan.color}`}>{plan.name}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{plan.price}</p>
                                    <ul className="space-y-2">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    {!isCurrent && plan.polarTier ? (
                                        <BillingCheckoutButton tier={plan.polarTier as "pro" | "business"} />
                                    ) : isCurrent ? (
                                        <div className="h-9 flex items-center">
                                            <span className="text-xs text-slate-500">Gói đang sử dụng</span>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Powered by */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <ExternalLink className="h-3 w-3" />
                <span>Thanh toán được xử lý bởi</span>
                <a
                    href="https://polar.sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    Polar.sh
                </a>
            </div>
        </div>
    );
}
