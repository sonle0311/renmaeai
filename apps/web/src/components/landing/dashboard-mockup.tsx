import {
    Activity, Film, Settings2, CheckCircle2, Layers, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DashboardMockup() {
    return (
        <div className="w-full bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col h-auto lg:h-[650px] ring-1 ring-white/5 shadow-2xl shadow-cyan-900/20 overflow-hidden relative">

            {/* Mockup Top Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500/80" />
                        <div className="h-4 w-4 rounded-full bg-yellow-500/80" />
                        <div className="h-4 w-4 rounded-full bg-green-500/80" />
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div>
                        <h2 className="text-white font-bold text-sm">Demo Workspace</h2>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wide">AI Video Automation</p>
                    </div>
                </div>
                <div className="flex items-center p-1 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-md text-white text-xs font-semibold shadow-sm">
                        <Film className="h-3.5 w-3.5" /> Video
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 text-slate-500 text-xs font-semibold hover:text-white transition-colors cursor-pointer">
                        <Settings2 className="h-3.5 w-3.5" /> Cài đặt
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-6">
                {/* Stats bar + Create button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 px-3 py-1 font-semibold rounded-md">
                            <Film className="h-3.5 w-3.5" /> 14 video
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] px-3 py-1 font-semibold rounded-md">
                            <Activity className="h-3.5 w-3.5 animate-spin" /> 1 đang xử lý
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 font-semibold rounded-md">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 13 hoàn thành
                        </Badge>
                    </div>
                    <Button className="h-8 gap-2 bg-white text-black hover:bg-slate-200 text-xs shadow-lg shadow-white/10">
                        <Plus className="h-3.5 w-3.5" /> Thêm Video
                    </Button>
                </div>

                {/* Split Content */}
                <div className="flex gap-6 flex-1 min-h-0">
                    {/* Left: Production List */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Active Processing Item */}
                        <div className="w-full text-left rounded-xl p-3 bg-white/5 ring-1 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] group relative overflow-hidden cursor-default">
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-l-xl"></div>
                            <div className="flex items-start gap-3 pl-2">
                                <Activity className="h-4 w-4 mt-0.5 text-cyan-400 animate-spin flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-white truncate">Review Công Nghệ Tương Lai 2026</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] text-cyan-400 font-bold uppercase">Đang Xử Lý</span>
                                        <span className="text-[10px] text-slate-500">Step 11/13</span>
                                    </div>
                                    <Progress value={85} className="mt-2 h-1.5 w-full bg-black/50" />
                                </div>
                            </div>
                        </div>

                        {/* Completed Item 1 */}
                        <div className="w-full text-left rounded-xl p-3 bg-black/40 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-slate-300 group-hover:text-white truncate transition-colors">Cách AI Lập Trình Thay Lập Trình Viên</p>
                                <span className="text-[10px] text-emerald-500 mt-1 block">Hoàn thành • 12 phút trước</span>
                            </div>
                        </div>

                        {/* Completed Item 2 */}
                        <div className="w-full text-left rounded-xl p-3 bg-black/40 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-slate-400 group-hover:text-white truncate transition-colors">Tóm Tắt Sách Bí Mật Tư Duy</p>
                                <span className="text-[10px] text-emerald-500 mt-1 block">Hoàn thành • Hôm qua</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Detailed Tracking Panel */}
                    <div className="flex-1 border border-white/10 rounded-2xl bg-black/40 overflow-hidden flex flex-col shadow-inner">
                        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-bold text-white mb-1">Review Công Nghệ Tương Lai 2026</h2>
                                <p className="text-[11px] text-slate-500 font-mono">ID: renmae_prod_0x9A2F • Tự động tạo kịch bản 100%</p>
                            </div>
                            <Badge className="px-3 py-1.5 rounded-lg bg-black border border-white/10 flex items-center gap-2 hover:bg-white/5">
                                <Film className="h-3.5 w-3.5 text-slate-400" /> Full Video
                            </Badge>
                        </div>

                        <div className="flex-1 p-6 relative overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-8">
                            {/* Pipeline Steps */}
                            <div className="flex-1 bg-black/60 p-4 rounded-xl border border-white/5 shadow-inner">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-5 flex items-center gap-2"><Layers className="h-3 w-3" /> Chi Tiết 13 Bước Sản Xuất</p>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-slate-800">
                                    {/* Step: Extract — done */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-black bg-emerald-500 shadow shadow-emerald-500 text-black ml-0 md:ml-auto md:mr-0 z-10"><CheckCircle2 className="h-3 w-3" /></div>
                                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-4 md:pl-0 pr-4 mt-0">
                                            <div className="bg-white/[0.03] border border-emerald-500/20 px-3 py-2 rounded-lg text-left">
                                                <h4 className="text-[11px] font-bold text-emerald-400">1. Nạp Dữ Liệu</h4>
                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">1240 words parsed</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Step: Director — done */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-black bg-emerald-500 shadow shadow-emerald-500 text-black ml-0 md:ml-auto md:mr-0 z-10"><CheckCircle2 className="h-3 w-3" /></div>
                                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-4 md:pl-0 pr-4 mt-0">
                                            <div className="bg-white/[0.03] border border-emerald-500/20 px-3 py-2 rounded-lg text-left">
                                                <h4 className="text-[11px] font-bold text-emerald-400">5. AI Director</h4>
                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Futuristic pacing setup</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Step: Rendering — active */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-cyan-800 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] text-black ml-0 md:ml-auto md:mr-0 z-10">
                                            <Activity className="h-3 w-3 animate-spin" />
                                        </div>
                                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-4 md:pl-0 pr-4 mt-0">
                                            <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg text-left relative overflow-hidden">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
                                                <h4 className="text-[11px] font-bold text-cyan-400">11. Render Build</h4>
                                                <span className="text-[10px] text-slate-300 font-mono mt-0.5 block">FFmpeg.wasm compiling chunks...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Mini Preview */}
                            <div className="w-56 flex flex-col gap-4 items-center justify-center shrink-0">
                                <div className="w-full aspect-[9/16] bg-black border border-white/10 rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-fuchsia-500/30 to-cyan-400/20 opacity-70 mix-blend-screen saturate-150 transform scale-105" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-6">
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur border border-white/10 rounded-full flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Rendering...</span>
                                        </div>
                                    </div>
                                    <Activity className="h-10 w-10 text-cyan-400 animate-spin absolute" />
                                </div>
                                <div className="text-center w-full">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Thời Gian Dự Kiến</span>
                                    <span className="text-sm font-mono text-cyan-400 font-bold">00:01:24 left</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
