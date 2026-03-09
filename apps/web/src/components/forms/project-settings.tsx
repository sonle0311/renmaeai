"use client";

import { useState } from "react";
import { Loader2, Save, Sparkles, Video, Paintbrush } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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

const NARRATIVE_VOICES = [
    { value: "first_person", label: "Ngôi thứ 1 (tôi/mình)" },
    { value: "second_person", label: "Ngôi thứ 2 (bạn)" },
    { value: "third_person", label: "Ngôi thứ 3 (họ/narrator)" },
];

const STORYTELLING_STYLES = [
    { value: "immersive", label: "🎭 Nhập vai (Immersive)" },
    { value: "documentary", label: "📹 Thuyết minh (Documentary)" },
    { value: "conversational", label: "💬 Đối thoại (Conversational)" },
    { value: "analytical", label: "🔬 Phân tích (Analytical)" },
    { value: "narrative", label: "📖 Kể chuyện (Narrative)" },
];

const VEO_MODES = [
    {
        value: "scenebuilder",
        label: "🎨 Scene Builder",
        description: "AI xây dựng từng scene chi tiết với nhân vật + bối cảnh (Mặc định)",
    },
    {
        value: "text_to_video",
        label: "🎬 Text to Video",
        description: "AI tạo video hoàn toàn từ mô tả văn bản",
    },
    {
        value: "ingredients_to_video",
        label: "🧩 Ingredients to Video",
        description: "Kết hợp ảnh reference + text để tạo video",
    },
    {
        value: "first_last_frame",
        label: "🖼️ First & Last Frame",
        description: "Chỉ định frame đầu/cuối, AI tạo video chuyển động giữa",
    },
];

const IMAGE_PROMPT_MODES = [
    {
        value: "reference",
        label: "📸 Reference",
        description: "Tạo ảnh tham chiếu cho nhân vật/bối cảnh",
    },
    {
        value: "scene_builder",
        label: "🏗️ Scene Builder",
        description: "Xây dựng scene từ entities đã trích xuất",
    },
    {
        value: "concept",
        label: "💡 Concept Art",
        description: "Tạo concept art cho visual direction",
    },
];

interface ProjectSettings {
    language?: string;
    sourceLanguage?: string;
    channelName?: string;
    targetWordCount?: number;
    narrativeVoice?: string;
    customNarrativeVoice?: string;
    storytellingStyle?: string;
    country?: string;
    addQuiz?: boolean;
    valueType?: string;
    // Video AI settings
    veoMode?: string;
    imagePromptMode?: string;
    visualTheme?: string;
    mainCharacter?: string;
    environmentDescription?: string;
}

