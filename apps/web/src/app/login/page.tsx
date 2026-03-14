import { signIn } from "@/auth";
import Image from "next/image";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
            <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none"></div>

            {/* Aurora Background Effects - Brighter for better contrast */}
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/30 blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse [animation-delay:2s] pointer-events-none" />
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-violet-500/20 blur-[100px] animate-pulse [animation-delay:4s] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md mx-auto p-6">
                <div className="!bg-[#0c0c0e] backdrop-blur-2xl border border-cyan-900/40 rounded-3xl p-8 shadow-2xl shadow-cyan-900/20 overflow-hidden relative group">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-opacity duration-500" />

                    {/* Glow effect on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition duration-500 pointer-events-none" />

                    <div className="relative z-10 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-2xl !bg-[#111] border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                            <Image 
                                src="/images/logo-icon.png" 
                                alt="RenmaeAI Logo" 
                                width={40} 
                                height={40} 
                                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                priority
                                unoptimized
                            />
                        </div>
                        <div className="space-y-2 pt-2">
                            <h1 className="text-3xl font-heading font-bold tracking-tight !text-white">
                                Đăng nhập
                            </h1>
                            <p className="text-sm font-medium !text-gray-300 tracking-wide">
                                Căng buồm vào thế giới Video AI
                            </p>
                        </div>

                        <form
                            action={async () => {
                                "use server";
                                await signIn("google", { redirectTo: "/dashboard" });
                            }}
                            className="pt-6"
                        >
                            <Button
                                type="submit"
                                variant="default"
                                className="group relative w-full h-12 gap-3 text-base font-semibold !bg-white hover:!bg-gray-100 border-transparent !text-black transition-all duration-300 rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] overflow-hidden"
                            >
                                <svg className="w-5 h-5 shrink-0 relative z-10" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="relative z-10">Tiếp tục bằng Google</span>
                            </Button>
                        </form>

                        <div className="flex flex-col items-center gap-4 pt-6">
                            <div className="flex items-center gap-2 !text-cyan-400 opacity-90">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] shadow-cyan-400">Next Generation AI</span>
                                <Wand2 className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-center !text-gray-500 text-[11px] leading-relaxed max-w-[260px]">
                                Bằng cách tham gia, bạn đồng ý với các Điều khoản và Chính sách bảo mật của chúng tôi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
