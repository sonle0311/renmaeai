import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectWorkspace } from "@/components/projects/workspace";
import { ProjectSettingsForm } from "@/components/forms/project-settings";
import { ArrowLeft, Settings, Film } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export default async function ProjectDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const { tab } = await searchParams;
    const activeTab = tab === "settings" ? "settings" : "workspace";

    const project = await prisma.project.findUnique({
        where: { id, userId: session.user.id },
        include: {
            productions: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!project) redirect("/dashboard");

    const globalSettings = (project.globalSettings || {}) as Record<string, unknown>;

    return (
        <div className="p-6 space-y-0">
            {/* Header bar */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
                <div className="flex items-center gap-3">
                    <LinkButton href="/dashboard" variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </LinkButton>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">{project.name}</h1>
                        {project.description && (
                            <p className="text-muted-foreground text-xs">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Tab switcher — simple pill buttons */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <LinkButton
                        href={`/projects/${id}`}
                        variant={activeTab === "workspace" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                    >
                        <Film className="h-3.5 w-3.5" />
                        Video
                    </LinkButton>
                    <LinkButton
                        href={`/projects/${id}?tab=settings`}
                        variant={activeTab === "settings" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Cài đặt
                    </LinkButton>
                </div>
            </div>

            {/* Content */}
            {activeTab === "workspace" ? (
                <ProjectWorkspace
                    projectId={project.id}
                    projectSettings={globalSettings}
                    initialProductions={project.productions.map((p) => {
                        const out = (p.outputData || {}) as Record<string, any>;
                        return {
                            id: p.id,
                            title: p.title,
                            status: p.status as "DRAFT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED",
                            currentStep: p.currentStep,
                            mediaGeneration: p.mediaGeneration,
                            createdAt: p.createdAt.toISOString(),
                            // Output data from pipeline
                            generatedScript: out.generatedScript,
                            wordCount: out.wordCount,
                            totalScenes: out.totalScenes,
                            scenes: out.scenes,
                            totalDurationSeconds: out.totalDurationSeconds,
                        };
                    })}
                />
            ) : (
                <ProjectSettingsForm
                    projectId={project.id}
                    initialSettings={globalSettings}
                />
            )}
        </div>
    );
}
