import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

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
    const session = await auth();
    if (!session?.user) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });
    if (dbUser?.role !== "ADMIN") redirect("/dashboard");

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
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <ScrollText className="h-6 w-6 text-primary" />
                Audit Logs
            </h1>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {ACTION_FILTERS.map(({ value, label }) => (
                    <LinkButton
                        key={value}
                        href={`/admin/logs${value ? `?action=${value}` : ""}`}
                        variant={(actionFilter || "") === value ? "default" : "outline"}
                        size="sm"
                    >
                        {label}
                    </LinkButton>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium">
                                        Thời gian
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium">
                                        User
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium">
                                        Action
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium">
                                        Mô tả
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {log.user?.email || "System"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">
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
                <p className="text-sm text-muted-foreground">
                    Hiển thị {(page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, total)} / {total} dòng
                </p>
                <div className="flex gap-2">
                    {page > 1 && (
                        <LinkButton
                            href={`/admin/logs?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
                            variant="outline"
                            size="sm"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Trước
                        </LinkButton>
                    )}
                    {page < totalPages && (
                        <LinkButton
                            href={`/admin/logs?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
                            variant="outline"
                            size="sm"
                        >
                            Sau
                            <ChevronRight className="h-4 w-4" />
                        </LinkButton>
                    )}
                </div>
            </div>
        </div>
    );
}
