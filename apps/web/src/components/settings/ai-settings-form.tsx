"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Key,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    Zap,
    RefreshCw,
} from "lucide-react";

interface ModelInfo {
    id: string;
    name: string;
    description?: string;
}

interface AISettingsFormProps {
    initialSettings: Record<string, string>;
    saveAction: (formData: FormData) => Promise<void>;
}

export function AISettingsForm({ initialSettings, saveAction }: AISettingsFormProps) {
    // Gemini state
    const [geminiKey, setGeminiKey] = useState(initialSettings.geminiKey || "");
    const [geminiModels, setGeminiModels] = useState<ModelInfo[]>([]);
    const [geminiModel, setGeminiModel] = useState(initialSettings.geminiModel || "");
    const [geminiStatus, setGeminiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [geminiError, setGeminiError] = useState("");

    // OpenAI state
    const [openaiKey, setOpenaiKey] = useState(initialSettings.openaiKey || "");
    const [openaiBaseUrl, setOpenaiBaseUrl] = useState(initialSettings.openaiBaseUrl || "");
    const [openaiModels, setOpenaiModels] = useState<ModelInfo[]>([]);
    const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel || "");
    const [openaiStatus, setOpenaiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [openaiError, setOpenaiError] = useState("");

    // Save state
    const [isPending, startTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    // Load models for a provider
    const loadModels = useCallback(async (
        provider: "gemini" | "openai",
        apiKey: string,
        baseUrl?: string,
    ) => {
        const setStatus = provider === "gemini" ? setGeminiStatus : setOpenaiStatus;
        const setError = provider === "gemini" ? setGeminiError : setOpenaiError;
        const setModels = provider === "gemini" ? setGeminiModels : setOpenaiModels;

        if (!apiKey || apiKey.trim().length < 5) {
            setError("Nhập API key trước");
            setStatus("error");
            return;
        }

        setStatus("loading");
        setError("");

        try {
            const res = await fetch("/api/proxy/ai/list-models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, apiKey, baseUrl }),
            });

            const data = await res.json();

            if (data.success && data.models?.length > 0) {
                setModels(data.models);
                setStatus("success");
                toast.success(`Tìm thấy ${data.models.length} model`);
            } else {
                const msg = data.error || "Không tìm thấy model nào";
                setError(msg);
                setStatus("error");
                toast.error(msg);
            }
        } catch (e) {
            setError("Lỗi kết nối server");
            setStatus("error");
            toast.error("Lỗi kết nối server");
        }
    }, []);

    return (
        <form action={(formData) => {
            startTransition(async () => {
                try {
                    await saveAction(formData);
                    setSaveStatus("success");
                    toast.success("Đã lưu cài đặt AI!");
                    setTimeout(() => setSaveStatus("idle"), 3000);
                } catch {
                    setSaveStatus("error");
                    toast.error("Lưu thất bại. Thử lại.");
                    setTimeout(() => setSaveStatus("idle"), 3000);
                }
            });
        }}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Token AI (BYOK)
                    </CardTitle>
                    <CardDescription>
                        Bring Your Own Key — dùng API key cá nhân để bỏ qua giới hạn quota
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Save success/error banner */}
                    {saveStatus === "success" && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-500 animate-in fade-in slide-in-from-top-1 duration-200">
                            <CheckCircle className="h-4 w-4" />
                            Đã lưu cài đặt thành công!
                        </div>
                    )}
                    {saveStatus === "error" && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500 animate-in fade-in duration-200">
                            <XCircle className="h-4 w-4" />
                            Lưu thất bại. Thử lại.
                        </div>
                    )}
                    {/* ══════ Gemini Section ══════ */}
                    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-card/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-blue-500" />
                                Google Gemini
                            </Label>
                            {geminiStatus === "success" && (
                                <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1 text-xs">
                                    <CheckCircle className="h-3 w-3" /> Key hợp lệ
                                </Badge>
                            )}
                            {geminiStatus === "error" && (
                                <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1 text-xs">
                                    <XCircle className="h-3 w-3" /> {geminiError}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                name="gemini_key"
                                type="password"
                                value={geminiKey}
                                onChange={e => { setGeminiKey(e.target.value); setGeminiStatus("idle"); }}
                                placeholder="AIza... (lấy từ aistudio.google.com)"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0 gap-1"
                                disabled={geminiStatus === "loading"}
                                onClick={() => loadModels("gemini", geminiKey)}
                            >
                                {geminiStatus === "loading" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Load Models
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Lấy key miễn phí tại{" "}
                            <a href="https://aistudio.google.com/apikey" target="_blank" className="text-primary underline">
                                Google AI Studio
                            </a>
                        </p>

                        {geminiModels.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Chọn model Gemini</Label>
                                <Select
                                    name="gemini_model"
                                    value={geminiModel}
                                    onValueChange={(v) => setGeminiModel(v ?? "")}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Chọn model..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {geminiModels.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <span className="font-medium">{m.id}</span>
                                                {m.description && (
                                                    <span className="text-muted-foreground ml-2 text-xs">
                                                        — {m.description}
                                                    </span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* ══════ OpenAI Section ══════ */}
                    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-card/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-green-500" />
                                OpenAI / Compatible
                            </Label>
                            {openaiStatus === "success" && (
                                <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1 text-xs">
                                    <CheckCircle className="h-3 w-3" /> Key hợp lệ
                                </Badge>
                            )}
                            {openaiStatus === "error" && (
                                <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1 text-xs">
                                    <XCircle className="h-3 w-3" /> {openaiError}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                name="openai_key"
                                type="password"
                                value={openaiKey}
                                onChange={e => { setOpenaiKey(e.target.value); setOpenaiStatus("idle"); }}
                                placeholder="sk-..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0 gap-1"
                                disabled={openaiStatus === "loading"}
                                onClick={() => loadModels("openai", openaiKey, openaiBaseUrl)}
                            >
                                {openaiStatus === "loading" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Load Models
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Base URL (tuỳ chọn)</Label>
                            <Input
                                name="openai_base_url"
                                value={openaiBaseUrl}
                                onChange={e => setOpenaiBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1 (để trống = mặc định)"
                                className="h-8 text-xs"
                            />
                        </div>

                        {openaiModels.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Chọn model OpenAI</Label>
                                <Select
                                    name="openai_model"
                                    value={openaiModel}
                                    onValueChange={(v) => setOpenaiModel(v ?? "")}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Chọn model..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {openaiModels.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* ══════ Other Keys ══════ */}
                    <div className="space-y-2">
                        <Label htmlFor="glabs_token">G-Labs Token (Video Gen)</Label>
                        <Input
                            id="glabs_token"
                            name="glabs_token"
                            type="password"
                            defaultValue={initialSettings.glabs_token || ""}
                            placeholder="Dán token G-Labs tại đây..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="elevenlabs_key">ElevenLabs API Key</Label>
                        <Input
                            id="elevenlabs_key"
                            name="elevenlabs_key"
                            type="password"
                            defaultValue={initialSettings.elevenlabs_key || ""}
                            placeholder="sk-..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>TTS Provider</Label>
                        <Select name="tts_provider" defaultValue={initialSettings.tts_provider || "edge-tts"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn TTS Provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="edge-tts">Edge TTS (Miễn phí)</SelectItem>
                                <SelectItem value="elevenlabs">ElevenLabs (Cần API Key)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <Button type="submit" className="w-full gap-2" disabled={isPending}>
                        {isPending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
                        ) : saveStatus === "success" ? (
                            <><CheckCircle className="h-4 w-4" /> Đã lưu!</>
                        ) : (
                            <><Save className="h-4 w-4" /> Lưu cài đặt</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </form>
    );
}
