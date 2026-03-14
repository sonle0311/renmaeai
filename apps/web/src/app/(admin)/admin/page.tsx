import { prisma } from "@/lib/prisma";
import { Users, CreditCard, ScrollText, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = { title: "Admin Overview — RenmaeAI" };

export default async function AdminOverviewPage() {
    const [userStats, productionStats, logCount] = await Promise.all([
        prisma.user.groupBy({ by: ["subscriptionTier"], _count: { _all: true } }),
        prisma.production.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.auditLog.count(),
    ]);

    const tierMap = Object.fromEntries(userStats.map((s) => [s.subscriptionTier, s._count._all]));
    const statusMap = Object.fromEntries(productionStats.map((s) => [s.status, s._count._all]));
    const totalUsers = Object.values(tierMap).reduce((a, b) => a + b, 0);
    const totalProductions = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const mrr = ((tierMap["PRO"] || 0) * 19) + ((tierMap["BUSINESS"] || 0) * 49);

    const stats = [
        { label: "Total Users", value: totalUsers, icon: Users, color: "text-cyan-400", href: "/admin/users" },
        { label: "Pro Users", value: tierMap["PRO"] || 0, icon: TrendingUp, color: "text-emerald-400", href: "/admin/subscriptions" },
        { label: "Est. MRR", value: `$${mrr}`, icon: CreditCard, color: "text-green-400", href: "/admin/subscriptions" },
        { label: "Productions", value: totalProductions, icon: Activity, color: "text-blue-400", href: null },
        { label: "Audit Logs", value: logCount, icon: ScrollText, color: "text-amber-400", href: "/admin/logs" },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Overview</h1>
                <p className="text-slate-500 text-sm mt-0.5">Platform-wide metrics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map(({ label, value, icon: Icon, color, href }) => (
                    <Card key={label} className="bg-white/[0.03] border-white/8 hover:bg-white/[0.05] transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                            <div>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-xl font-bold text-white">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/8">
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Users by Tier</p>
                        {["FREE", "PRO", "BUSINESS"].map((tier) => (
                            <div key={tier} className="flex justify-between text-sm">
                                <span className="text-slate-400">{tier}</span>
                                <span className="text-white font-medium">{tierMap[tier] || 0}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/8">
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Productions by Status</p>
                        {["QUEUED", "PROCESSING", "COMPLETED", "FAILED"].map((status) => (
                            <div key={status} className="flex justify-between text-sm">
                                <span className="text-slate-400">{status}</span>
                                <span className="text-white font-medium">{statusMap[status] || 0}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-3">
                <LinkButton href="/admin/users" variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white">
                    Manage Users →
                </LinkButton>
                <LinkButton href="/admin/subscriptions" variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white">
                    Subscriptions →
                </LinkButton>
                <LinkButton href="/admin/logs" variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white">
                    Audit Logs →
                </LinkButton>
            </div>
        </div>
    );
}
