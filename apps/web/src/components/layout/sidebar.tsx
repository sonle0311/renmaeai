"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FolderOpen, Settings, LogOut, Clapperboard, CreditCard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dự án", icon: FolderOpen },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Cài đặt", icon: Settings },
];

const ADMIN_ITEMS = [
    { href: "/admin", label: "Admin Panel", icon: Shield },
];

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const quota = session?.user?.quota;

    const quotaPercent = quota
        ? Math.round((quota.video.used / quota.video.limit) * 100)
        : 0;

    return (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen">
            {/* Logo + Quota */}
            <div className="p-5 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
                    <div className="h-8 w-8 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center p-[2px]">
                        <Image 
                            src="/images/logo-icon.png" 
                            alt="RenmaeAI Logo" 
                            width={24} 
                            height={24} 
                            className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                            priority
                            unoptimized
                        />
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        RenmaeAI
                    </h1>
                </Link>

                {/* Quota Circle */}
                {quota && (
                    <div className="mt-4 flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="relative h-10 w-10 shrink-0">
                            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                                <circle
                                    cx="18" cy="18" r="15" fill="none"
                                    stroke="url(#quota-gradient)" strokeWidth="2"
                                    strokeDasharray={`${quotaPercent * 0.94} 100`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="quota-gradient">
                                        <stop offset="0%" stopColor="var(--p-cyan-400)" />
                                        <stop offset="100%" stopColor="var(--p-violet-500)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {quota.video.used}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground">Video quota</p>
                            <p className="text-xs font-medium text-white">
                                {quota.video.used}/{quota.video.limit}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-white"
                                    : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                            )}
                        >
                            {/* Active left accent */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500" />
                            )}
                            <Icon className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" : ""
                            )} />
                            {item.label}
                        </Link>
                    );
                })}

                {userRole === "ADMIN" && (
                    <>
                        <Separator className="my-3 bg-white/5" />
                        <p className="text-[10px] text-muted-foreground/60 px-3 mb-1 font-semibold uppercase tracking-[0.15em]">
                            Admin
                        </p>
                        {ADMIN_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-white"
                                            : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500" />
                                    )}
                                    <Icon className={cn(
                                        "h-4 w-4 transition-colors",
                                        isActive ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" : ""
                                    )} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User Profile */}
            <div className="p-3 border-t border-sidebar-border">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-8 w-8 ring-2 ring-white/5">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-300 font-bold">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-white">
                            {session?.user?.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {session?.user?.email}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 mt-1 h-8 text-xs"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}
