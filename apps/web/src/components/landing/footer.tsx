import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/30 backdrop-blur-xl">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center p-[2px] shadow-lg shadow-cyan-500/20">
                                <Image 
                                    src="/images/logo-icon.png" 
                                    alt="RenmaeAI Logo" 
                                    width={24} 
                                    height={24} 
                                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                    unoptimized
                                />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">RenmaeAI</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                            Nền tảng sản xuất video AI chuyên nghiệp. Tự động hóa từ Transcript đến Video 4K
                            với công nghệ Client-side Rendering.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Sản phẩm</h3>
                        <ul className="space-y-2">
                            <li><Link href="/login" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Bắt đầu</Link></li>
                            <li><Link href="/#pricing" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Bảng giá</Link></li>
                            <li><Link href="/#pipeline" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Pipeline 13 bước</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Pháp lý</h3>
                        <ul className="space-y-2">
                            <li><Link href="/terms" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Điều khoản sử dụng</Link></li>
                            <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Chính sách bảo mật</Link></li>
                            <li><a href="mailto:sonlt.dev0311@gmail.com" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Liên hệ</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} RenmaeAI. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {/* GitHub */}
                        <a href="https://github.com/sonle0311" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors" aria-label="GitHub">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                        </a>
                        {/* YouTube */}
                        <a href="https://youtube.com/@renmaeai" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-red-400 transition-colors" aria-label="YouTube">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
