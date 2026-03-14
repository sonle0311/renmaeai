import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { FolderOpen, Film, Plus, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/layout/page-components";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { productions: true } } },
        orderBy: { createdAt: "desc" },
    });

    const totalVideos = projects.reduce((sum, p) => sum + p._count.productions, 0);
    const tier = session.user.subscriptionTier ?? "FREE";

    async function createProject(formData: FormData) {
        "use server";
        const currentSession = await auth();
        if (!currentSession?.user) return;

        const name = formData.get("name") as string;
        if (!name?.trim()) return;

        await prisma.project.create({
            data: {
                userId: currentSession.user.id!,
                name: name.trim(),
            },
        });

        revalidatePath("/dashboard");
    }

    return (
        <PageContainer>
            {/* Page Header with Create Action */}
            <PageHeader
                icon={<FolderOpen className="h-6 w-6 text-primary" />}
                title="Dự án"
                description={`${projects.length} dự án · ${totalVideos} video`}
                actions={
                    <form action={createProject} className="flex gap-2">
                        <Input
                            name="name"
                            required
                            placeholder="Tên dự án mới..."
                            className="w-48 lg:w-64 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 h-9 text-sm"
                        />
                        <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 gap-1.5">
                            <Plus className="h-4 w-4" />
                            Tạo
                        </Button>
                    </form>
                }
            />

            {/* Compact Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <FolderOpen className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Dự án</p>
                        <p className="text-xl font-bold text-white">{projects.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Film className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Video</p>
                        <p className="text-xl font-bold text-white">{totalVideos}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Crown className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Gói cước</p>
                        <Badge className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 mt-0.5">
                            {tier}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Project Grid or Empty State */}
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-white/5 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10">
                        <Sparkles className="h-10 w-10 text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Chào mừng đến RenmaeAI!</h2>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                        Tạo dự án đầu tiên để bắt đầu sản xuất video AI tự động.
                        Hệ thống 13-bước sẽ chuyển đổi ý tưởng thành video chuyên nghiệp.
                    </p>
                    <form action={createProject} className="flex gap-2">
                        <Input
                            name="name"
                            required
                            placeholder="VD: Kênh YouTube AI..."
                            className="w-64 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        />
                        <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 gap-2">
                            <Plus className="h-4 w-4" /> Tạo dự án đầu tiên
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/5 shadow-lg hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all duration-300 group cursor-pointer h-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors" />
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center justify-between">
                                        <span className="truncate">{project.name}</span>
                                        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Film className="h-3 w-3" />
                                            {project._count.productions} video
                                        </span>
                                        <span className="text-slate-700">•</span>
                                        <span>
                                            {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
