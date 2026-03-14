import { Youtube, Clapperboard, LayoutTemplate, Cpu } from "lucide-react";

const PIPELINE_CARDS = [
    {
        icon: Youtube,
        color: "blue",
        title: "1. Nạp Dữ Liệu",
        desc: "Trích xuất Transcript gốc từ YouTube, tự động lấy Meta Tag và phân tích Profile / Style của Kịch bản gốc. Nhận diện giọng văn và nhịp độ.",
    },
    {
        icon: Clapperboard,
        color: "purple",
        title: "2. Đạo Diễn AI",
        desc: "Chia nhỏ bài văn thành các cảnh (Scenes), quyết định góc quay, chi tiết máy ảnh và chốt lại thành một kịch bản Video Storyboard hoàn thiện.",
    },
    {
        icon: LayoutTemplate,
        color: "orange",
        title: "3. Dựng Hình & Âm",
        desc: "Tích hợp ElevenLabs TTS đọc Audio chất lượng Studio. Tự động sinh Prompt VEO & Reference Image Generator để giữ nhân vật đồng nhất 100%.",
    },
    {
        icon: Cpu,
        color: "cyan",
        title: "4. Đóng Gói Client",
        desc: "Render Frame và chèn Audio/Video trực tiếp tại trình duyệt bằng FFmpeg. Đóng gói Metadata chuẩn SEO sẵn sàng Upload.",
    },
] as const;

const COLOR_MAP: Record<string, { bg: string; glow: string; border: string; text: string }> = {
    blue: { bg: "bg-blue-500/10", glow: "bg-blue-500/10 group-hover:bg-blue-500/20", border: "border-blue-500/20", text: "text-blue-400" },
    purple: { bg: "bg-purple-500/10", glow: "bg-purple-500/10 group-hover:bg-purple-500/20", border: "border-purple-500/20", text: "text-purple-400" },
    orange: { bg: "bg-orange-500/10", glow: "bg-orange-500/10 group-hover:bg-orange-500/20", border: "border-orange-500/20", text: "text-orange-400" },
    cyan: { bg: "bg-cyan-500/10", glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20", border: "border-cyan-500/20", text: "text-cyan-400" },
};

export function PipelineSection() {
    return (
        <div className="mt-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                    Quy Trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">13 Bước Tự Động.</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                    Từ lúc nhập Link Video đến lúc tải file MP4 4K, toàn bộ hệ thống phối hợp liền mạch dựa trên công nghệ AI tân tiến nhất.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PIPELINE_CARDS.map((card) => {
                    const colors = COLOR_MAP[card.color];
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                            <div className={`absolute -right-10 -top-10 h-32 w-32 ${colors.glow} rounded-full blur-3xl transition-all`}></div>
                            <div className={`${colors.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${colors.border}`}>
                                <Icon className={`h-6 w-6 ${colors.text}`} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-3">{card.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
