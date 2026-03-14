"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   PageContainer — Unified wrapper cho tất cả app pages
   Constraints: max-w-6xl, consistent padding, auto-center
   ============================================================ */
export function PageContainer({
    children,
    className,
    fullWidth = false,
}: {
    children: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
}) {
    return (
        <div
            className={cn(
                "w-full px-4 sm:px-6 lg:px-8 py-6",
                !fullWidth && "max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
}

/* ============================================================
   PageHeader — Unified header pattern cho tất cả pages
   icon + title + optional description + optional action buttons
   ============================================================ */
export function PageHeader({
    icon,
    title,
    description,
    actions,
    className,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
            <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2.5 text-white truncate">
                    {icon}
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

/* ============================================================
   Breadcrumbs — Auto-generated from pathname
   Dashboard → "Dự án"
   Project   → "Dự án / Project Name"
   Settings  → "Cài đặt"
   ============================================================ */

const ROUTE_LABELS: Record<string, string> = {
    dashboard: "Dự án",
    settings: "Cài đặt",
    projects: "Dự án",
    admin: "Quản trị",
    logs: "Nhật ký",
};

export function Breadcrumbs({
    items,
    className,
}: {
    items?: { label: string; href?: string }[];
    className?: string;
}) {
    const pathname = usePathname();

    // Auto-generate from pathname if no items provided
    const breadcrumbs = items || generateBreadcrumbs(pathname);

    if (breadcrumbs.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <li key={index} className="flex items-center gap-1.5">
                            {index > 0 && (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            )}
                            {isLast || !item.href ? (
                                <span className={cn(
                                    "truncate max-w-[200px]",
                                    isLast ? "text-white font-medium" : ""
                                )}>
                                    {index === 0 && <Home className="h-3.5 w-3.5 inline mr-1" />}
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="hover:text-white transition-colors truncate max-w-[200px]"
                                >
                                    {index === 0 && <Home className="h-3.5 w-3.5 inline mr-1" />}
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function generateBreadcrumbs(pathname: string): { label: string; href?: string }[] {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href?: string }[] = [];

    let currentPath = "";
    for (const segment of segments) {
        currentPath += `/${segment}`;
        const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);
        crumbs.push({ label, href: currentPath });
    }

    // Remove href from last item
    if (crumbs.length > 0) {
        crumbs[crumbs.length - 1].href = undefined;
    }

    return crumbs;
}
