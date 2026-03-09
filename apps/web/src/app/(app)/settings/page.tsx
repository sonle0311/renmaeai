import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Settings, Crown, Film, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AISettingsForm } from "@/components/settings/ai-settings-form";

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
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Cài đặt
            </h1>

            {/* Quota Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Quota hiện tại
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Gói cước</p>
                            <Badge variant="secondary" className="text-sm">
                                {user?.subscriptionTier}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Film className="h-3.5 w-3.5" /> Video
                                </span>
                                <span className="font-medium">
                                    {user?.usedVideoCount}/{user?.monthlyVideoQuota}
                                </span>
                            </div>
                            <Progress value={videoPercent} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Phút
                                </span>
                                <span className="font-medium">
                                    {user?.usedMinuteCount}/{user?.monthlyMinuteQuota}
                                </span>
                            </div>
                            <Progress value={minutePercent} className="h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* BYOK Settings — Interactive Client Component */}
            <AISettingsForm
                initialSettings={aiSettings}
                saveAction={updateSettings}
            />
        </div>
    );
}