export function ProjectSettingsForm({
    projectId,
    initialSettings,
}: {
    projectId: string;
    initialSettings?: ProjectSettings;
}) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState<ProjectSettings>(initialSettings || {
        language: "vi",
        targetWordCount: 800,
    });

    function updateField(key: keyof ProjectSettings, value: unknown) {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    }

    async function handleSave() {
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/proxy/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ globalSettings: settings }),
            });
            if (!res.ok) {
                const data = await res.json();
                const msg = data.message || "Lỗi lưu cài đặt";
                setError(msg);
                toast.error(msg);
                return;
            }
            setSaved(true);
            toast.success("Đã lưu cài đặt thành công!");
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setError("Không kết nối được server");
            toast.error("Không kết nối được server");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Channel & Language */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Kênh & Ngôn ngữ</CardTitle>
                    <CardDescription>Cài đặt chung cho tất cả video trong project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="channelName">Tên kênh YouTube</Label>
                        <Input
                            id="channelName"
                            value={settings.channelName || ""}
                            onChange={e => updateField("channelName", e.target.value)}
                            placeholder="VD: Vlog An Nhiên"
                        />
                        <p className="text-xs text-muted-foreground">
                            Để trống nếu không muốn nhắc tên kênh trong script
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ngôn ngữ đầu ra</Label>
                            <Select
                                value={settings.language || "vi"}
                                onValueChange={v => updateField("language", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {LANGUAGES.find(l => l.code === (settings.language || "vi"))?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Ngôn ngữ nguồn (script gốc)</Label>
                            <Select
                                value={settings.sourceLanguage || "auto"}
                                onValueChange={v => updateField("sourceLanguage", v === "auto" ? "" : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {!settings.sourceLanguage || settings.sourceLanguage === "auto"
                                            ? "🔄 Tự phát hiện"
                                            : LANGUAGES.find(l => l.code === settings.sourceLanguage)?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">🔄 Tự phát hiện</SelectItem>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country">Quốc gia (kiểm tra pháp luật)</Label>
                        <Input
                            id="country"
                            value={settings.country || ""}
                            onChange={e => updateField("country", e.target.value)}
                            placeholder="VD: Việt Nam"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Writing Style */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Phong cách viết</CardTitle>
                    <CardDescription>AI sẽ viết script theo phong cách này</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ngôi kể</Label>
                            <Select
                                value={settings.narrativeVoice || "first_person"}
                                onValueChange={v => updateField("narrativeVoice", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {NARRATIVE_VOICES.find(nv => nv.value === (settings.narrativeVoice || "first_person"))?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {NARRATIVE_VOICES.map(nv => (
                                        <SelectItem key={nv.value} value={nv.value}>{nv.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Phong cách kể</Label>
                            <Select
                                value={settings.storytellingStyle || ""}
                                onValueChange={v => updateField("storytellingStyle", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {settings.storytellingStyle
                                            ? STORYTELLING_STYLES.find(s => s.value === settings.storytellingStyle)?.label
                                            : "Chọn phong cách"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {STORYTELLING_STYLES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customNarrativeVoice">Ngôi kể tùy chỉnh (tuỳ chọn)</Label>
                        <Input
                            id="customNarrativeVoice"
                            value={settings.customNarrativeVoice || ""}
                            onChange={e => updateField("customNarrativeVoice", e.target.value)}
                            placeholder="VD: anh/chị, narrator, ..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetWordCount">Độ dài script mục tiêu (số từ)</Label>
                        <Input
                            id="targetWordCount"
                            type="number"
                            min={200}
                            max={5000}
                            value={settings.targetWordCount || 800}
                            onChange={e => updateField("targetWordCount", parseInt(e.target.value) || 800)}
                        />
                        <p className="text-xs text-muted-foreground">
                            800 từ ≈ 3-4 phút video. 1500 từ ≈ 6-8 phút video.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Video AI Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-500" />
                        Cài đặt Video AI
                    </CardTitle>
                    <CardDescription>Chế độ tạo video và phong cách visual cho pipeline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Chế độ VEO</Label>
                            <Select
                                value={settings.veoMode || "scenebuilder"}
                                onValueChange={v => updateField("veoMode", v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        {VEO_MODES.find(m => m.value === (settings.veoMode || "scenebuilder"))?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {VEO_MODES.map(m => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {VEO_MODES.find(m => m.value === (settings.veoMode || "scenebuilder"))?.description}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Image Prompt Mode</Label>
                            <Select
                                value={settings.imagePromptMode || "reference"}
                                onValueChange={v => updateField("imagePromptMode", v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        {IMAGE_PROMPT_MODES.find(m => m.value === (settings.imagePromptMode || "reference"))?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {IMAGE_PROMPT_MODES.map(m => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {IMAGE_PROMPT_MODES.find(m => m.value === (settings.imagePromptMode || "reference"))?.description}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="visualTheme" className="flex items-center gap-2">
                            <Paintbrush className="h-3.5 w-3.5 text-pink-500" />
                            Visual Theme
                        </Label>
                        <Input
                            id="visualTheme"
                            value={settings.visualTheme || ""}
                            onChange={e => updateField("visualTheme", e.target.value)}
                            placeholder="VD: cinematic, warm lighting, 4K"
                        />
                        <p className="text-xs text-muted-foreground">
                            Phong cách visual chung cho tất cả prompt video/ảnh
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mainCharacter">Nhân vật chính</Label>
                        <Textarea
                            id="mainCharacter"
                            value={settings.mainCharacter || ""}
                            onChange={e => updateField("mainCharacter", e.target.value)}
                            rows={2}
                            placeholder="VD: Một cô gái Việt Nam 25 tuổi, tóc dài đen, mặc áo dài trắng..."
                            className="resize-none text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mô tả nhân vật chính — AI sẽ giữ nhất quán qua các scene
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="environmentDescription">Bối cảnh / Môi trường</Label>
                        <Textarea
                            id="environmentDescription"
                            value={settings.environmentDescription || ""}
                            onChange={e => updateField("environmentDescription", e.target.value)}
                            rows={2}
                            placeholder="VD: Phố cổ Hội An vào buổi chiều tà, đèn lồng đỏ..."
                            className="resize-none text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Bối cảnh chung — AI sẽ dùng cho Video Direction và VEO Prompts
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu...
                    </>
                ) : saved ? (
                    <>
                        <Sparkles className="h-4 w-4" />
                        Đã lưu!
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Lưu cài đặt
                    </>
                )}
            </Button>
        </div>
    );
}
