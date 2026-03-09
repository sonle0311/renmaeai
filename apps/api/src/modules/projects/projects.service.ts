import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async findAllByUser(userId: string) {
        const projects = await this.prisma.project.findMany({
            where: { userId },
            include: { _count: { select: { productions: true } } },
            orderBy: { createdAt: "desc" },
        });

        return {
            data: projects.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                productionCount: p._count.productions,
                createdAt: p.createdAt,
            })),
            total: projects.length,
        };
    }

    async create(
        userId: string,
        data: { name: string; description?: string; globalSettings?: any },
    ) {
        return this.prisma.project.create({
            data: { userId, ...data },
            select: { id: true, name: true },
        });
    }

    async update(
        userId: string,
        projectId: string,
        data: { name?: string; description?: string; globalSettings?: any },
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) throw new NotFoundException("Project not found");
        if (project.userId !== userId) throw new ForbiddenException();

        return this.prisma.project.update({
            where: { id: projectId },
            data,
        });
    }

    async remove(userId: string, projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) throw new NotFoundException("Project not found");
        if (project.userId !== userId) throw new ForbiddenException();

        await this.prisma.project.delete({ where: { id: projectId } });
    }
}
