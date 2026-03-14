import { prisma } from "@/lib/prisma";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = { title: "Audit Logs — Admin" };

const ACTION_FILTERS = [
    { value: "", label: "Tất cả" },
    { value: "deduct_quota", label: "deduct_quota" },
    { value: "webhook_received", label: "webhook_received" },
    { value: "login_failed", label: "login_failed" },
];

export default async function AdminLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; action?: string }>;
}) {
    // ✅ No role check needed — handled by (admin)/layout.tsx
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const pageSize = 50;
    const actionFilter = params.action;
    const where = actionFilter ? { action: actionFilter } : {};

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                    <ScrollText className="h-5 w-5 text-amber-400" />
                    Audit Logs
                </h1>
                <span className="text-sm text-slate-500">{total} entries</span>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {ACTION_FILTERS.map(({ value, label }) => (
                    <LinkButton
                        key={value}
                        href={`/admin/logs${value ? `?action=${value}` : ""}`}
                        variant={(actionFilter || "") === value ? "default" : "outline"}
                        size="sm"
                        className={(actionFilter || "") === value
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "border-white/10 text-slate-400 hover:text-white"
                        }
                    >
                        {label}
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
                                    {["Thời gian", "User", "Action", "Mô tả"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {log.user?.email || "System"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="text-xs font-mono">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400 max-w-md truncate">
                                            {log.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total} dòng
                </p>
                <div className="flex gap-2">
                    {page > 1 && (
                        <LinkButton href={`/admin/logs?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}`} variant="outline" size="sm" className="border-white/10 text-slate-400">
                            <ChevronLeft className="h-4 w-4" /> Trước
                        </LinkButton>
                    )}
                    {page < totalPages && (
                        <LinkButton href={`/admin/logs?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`} variant="outline" size="sm" className="border-white/10 text-slate-400">
                            Sau <ChevronRight className="h-4 w-4" />
                        </LinkButton>
                    )}
                </div>
            </div>
        </div>
    );
}
