import { prisma } from "@/lib/prisma";
import { CreditCard, Crown, BarChart3, XCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { AdminSubCancelButton } from "@/components/billing/admin-cancel-button";

export const metadata = { title: "Subscriptions — Admin" };

const TIER_COLORS: Record<string, string> = {
    FREE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    PRO: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    BUSINESS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default async function AdminSubscriptionsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; tier?: string }>;
}) {
    // ✅ No role check needed — handled by (admin)/layout.tsx
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || "1"));
    const pageSize = 30;
    const tierFilter = params.tier?.toUpperCase();
    const where = tierFilter ? { subscriptionTier: tierFilter as any } : {};

    const [users, total, stats] = await Promise.all([
        prisma.user.findMany({
            where: { ...where, NOT: { subscriptionTier: "FREE" } },
            select: {
                id: true, name: true, email: true,
                subscriptionTier: true, subscriptionStatus: true,
                polarCustomerId: true, polarSubscriptionId: true,
                usedVideoCount: true, monthlyVideoQuota: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where: { ...where, NOT: { subscriptionTier: "FREE" } } }),
        prisma.user.groupBy({ by: ["subscriptionTier"], _count: { _all: true } }),
    ]);

    const tierCounts = Object.fromEntries(stats.map((s) => [s.subscriptionTier, s._count._all]));
    const totalPages = Math.ceil(total / pageSize);
    const mrr = ((tierCounts["PRO"] || 0) * 19) + ((tierCounts["BUSINESS"] || 0) * 49);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                    Subscriptions
                </h1>
                <span className="text-sm text-slate-500">{total} paying users</span>
            </div>

            {/* Revenue overview */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Est. MRR", value: `$${mrr}/mo`, icon: CreditCard, color: "text-green-400" },
                    { label: "Pro", value: String(tierCounts["PRO"] || 0), icon: Crown, color: "text-cyan-400" },
                    { label: "Business", value: String(tierCounts["BUSINESS"] || 0), icon: BarChart3, color: "text-amber-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="bg-white/[0.03] border-white/8">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${color}`} />
                            <div>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-xl font-bold text-white">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card className="bg-white/[0.03] border-white/8">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {["User", "Plan", "Status", "Usage", "Polar ID", "Joined", "Action"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-white truncate max-w-[160px]">{user.name || "—"}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={`text-xs border ${TIER_COLORS[user.subscriptionTier] || TIER_COLORS.FREE}`}>
                                                {user.subscriptionTier}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                {user.subscriptionStatus === "active" ? (
                                                    <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> active</>
                                                ) : user.subscriptionStatus === "canceled" ? (
                                                    <><XCircle className="h-3.5 w-3.5 text-red-400" /> canceled</>
                                                ) : (
                                                    <><Clock className="h-3.5 w-3.5 text-slate-500" /> {user.subscriptionStatus || "—"}</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400">
                                            <span className="text-white font-medium">{user.usedVideoCount}</span>
                                            <span className="text-slate-600">/{user.monthlyVideoQuota}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-mono truncate max-w-[100px]">
                                            {user.polarCustomerId || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.polarSubscriptionId && user.subscriptionStatus === "active" && (
                                                <AdminSubCancelButton
                                                    subscriptionId={user.polarSubscriptionId}
                                                    userId={user.id}
                                                    userEmail={user.email}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                                            Chưa có paying user nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">Trang {page}/{totalPages}</p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <LinkButton href={`/admin/subscriptions?page=${page - 1}`} variant="outline" size="sm" className="border-white/10 text-slate-400">← Trước</LinkButton>
                        )}
                        {page < totalPages && (
                            <LinkButton href={`/admin/subscriptions?page=${page + 1}`} variant="outline" size="sm" className="border-white/10 text-slate-400">Sau →</LinkButton>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
