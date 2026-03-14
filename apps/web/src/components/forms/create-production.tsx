"use client";

import { useState } from "react";
import { Loader2, Rocket, Youtube, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
    { code: "vi", label: "🇻🇳 Tiếng Việt" },
    { code: "en", label: "🇺🇸 English" },
    { code: "ja", label: "🇯🇵 日本語" },
    { code: "ko", label: "🇰🇷 한국어" },
    { code: "zh", label: "🇨🇳 中文" },
    { code: "es", label: "🇪🇸 Español" },
    { code: "fr", label: "🇫🇷 Français" },
    { code: "th", label: "🇹🇭 ไทย" },
    { code: "de", label: "🇩🇪 Deutsch" },
    { code: "pt", label: "🇧🇷 Português" },
    { code: "ru", label: "🇷🇺 Русский" },
];

export function CreateProductionForm({
    projectId,
    projectSettings,
    onCreated,
}: {
    projectId: string;
    projectSettings?: Record<string, unknown>;
    onCreated?: (newProduction: {
        id: string;
        title: string;
        status: "QUEUED";
        currentStep: number;
        mediaGeneration: boolean;
        createdAt: string;
    }) => void;
}) {
    const defaultLang = (projectSettings?.language as string) || "vi";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [language, setLanguage] = useState(defaultLang);
    const [showManualScript, setShowManualScript] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [inputScript, setInputScript] = useState("");
    const [title, setTitle] = useState("");

    const hasValidInput = youtubeUrl.includes("youtube.com/") || youtubeUrl.includes("youtu.be/") || inputScript.length >= 50;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!hasValidInput) {
            setError("Cần nhập YouTube URL hoặc kịch bản (tối thiểu 50 ký tự)");
            return;
        }

        setLoading(true);
        setError("");

        const form = new FormData(e.currentTarget);
        const body = {
            projectId,
            title: title || "Video mới",
            inputScript: inputScript || undefined,
            youtubeUrl: youtubeUrl || undefined,
            language,
            mediaGeneration: form.get("mediaGeneration") === "on",
        };

        try {
            const res = await fetch("/api/proxy/productions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                const msg = data.message || "Có lỗi xảy ra";
                setError(msg);
                toast.error(msg);
                return;
            }

            toast.success("Đã tạo video, đang xử lý...");
            const created = await res.json();
            onCreated?.({
                id: created.id,
                title: body.title || "Video mới",
                status: "QUEUED",
                currentStep: 0,
                mediaGeneration: body.mediaGeneration ?? true,
                createdAt: new Date().toISOString(),
            });
        } catch {
            setError("Không kết nối được server");
            toast.error("Không kết nối được server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* YouTube URL — PRIMARY */}
            <div className="space-y-2">
                <Label htmlFor="youtubeUrl" className="flex items-center gap-2 text-sm font-medium">
                    <Youtube className="h-4 w-4 text-red-500" />
                    YouTube URL
                </Label>
                <Input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-10"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    Dán link → hệ thống tự lấy transcript → AI viết lại script
                </p>
            </div>

            {/* OR divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <button
                        type="button"
                        onClick={() => setShowManualScript(!showManualScript)}
                        className="bg-background px-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <FileText className="h-3 w-3" />
                        hoặc nhập script
                        <ChevronDown className={`h-3 w-3 transition-transform ${showManualScript ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Script — COLLAPSED */}
            {showManualScript && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Textarea
                        value={inputScript}
                        onChange={e => setInputScript(e.target.value)}
                        rows={4}
                        placeholder="Kịch bản gốc (tối thiểu 50 ký tự)..."
                        className="resize-none text-sm"
                    />
                    {inputScript.length > 0 && inputScript.length < 50 && (
                        <p className="text-xs text-destructive">{inputScript.length}/50 ký tự</p>
                    )}
                </div>
            )}

            {/* Title + Language + Gen */}
            <div className="space-y-3">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Tiêu đề (để trống = tự đặt từ YouTube)"
                    className="h-9 text-sm"
                />
                <div className="flex gap-3 items-center">
                    <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                        <SelectTrigger className="w-40 h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map(l => (
                                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                        <Checkbox id="mediaGeneration" name="mediaGeneration" defaultChecked />
                        <Label htmlFor="mediaGeneration" className="text-xs text-muted-foreground cursor-pointer">
                            Tạo video
                        </Label>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading || !hasValidInput}>
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra...</>
                ) : (
                    <><Rocket className="h-4 w-4" /> Tạo Video</>
                )}
            </Button>
        </form>
    );
}
