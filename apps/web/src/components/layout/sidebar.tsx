"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FolderOpen, Settings, ScrollText, LogOut, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dự án", icon: FolderOpen },
    { href: "/settings", label: "Cài đặt", icon: Settings },
];

const ADMIN_ITEMS = [
    { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = (session?.user as Record<string, unknown>)?.role;
    const quota = (session?.user as Record<string, unknown>)?.quota as
        | { video: { used: number; limit: number } }
        | undefined;

    const quotaPercent = quota
        ? Math.round((quota.video.used / quota.video.limit) * 100)
        : 0;

    return (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen">
            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        RenmaeAI
                    </h1>
                </Link>
                {quota && (
                    <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Quota</span>
                            <span>{quota.video.used}/{quota.video.limit} videos</span>
                        </div>
                        <Progress value={quotaPercent} className="h-1.5" />
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
                            className={cn(
                                buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                                "w-full justify-start gap-3",
                                isActive && "bg-primary/15 text-primary hover:bg-primary/20"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}

                {userRole === "ADMIN" && (
                    <>
                        <Separator className="my-3" />
                        <p className="text-xs text-muted-foreground px-3 mb-1 font-medium uppercase tracking-wider">
                            Admin
                        </p>
                        {ADMIN_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                                        "w-full justify-start gap-3",
                                        isActive && "bg-primary/15 text-primary hover:bg-primary/20"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {session?.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {session?.user?.email}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}
