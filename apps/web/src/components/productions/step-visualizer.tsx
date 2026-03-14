import React, { useState } from "react";
import { 
    Youtube, FileText, Activity, Brain, CheckCircle2, List, LayoutTemplate, 
    Layers, Clock, Palette, Film, Quote, Scissors, Music, Video, Fingerprint, Image, Search, Link, Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VisualizerProps {
    output: Record<string, any>;
}

export function StepVisualizerRouter({ stepNumber, output }: { stepNumber: number; output: Record<string, any> }) {
    if (!output || Object.keys(output).length === 0) {
        return <EmptyVisualizer />;
    }

    switch (stepNumber) {
        case 1: return <YoutubeExtractVisualizer output={output} />;
        case 2: return <StyleAnalysisVisualizer output={output} />;
        case 3: return <ScriptGenerationVisualizer output={output} />;
        case 4: return <SceneSplittingVisualizer output={output} />;
        case 5: return <ConceptAnalysisVisualizer output={output} />;
        case 6: return <TTSVisualizer output={output} />;
        case 7: return <VideoDirectionVisualizer output={output} />;
        case 8: return <VeoPromptsVisualizer output={output} />;
        case 9: return <EntityExtractionVisualizer output={output} />;
        case 10: return <ReferencePromptsVisualizer output={output} />;
        case 11: return <SceneBuilderPromptsVisualizer output={output} />;
        case 12: return <SeoMetadataVisualizer output={output} />;
        default: return <RawJsonVisualizer output={output} />;
    }
}

function EmptyVisualizer() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-black/40 rounded-xl border border-white/5">
            <Clock className="h-8 w-8 text-slate-500 mb-3 animate-pulse" />
            <p className="text-sm text-slate-400">Chưa có dữ liệu cho bước này.</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 1: YouTube Extract
// ─────────────────────────────────────────────────────────────
function YoutubeExtractVisualizer({ output }: VisualizerProps) {
    const { youtubeMetadata, workingScript } = output;
    return (
        <div className="flex flex-col gap-6 text-slate-300">
            {youtubeMetadata && (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex gap-6">
                        {youtubeMetadata.thumbnail_url && (
                            <div className="shrink-0 w-48 aspect-video rounded-lg overflow-hidden border border-white/10 relative shadow-lg">
                                <img src={youtubeMetadata.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                            </div>
                        )}
                        <div className="flex flex-col justify-center">
                            <Badge className="w-fit mb-3 bg-red-500/10 text-red-400 border-red-500/20">
                                <Youtube className="h-3 w-3 mr-1" /> Nguồn Video
                            </Badge>
                            <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                                {youtubeMetadata.title || "Không có tiêu đề"}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                Kênh: <span className="text-slate-300">{youtubeMetadata.author_name || "Unknown"}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Nội Dung Gốc Đã Trích Xuất
                    </h4>
                    <div className="flex gap-2 text-xs font-mono text-slate-500">
                        <span className="px-2 py-1 bg-white/5 rounded-md border border-white/5">
                            Data: {workingScript?.length || 0} ký tự
                        </span>
                        <span className="px-2 py-1 bg-white/5 rounded-md border border-white/5 text-emerald-400">
                            Ready for AI
                        </span>
                    </div>
                </div>
                <div className="bg-surface border border-white/10 rounded-xl p-5 overflow-y-auto max-h-[350px] custom-scrollbar shadow-inner relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50 rounded-l-xl"></div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {workingScript || "Không tìm thấy nội dung văn bản..."}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2: Style Analysis
// ─────────────────────────────────────────────────────────────
function StyleAnalysisVisualizer({ output }: VisualizerProps) {
    const { hasStyleProfile, styleProfile } = output;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hồ Sơ Phong Cách (Style Profile)</h3>
                {!hasStyleProfile && <Badge variant="destructive">Missing</Badge>}
            </div>
            {styleProfile ? (
                 <div className="bg-surface border border-white/10 rounded-xl p-6 shadow-inner relative group hover:border-purple-500/30 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 group-hover:bg-purple-500 rounded-l-xl transition-colors"></div>
                     <pre className="text-xs text-purple-100/90 font-mono whitespace-pre-wrap leading-relaxed">
                         {JSON.stringify(styleProfile, null, 2)}
                     </pre>
                 </div>
            ) : (
                <p className="text-slate-500 text-sm">Không tìm thấy thông số profile.</p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 3: Script Generation
// ─────────────────────────────────────────────────────────────
function ScriptGenerationVisualizer({ output }: VisualizerProps) {
    const { originalAnalysis, outlineA, draftSections, wordCount } = output;
    const [activeTab, setActiveTab] = useState("sections");

    const analysisSummary = originalAnalysis?.overallStyle || originalAnalysis?.primaryTopic || "AI Generated";

    return (
        <div className="flex flex-col gap-6 text-slate-300">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <FileText className="h-6 w-6 text-blue-400 mb-2" />
                    <span className="text-2xl font-bold text-white">{wordCount || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Tổng Số Từ</span>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                    <Layers className="h-6 w-6 text-emerald-400 mb-2" />
                    <span className="text-2xl font-bold text-white">{draftSections?.length || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Phân Đoạn</span>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <Activity className="h-6 w-6 text-purple-400 mb-2" />
                    <span className="text-lg font-bold text-white tracking-widest truncate max-w-full px-2" title={analysisSummary}>{analysisSummary}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Trọng Tâm</span>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-white/10 pb-0">
                <button 
                    className={`px-4 py-3 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'sections' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    onClick={() => setActiveTab('sections')}
                >
                    <List className="h-4 w-4" /> Bản Nháp Kịch Bản
                </button>
                <button 
                    className={`px-4 py-3 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'outline' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    onClick={() => setActiveTab('outline')}
                >
                    <LayoutTemplate className="h-4 w-4" /> Dàn Ý
                </button>
                <button 
                    className={`px-4 py-3 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'analysis' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    <Brain className="h-4 w-4" /> Phân Tích Kịch Bản
                </button>
            </div>

            <div className="min-h-[250px]">
                {activeTab === 'sections' && (
                    <div className="space-y-4">
                        {Array.isArray(draftSections) && draftSections.map((section: any, idx: number) => (
                            <div key={idx} className="bg-surface border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors relative overflow-hidden group shadow-sm">
                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600/30 group-hover:bg-cyan-500 transition-colors"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Badge className="bg-cyan-500/20 text-cyan-400 border-none px-2 rounded-sm font-mono text-[10px]">
                                            Phần {idx + 1}
                                        </Badge>
                                        <span className="text-slate-400 font-medium text-xs border border-white/10 px-2 py-0.5 rounded">
                                            {section.intent || "Paragraph Intent"}
                                        </span>
                                    </h5>
                                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><FileText className="h-3 w-3" /> {section.wordCount} words</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap pl-2 border-l border-white/5 mt-2">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'outline' && (
                    <RawJsonVisualizer output={outlineA || { message: "No outline generated" }} color="purple" />
                )}
                {activeTab === 'analysis' && (
                    <RawJsonVisualizer output={originalAnalysis || { message: "No analysis available" }} color="pink" />
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 4: Scene Splitting
// ─────────────────────────────────────────────────────────────
function SceneSplittingVisualizer({ output }: VisualizerProps) {
    const { scenes, totalScenes } = output;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chia Phân Cảnh (Scenes)</h3>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">{totalScenes} Cảnh</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {Array.isArray(scenes) && scenes.map((scene: any, i: number) => (
                    <div key={i} className="bg-surface border border-white/5 rounded-lg p-4 flex gap-4 hover:bg-white/[0.02] hover:border-indigo-500/30 transition-colors group relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors rounded-l-lg"></div>
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                            <span className="text-indigo-400 font-bold font-mono text-lg">{scene.id || i+1}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                                {scene.text}
                            </p>
                            <div className="flex gap-3 text-[10px] font-mono text-slate-500">
                                <span className="bg-black/50 px-2 py-1 rounded border border-white/5">~ {scene.estimatedDurationSeconds} giây</span>
                                <span className="bg-black/50 px-2 py-1 rounded border border-white/5">{scene.wordCount} chữ</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 5: Concept Analysis
// ─────────────────────────────────────────────────────────────
function ConceptAnalysisVisualizer({ output }: VisualizerProps) {
    const { conceptAnalysis, genre, hasEmotionalArc } = output;
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Phân Tích Concept Điện Ảnh</h3>
            </div>
            
            <div className="flex gap-4">
                <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-300 px-4 py-1.5 text-xs">
                    Genre: {genre || "Unknown"}
                </Badge>
                {hasEmotionalArc && (
                     <Badge className="bg-orange-500/10 border-orange-500/30 text-orange-300 px-4 py-1.5 text-xs">
                         Có Emotional Arc
                     </Badge>
                )}
            </div>

            <RawJsonVisualizer output={conceptAnalysis || output} color="amber" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 6: Voice TTS
// ─────────────────────────────────────────────────────────────
function TTSVisualizer({ output }: VisualizerProps) {
    const { ttsProvider, ttsVoice, ttsAudioUrls } = output;
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Xử Lý Âm Thanh Voice AI</h3>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {ttsProvider} - {ttsVoice}
                </Badge>
            </div>
            
            {Array.isArray(ttsAudioUrls) && ttsAudioUrls.length > 0 ? (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
                    <div className="grid grid-cols-12 bg-white/5 p-3 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
                        <div className="col-span-1">Cảnh</div>
                        <div className="col-span-8">Transcript Thu Âm</div>
                        <div className="col-span-3 text-right">Trạng thái Audio</div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {ttsAudioUrls.map((seg: any, i: number) => (
                            <div key={i} className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.02] transition-colors">
                                <div className="col-span-1 text-slate-500 font-mono text-sm">{seg.sceneId}</div>
                                <div className="col-span-8 pr-4">
                                    <p className="text-xs text-slate-300 line-clamp-2">{seg.text}</p>
                                </div>
                                <div className="col-span-3 flex justify-end">
                                    {seg.audioUrl ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> {seg.durationSeconds}s
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-500">Failed / Wait</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <RawJsonVisualizer output={output} color="emerald" />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 7: Video Direction
// ─────────────────────────────────────────────────────────────
function VideoDirectionVisualizer({ output }: VisualizerProps) {
    const { directionNotes, directionCount } = output;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Film className="h-5 w-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Đạo Diễn Hình Ảnh</h3>
                <Badge className="ml-auto bg-rose-500/10 text-rose-300 border-rose-500/20">{directionCount || 0} Chỉ đạo</Badge>
            </div>
            <RawJsonVisualizer output={directionNotes || output} color="rose" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 8: VEO Prompts
// ─────────────────────────────────────────────────────────────
function VeoPromptsVisualizer({ output }: VisualizerProps) {
    const { veoMode, scenes } = output;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tạo VEO Prompts</h3>
                <Badge className="ml-auto bg-sky-500/10 text-sky-300 border-sky-500/20">{veoMode}</Badge>
            </div>
            
            {Array.isArray(scenes) && scenes.some((s: any) => s.veoPrompt) ? (
                 <div className="space-y-3">
                     {scenes.map((s: any, i: number) => s.veoPrompt && (
                         <div key={i} className="bg-surface border border-white/10 rounded-xl p-4 relative group">
                             <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/30 group-hover:bg-sky-400 transition-colors rounded-l-xl"></div>
                             <div className="flex gap-2 mb-2">
                                <Badge variant="outline" className="bg-black/50 text-sky-400 border-sky-500/30 text-[10px]">Cảnh {s.id}</Badge>
                             </div>
                             <p className="text-xs font-mono text-sky-100/90 leading-relaxed italic border-l border-white/5 pl-3">"{s.veoPrompt}"</p>
                         </div>
                     ))}
                 </div>
            ) : (
                <RawJsonVisualizer output={output} color="sky" />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 9: Entity Extraction
// ─────────────────────────────────────────────────────────────
function EntityExtractionVisualizer({ output }: VisualizerProps) {
    const { entities, entityCount } = output;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trích Xuất Đối Tượng (Entities)</h3>
                <Badge className="ml-auto bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20">{entityCount || 0} Đối tượng</Badge>
            </div>
            <RawJsonVisualizer output={entities || output} color="fuchsia" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 10: Reference Prompts
// ─────────────────────────────────────────────────────────────
function ReferencePromptsVisualizer({ output }: VisualizerProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Từ Khóa Tìm Kiếm Tư Liệu</h3>
            </div>
            <RawJsonVisualizer output={output.referencePrompts || output} color="teal" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 11: Scene Builder Prompts
// ─────────────────────────────────────────────────────────────
function SceneBuilderPromptsVisualizer({ output }: VisualizerProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tạo Ảnh Nền (Scene Builder)</h3>
            </div>
            <RawJsonVisualizer output={output.sceneBuilderPrompts || output} color="orange" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 12: SEO & Metadata
// ─────────────────────────────────────────────────────────────
function SeoMetadataVisualizer({ output }: VisualizerProps) {
    const { youtubeTitle, youtubeDescription, thumbnailPrompt } = output;
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chẩn bị Đăng Tải (YouTube SEO)</h3>
            </div>
            
            <div className="bg-surface-raised border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
                {/* YouTube mockup style */}
                <div className="w-full aspect-video bg-black rounded-lg border border-white/5 flex flex-col items-center justify-center text-slate-500 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                    <Youtube className="h-10 w-10 text-red-500/50 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Bản Xem Trước Video</span>
                    <div className="absolute bottom-0 w-full bg-black/80 p-3 text-xs text-slate-300 font-mono border-t border-white/10 overflow-hidden text-ellipsis whitespace-nowrap">
                        Thumbnail Prompt: {thumbnailPrompt || "Chưa tạo ảnh bìa"}
                    </div>
                </div>
                
                <div>
                    <h2 className="text-lg font-bold text-white leading-tight mb-2">
                        {youtubeTitle || "Tiêu đề Video Sẽ Hiện Ở Đây"}
                    </h2>
                    <div className="bg-white/5 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap font-mono relative group">
                        <span className="text-slate-500 text-xs absolute right-3 top-3 uppercase font-bold group-hover:text-red-400 transition-colors">Description</span>
                        {youtubeDescription || "Chưa có mô tả..."}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Universal Fallback / Helper
// ─────────────────────────────────────────────────────────────
function RawJsonVisualizer({ output, color = "slate" }: { output: Record<string, any>; color?: string }) {
    
    const colorClasses: Record<string, { bg: string, text: string, textLight: string }> = {
        slate: { bg: "bg-slate-500/50", text: "text-slate-400", textLight: "text-slate-100/90" },
        purple: { bg: "bg-purple-500/50", text: "text-purple-400", textLight: "text-purple-100/90" },
        pink: { bg: "bg-pink-500/50", text: "text-pink-400", textLight: "text-pink-100/90" },
        amber: { bg: "bg-amber-500/50", text: "text-amber-400", textLight: "text-amber-100/90" },
        emerald: { bg: "bg-emerald-500/50", text: "text-emerald-400", textLight: "text-emerald-100/90" },
        rose: { bg: "bg-rose-500/50", text: "text-rose-400", textLight: "text-rose-100/90" },
        sky: { bg: "bg-sky-500/50", text: "text-sky-400", textLight: "text-sky-100/90" },
        fuchsia: { bg: "bg-fuchsia-500/50", text: "text-fuchsia-400", textLight: "text-fuchsia-100/90" },
        teal: { bg: "bg-teal-500/50", text: "text-teal-400", textLight: "text-teal-100/90" },
        orange: { bg: "bg-orange-500/50", text: "text-orange-400", textLight: "text-orange-100/90" },
    };
    
    const theme = colorClasses[color] || colorClasses.slate;

    return (
        <div className={`bg-surface border border-white/10 p-5 rounded-lg shadow-inner relative w-full overflow-x-auto min-h-[100px] flex items-start group hover:border-${color}-500/30 transition-colors`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg} rounded-l-lg shadow-lg`}></div>
            <pre className={`text-[11px] ${theme.textLight} font-mono whitespace-pre-wrap leading-relaxed tracking-wide min-w-max`}>
                {JSON.stringify(output, null, 2)}
            </pre>
        </div>
    );
}

