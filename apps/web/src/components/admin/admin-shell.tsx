"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ScrollText, CreditCard, LayoutDashboard, Shield, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import Image from "next/image";

const NAV_ITEMS = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
];

type AdminInfo = {
    name: string | null;
    email: string | null;
    image: string | null;
};

export function AdminShell({
    children,
    admin,
}: {
    children: React.ReactNode;
    admin: AdminInfo;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 flex flex-col border-r border-white/5 bg-black/60">
                {/* Brand */}
                <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/30">
                        <Shield className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white leading-none">Admin Panel</p>
                        <p className="text-[10px] text-amber-400/70 mt-0.5">RenmaeAI</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                        const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";
                        const isOverview = href === "/admin" && pathname === "/admin";
                        const active = isActive || isOverview;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    active
                                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-amber-400" : "text-slate-600")} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: app link + admin info */}
                <div className="p-3 border-t border-white/5 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Back to App
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-2">
                        {admin.image ? (
                            <Image src={admin.image} alt="" width={24} height={24} className="rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                                {(admin.name || admin.email || "A")[0].toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-slate-300 truncate font-medium">{admin.name || admin.email}</p>
                            <p className="text-[10px] text-amber-400/60 uppercase tracking-wider">Admin</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-slate-600 hover:text-slate-300 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
