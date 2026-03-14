import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clapperboard } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

            <div className="text-center space-y-6 relative z-10">
                <Clapperboard className="h-16 w-16 text-primary/20 mx-auto" />
                <h1 className="text-7xl font-heading font-bold text-white">404</h1>
                <p className="text-slate-400 text-lg">Trang bạn tìm không tồn tại</p>
                <Link href="/">
                    <Button variant="outline" className="gap-2 bg-white/5 hover:bg-white/10 border-white/10 text-white mt-4">
                        <ArrowLeft className="h-4 w-4" /> Về trang chủ
                    </Button>
                </Link>
            </div>
        </div>
    );
}
