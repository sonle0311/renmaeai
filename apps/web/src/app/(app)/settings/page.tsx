import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Settings, Crown, Film, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AISettingsForm } from "@/components/settings/ai-settings-form";
import { PageContainer, PageHeader } from "@/components/layout/page-components";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id! },
        select: {
            aiSettings: true,
            subscriptionTier: true,
            monthlyVideoQuota: true,
            usedVideoCount: true,
            monthlyMinuteQuota: true,
            usedMinuteCount: true,
        },
    });

    const aiSettings = (user?.aiSettings as Record<string, string>) ?? {};

    const videoPercent = user
        ? Math.round((user.usedVideoCount / user.monthlyVideoQuota) * 100)
        : 0;
    const minutePercent = user
        ? Math.round((user.usedMinuteCount / user.monthlyMinuteQuota) * 100)
        : 0;

    async function updateSettings(formData: FormData) {
        "use server";
        const currentSession = await auth();
        if (!currentSession?.user) return;

        const geminiKey = formData.get("gemini_key") as string;
        const geminiModel = formData.get("gemini_model") as string;
        const openaiKey = formData.get("openai_key") as string;
        const openaiBaseUrl = formData.get("openai_base_url") as string;
        const openaiModel = formData.get("openai_model") as string;
        const glabsToken = formData.get("glabs_token") as string;
        const elevenlabsKey = formData.get("elevenlabs_key") as string;
        const ttsProvider = formData.get("tts_provider") as string;

        await prisma.user.update({
            where: { id: currentSession.user.id! },
            data: {
                aiSettings: {
                    geminiKey: geminiKey || "",
                    geminiModel: geminiModel || "",
                    openaiKey: openaiKey || "",
                    openaiBaseUrl: openaiBaseUrl || "",
                    openaiModel: openaiModel || "",
                    glabs_token: glabsToken || "",
                    elevenlabs_key: elevenlabsKey || "",
                    tts_provider: ttsProvider || "edge-tts",
                },
            },
        });

        revalidatePath("/settings");
    }

    return (
        <PageContainer className="max-w-5xl">
            <PageHeader
                icon={<Settings className="h-6 w-6 text-primary" />}
                title="Cài đặt"
                description="Quản lý quota, API keys và tùy chỉnh AI"
            />

            {/* Two-column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Left: Quota Info (compact sidebar) */}
                <div className="space-y-4">
                    <Card className="bg-white/[0.03] border-white/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Crown className="h-4 w-4 text-primary" />
                                Gói cước
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Badge variant="secondary" className="text-xs">
                                    {user?.subscriptionTier}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Film className="h-3 w-3" /> Video
                                        </span>
                                        <span className="font-medium text-white">
                                            {user?.usedVideoCount}/{user?.monthlyVideoQuota}
                                        </span>
                                    </div>
                                    <Progress value={videoPercent} className="h-1.5" />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Phút
                                        </span>
                                        <span className="font-medium text-white">
                                            {user?.usedMinuteCount}/{user?.monthlyMinuteQuota}
                                        </span>
                                    </div>
                                    <Progress value={minutePercent} className="h-1.5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: BYOK Settings (main content) */}
                <div>
                    <AISettingsForm
                        initialSettings={aiSettings}
                        saveAction={updateSettings}
                    />
                </div>
            </div>
        </PageContainer>
    );
}
