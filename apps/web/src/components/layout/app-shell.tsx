"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { PageTransition } from "./page-transition";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop sidebar — always visible on lg+ */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Mobile overlay sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Sidebar drawer */}
                    <div className="fixed inset-y-0 left-0 w-64 z-50 animate-in slide-in-from-left duration-300">
                        <Sidebar onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-auto">
                {/* Mobile header — visible only on small screens */}
                <div className="lg:hidden sticky top-0 z-30 flex items-center h-14 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-white/10"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Mở menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-md bg-zinc-950/80 border border-white/10 flex items-center justify-center p-[2px]">
                            <Image 
                                src="/images/logo-icon.png" 
                                alt="RenmaeAI Logo" 
                                width={16} 
                                height={16} 
                                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                priority
                                unoptimized
                            />
                        </div>
                        <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            RenmaeAI
                        </span>
                    </div>
                </div>

                <main className="flex-1 overflow-auto">
                    <PageTransition key={pathname}>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}

