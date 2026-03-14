"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
    const { scrollYProgress } = useScroll();
    const headerY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
    const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

    return (
        <motion.div style={{ y: headerY, opacity }} className="text-center pt-10 pb-4 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide mb-8">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Client-Side Compilation Engine V2
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold text-white tracking-tight mb-6 leading-[1.1] text-balance">
                Sản Xuất Video AI <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">Dành Cho Chuyên Gia.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed text-balance">
                Hệ thống tự động hóa hoàn toàn từ Transcript YouTube đến Video 4K. Kéo thả kịch bản, AI Director đảm nhiệm góc quay, và Render trực tiếp trên trình duyệt mà không cần máy chủ.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/login">
                    <Button size="lg" className="h-14 px-8 text-sm uppercase font-bold tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 rounded-full transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                        Khởi Tạo Workspace <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}
