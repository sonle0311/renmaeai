import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaFooter() {
    return (
        <div className="text-center mt-12 pb-12 pt-16 border-t border-white/5 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight text-balance">
                Nâng Cấp Quy Trình Của Bạn. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Bắt Đầu Chỉ Với 1 Cú Click.</span>
            </h2>
            <Link href="/login">
                <Button className="h-14 px-10 bg-white text-black hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all font-bold tracking-wide rounded-full text-base shadow-2xl shadow-white/20">
                    Khởi Tạo Phiên Làm Việc Mới <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
        </div>
    );
}
