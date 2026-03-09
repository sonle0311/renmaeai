import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { FolderOpen, Film, Plus, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { productions: true } } },
        orderBy: { createdAt: "desc" },
    });

    const totalVideos = projects.reduce((sum, p) => sum + p._count.productions, 0);
    const tier = (session.user as Record<string, unknown>).subscriptionTier as string ?? "FREE";

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
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                    Dự án
                </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tổng dự án</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{projects.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Film className="h-3.5 w-3.5" /> Tổng video
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalVideos}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Crown className="h-3.5 w-3.5" /> Gói cước
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="text-sm">
                            {tier}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                        <Card className="hover:border-primary/50 transition-colors group cursor-pointer h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base group-hover:text-primary transition-colors">
                                    {project.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Film className="h-3.5 w-3.5" />
                                        {project._count.productions} video
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Create */}
            <form action={createProject} className="flex gap-3 max-w-md">
                <Input
                    name="name"
                    required
                    placeholder="Tên dự án mới..."
                />
                <Button type="submit">
                    <Plus className="h-4 w-4" />
                    Tạo
                </Button>
            </form>
        </div>
    );
}
