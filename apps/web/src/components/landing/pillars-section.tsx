import { ServerOff, Shield, MonitorPlay } from "lucide-react";

const PILLARS = [
    {
        icon: ServerOff,
        color: "blue",
        title: <>Không Chờ Đợi. <br className="hidden lg:block" /> Không Nghẽn Mạng.</>,
        content: (
            <>
                Sẽ ra sao nếu hàng ngàn người cùng Render Video nhưng bạn vẫn không phải xếp hàng chờ đợi?
                <br /><br />
                Nhờ công nghệ tính toán kết xuất phân tán, <strong className="text-slate-200">thời gian xuất file của bạn độc lập hoàn toàn</strong> với máy chủ trung tâm. Trải nghiệm Render Video 4K mượt mà, tốc độ cao dù hệ thống đang trong giờ cao điểm nhất.
            </>
        ),
    },
    {
        icon: Shield,
        color: "orange",
        title: <>Dữ Liệu Thuộc Về <br className="hidden lg:block" /> Riêng Bạn.</>,
        content: (
            <>
                Hỗ trợ Bring Your Own Key (BYOK) - nền tảng cho phép tích hợp trực tiếp các API Key do bạn tự quản lý.
                <br /><br />
                Kịch bản gốc, Hình ảnh phác thảo, và Toàn bộ Project do chính bạn nắm giữ theo mô hình <strong className="text-slate-200">Zero-Knowledge</strong>. Chúng tôi không lưu trữ, không rà quét — đảm bảo ý tưởng triệu view không bao giờ bị rò rỉ.
            </>
        ),
    },
    {
        icon: MonitorPlay,
        color: "cyan",
        title: <>Dựng Phim <br className="hidden lg:block" /> Thời Gian Thực.</>,
        content: (
            <>
                Workspace được thiết kế chuyên nghiệp, lấy cảm hứng từ các phần mềm dựng phim Desktop Native như Premiere hay DaVinci.
                <br /><br />
                Trải nghiệm <strong className="text-slate-200">Bảng điều khiển Telemetry</strong> mạnh mẽ, cho phép bạn giám sát từng Frame xử lý, log lỗi Engine thực tế thay vì một thanh loading nhàm chán.
            </>
        ),
    },
] as const;

const COLOR_MAP: Record<string, { iconBg: string; iconBorder: string; iconShadow: string; iconText: string; gradient: string }> = {
    blue: { iconBg: "bg-blue-500/10", iconBorder: "border-blue-500/20", iconShadow: "shadow-blue-500/10", iconText: "text-blue-400", gradient: "from-blue-500/5" },
    orange: { iconBg: "bg-orange-500/10", iconBorder: "border-orange-500/20", iconShadow: "shadow-orange-500/10", iconText: "text-orange-400", gradient: "from-orange-500/5" },
    cyan: { iconBg: "bg-cyan-500/10", iconBorder: "border-cyan-500/20", iconShadow: "shadow-cyan-500/10", iconText: "text-cyan-400", gradient: "from-cyan-500/5" },
};

export function PillarsSection() {
    return (
        <div className="mt-10">
            <div className="grid lg:grid-cols-3 gap-8">
                {PILLARS.map((pillar, i) => {
                    const colors = COLOR_MAP[pillar.color];
                    const Icon = pillar.icon;
                    return (
                        <div key={i} className="bg-gradient-to-br from-white/[0.05] to-transparent p-10 border border-white/10 rounded-[2rem] hover:border-white/20 transition-all relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-b ${colors.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <div className={`h-16 w-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mb-8 border ${colors.iconBorder} shadow-lg ${colors.iconShadow}`}>
                                <Icon className={`h-8 w-8 ${colors.iconText}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{pillar.title}</h3>
                            <p className="text-slate-400 leading-relaxed relative z-10">{pillar.content}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
