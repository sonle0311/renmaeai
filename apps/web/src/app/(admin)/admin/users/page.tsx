import { prisma } from "@/lib/prisma";
import { Users, Crown, BarChart3, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = { title: "Users — Admin" };

const TIER_COLORS: Record<string, string> = {
    FREE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    PRO: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    BUSINESS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; tier?: string; q?: string }>;
}) {
    // ✅ No role check needed — handled by (admin)/layout.tsx
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || "1"));
    const pageSize = 30;
    const tierFilter = params.tier?.toUpperCase();
    const query = params.q?.trim();

    const where = {
        ...(tierFilter && { subscriptionTier: tierFilter as any }),
        ...(query && {
            OR: [
                { email: { contains: query, mode: "insensitive" as const } },
                { name: { contains: query, mode: "insensitive" as const } },
            ],
        }),
    };

    const [users, total, stats] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true, image: true, role: true,
                subscriptionTier: true, subscriptionStatus: true,
                usedVideoCount: true, monthlyVideoQuota: true,
                usedMinuteCount: true, monthlyMinuteQuota: true,
                createdAt: true,
                _count: { select: { projects: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
        prisma.user.groupBy({ by: ["subscriptionTier"], _count: { _all: true } }),
    ]);

    const tierCounts = Object.fromEntries(stats.map((s) => [s.subscriptionTier, s._count._all]));
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-cyan-400" />
                    User Management
                </h1>
                <span className="text-sm text-slate-500">{total} users</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { tier: "FREE", icon: Zap, label: "Free" },
                    { tier: "PRO", icon: Crown, label: "Pro" },
                    { tier: "BUSINESS", icon: BarChart3, label: "Business" },
                ].map(({ tier, icon: Icon, label }) => (
                    <Card key={tier} className="bg-white/[0.03] border-white/8">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Icon className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-xl font-bold text-white">{tierCounts[tier] || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {["", "FREE", "PRO", "BUSINESS"].map((tier) => (
                    <LinkButton
                        key={tier}
                        href={`/admin/users${tier ? `?tier=${tier}` : ""}`}
                        variant={(tierFilter || "") === tier ? "default" : "outline"}
                        size="sm"
                        className={(tierFilter || "") === tier
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                            : "border-white/10 text-slate-400 hover:text-white"
                        }
                    >
                        {tier || "Tất cả"}
                    </LinkButton>
                ))}
            </div>

            {/* Table */}
            <Card className="bg-white/[0.03] border-white/8">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {["User", "Plan", "Videos", "Projects", "Joined"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                {user.image ? (
                                                    <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-slate-400">
                                                        {(user.name || user.email || "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white truncate max-w-[180px]">{user.name || "—"}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</p>
                                                </div>
                                                {user.role === "ADMIN" && (
                                                    <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">ADMIN</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={`text-xs border ${TIER_COLORS[user.subscriptionTier] || TIER_COLORS.FREE}`}>
                                                {user.subscriptionTier}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400">
                                            <span className="text-white font-medium">{user.usedVideoCount}</span>
                                            <span className="text-slate-600">/{user.monthlyVideoQuota}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400">{user._count.projects}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                                            Không có user nào
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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Trang {page}/{totalPages} · {total} users</p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <LinkButton href={`/admin/users?page=${page - 1}${tierFilter ? `&tier=${tierFilter}` : ""}`} variant="outline" size="sm" className="border-white/10 text-slate-400">← Trước</LinkButton>
                        )}
                        {page < totalPages && (
                            <LinkButton href={`/admin/users?page=${page + 1}${tierFilter ? `&tier=${tierFilter}` : ""}`} variant="outline" size="sm" className="border-white/10 text-slate-400">Sau →</LinkButton>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
