import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full h-16 border-b border-white/[0.05] bg-background/70 backdrop-blur-xl z-50 flex items-center justify-between px-6 md:px-12 transition-all">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 text-white font-bold tracking-tight text-lg">
                    <div className="h-8 w-8 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center p-[2px] shadow-lg shadow-cyan-500/20">
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
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">RenmaeAI</span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm font-medium tracking-wide">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span>WASM Process: Ready</span>
                </div>
                <Link href="/login">
                    <Button size="sm" className="h-9 px-6 text-xs uppercase font-bold tracking-wider bg-white text-black hover:bg-slate-200 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
                        Bắt Đầu Ngay <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
