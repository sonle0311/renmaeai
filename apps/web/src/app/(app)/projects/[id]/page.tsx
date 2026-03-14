import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectWorkspace } from "@/components/projects/workspace";
import { ProjectSettingsForm } from "@/components/forms/project-settings";
import { ArrowLeft, Settings, Film } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { PageContainer, Breadcrumbs } from "@/components/layout/page-components";

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
        <div className="flex flex-col h-[calc(100vh-theme(spacing.14))] lg:h-screen">
            {/* Project Header — Clean, no traffic lights */}
            <div className="shrink-0 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between px-4 sm:px-6 h-14">
                    <div className="flex items-center gap-3 min-w-0">
                        <LinkButton
                            href="/dashboard"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </LinkButton>
                        <div className="h-5 w-px bg-white/10" />
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-white truncate">{project.name}</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                                {project.description || "AI Video Automation"}
                            </p>
                        </div>
                    </div>

                    {/* Tab switcher — refined */}
                    <div className="flex items-center p-1 bg-white/[0.03] rounded-lg border border-white/5">
                        <LinkButton
                            href={`/projects/${id}`}
                            variant={activeTab === "workspace" ? "default" : "ghost"}
                            size="sm"
                            className={`gap-1.5 px-3 py-1.5 h-auto text-xs font-semibold rounded-md ${
                                activeTab === "workspace"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "hover:text-white text-slate-500 transition-colors"
                            }`}
                        >
                            <Film className="h-3.5 w-3.5" /> Video
                        </LinkButton>
                        <LinkButton
                            href={`/projects/${id}?tab=settings`}
                            variant={activeTab === "settings" ? "default" : "ghost"}
                            size="sm"
                            className={`gap-1.5 px-3 py-1.5 h-auto text-xs font-semibold rounded-md ${
                                activeTab === "settings"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "hover:text-white text-slate-500 transition-colors"
                            }`}
                        >
                            <Settings className="h-3.5 w-3.5" /> Cài đặt
                        </LinkButton>
                    </div>
                </div>
            </div>

            {/* Content Area — Full height */}
            <div className="flex-1 overflow-hidden">
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
                                generatedScript: out.generatedScript,
                                wordCount: out.wordCount,
                                totalScenes: out.totalScenes,
                                scenes: out.scenes,
                                totalDurationSeconds: out.totalDurationSeconds,
                            };
                        })}
                    />
                ) : (
                    <div className="overflow-y-auto h-full">
                        <PageContainer className="max-w-4xl">
                            <ProjectSettingsForm
                                projectId={project.id}
                                initialSettings={globalSettings}
                            />
                        </PageContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
