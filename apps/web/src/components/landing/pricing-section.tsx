import Link from "next/link";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TIERS = [
    {
        name: "Trải Nghiệm",
        desc: "Dành cho người mới làm quen với quy trình AI",
        price: "Miễn phí",
        unit: "/ 3 videos",
        highlighted: false,
        cta: "Bắt đầu ngay",
        ctaVariant: "outline" as const,
        features: [
            { text: "Tự động tạo kịch bản cơ bản", included: true },
            { text: "Giọng đọc trung bình (Standard TTS)", included: true },
            { text: "Render Video 720p", included: true },
            { text: "AI Director Pro", included: false },
            { text: "Avatar / Character Consistency", included: false },
        ],
    },
    {
        name: "Pro Creator",
        desc: "Giải pháp hoàn hảo cho Youtuber & Marketer",
        price: "499.000đ",
        unit: "/ tháng",
        highlighted: true,
        cta: "Nâng cấp Pro",
        ctaVariant: "default" as const,
        features: [
            { text: "Everything in Free, plus:", included: true, bold: true },
            { text: "Pipeline 13 Bước V1 Plus", included: true },
            { text: "AI Director (Phân tích góc quay)", included: true },
            { text: "Giọng đọc Studio (ElevenLabs API)", included: true },
            { text: "Xuất Video 4K sắc nét", included: true },
            { text: "Entity Extraction & Identity", included: true },
        ],
    },
    {
        name: "Agency",
        desc: "Sản xuất quy mô công nghiệp",
        price: "1.299.000đ",
        unit: "/ tháng",
        highlighted: false,
        cta: "Liên hệ Sales",
        ctaVariant: "outline" as const,
        features: [
            { text: "Không giới hạn độ dài Video", included: true },
            { text: "Quản lý Workspace nhóm", included: true },
            { text: "Ưu tiên Render GPU (Hàng chờ cao)", included: true },
            { text: "API Access & Webhooks", included: true },
            { text: "Support ưu tiên 1:1", included: true },
        ],
    },
] as const;

export function PricingSection() {
    return (
        <div className="mt-16 pt-16 border-t border-white/5 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="text-center mb-16">
                <Badge variant="outline" className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 uppercase tracking-widest text-[10px]">
                    Bảng giá dịch vụ
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                    Chi Phí Tối Ưu. <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Sáng Tạo Không Giới Hạn.</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg text-balance">
                    Lựa chọn gói phù hợp với nhu cầu sản xuất video của bạn. Hoàn tiền 100% trong 7 ngày nếu không hài lòng.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {TIERS.map((tier) => (
                    <div
                        key={tier.name}
                        className={`rounded-[2rem] p-8 flex flex-col relative overflow-hidden transition-all ${
                            tier.highlighted
                                ? "bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/40 transform md:-translate-y-4"
                                : "bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                        }`}
                    >
                        {tier.highlighted && (
                            <>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/30">
                                        Phổ Biến Nhất
                                    </Badge>
                                </div>
                            </>
                        )}

                        <h3 className={`text-xl font-bold mb-2 ${tier.highlighted ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400" : "text-white"}`}>
                            {tier.name}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 h-10">{tier.desc}</p>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-white">{tier.price}</span>
                            <span className="text-slate-500 text-sm">{tier.unit}</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {tier.features.map((f) => (
                                <li
                                    key={f.text}
                                    className={`flex items-start gap-3 text-sm ${
                                        f.included
                                            ? ("bold" in f && f.bold ? "text-white" : "text-slate-300")
                                            : "text-slate-500"
                                    }`}
                                >
                                    {f.included
                                        ? <Check className={`h-5 w-5 shrink-0 ${tier.highlighted ? "text-cyan-400" : tier.name === "Agency" ? "text-blue-500" : "text-cyan-500"}`} />
                                        : <X className="h-5 w-5 opacity-50 shrink-0" />
                                    }
                                    {f.text}
                                </li>
                            ))}
                        </ul>

                        <Link href="/login" className="w-full mt-auto">
                            {tier.highlighted ? (
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white h-12 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]">
                                    {tier.cta}
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white h-12 rounded-xl">
                                    {tier.cta}
                                </Button>
                            )}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
