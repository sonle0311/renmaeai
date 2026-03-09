import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { YoutubeExtractService } from "../pipeline/youtube-extract.service";
import { PIPELINE_STEP_LIST } from "../pipeline/pipeline.constants";

const PIPELINE_STEPS = PIPELINE_STEP_LIST;

@Injectable()
export class ProductionsService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue("pipeline") private pipelineQueue: Queue,
        private youtubeExtract: YoutubeExtractService,
    ) { }

    async findAllByProject(userId: string, projectId: string) {
        // Verify project ownership
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) throw new NotFoundException("Project not found");
        if (project.userId !== userId) throw new ForbiddenException();

        const productions = await this.prisma.production.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });

        return { data: productions };
    }

    async findOneWithCheckpoints(userId: string, productionId: string) {
        const production = await this.prisma.production.findUnique({
            where: { id: productionId },
            include: {
                checkpoints: { orderBy: { stepNumber: "asc" } },
                project: { select: { userId: true } },
            },
        });
        if (!production) throw new NotFoundException("Production not found");
        if (production.project.userId !== userId) throw new ForbiddenException();

        return production;
    }

    async createAndEnqueue(
        userId: string,
        data: {
            projectId: string;
            title: string;
            inputScript?: string;
            youtubeUrl?: string;
            language?: string;
            mediaGeneration?: boolean;
        },
    ) {
        // 0. Validate input: must have youtubeUrl OR inputScript
        const hasYoutube = !!data.youtubeUrl;
        const hasScript = !!data.inputScript && data.inputScript.length >= 50;

        if (!hasYoutube && !hasScript) {
            throw new HttpException(
                {
                    error: "MISSING_INPUT",
                    message: "Cần nhập YouTube URL hoặc kịch bản (tối thiểu 50 ký tự).",
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        // 0b. Pre-check: if YouTube URL provided without manual script, verify transcript exists
        if (hasYoutube && !hasScript) {
            const preCheck = await this.youtubeExtract.extract(data.youtubeUrl!);
            if (!preCheck.success) {
                throw new HttpException(
                    {
                        error: "YOUTUBE_NO_TRANSCRIPT",
                        message: preCheck.error || "Video này không có phụ đề. Hãy nhập script thủ công.",
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        // 1. Verify project ownership
        const project = await this.prisma.project.findUnique({
            where: { id: data.projectId },
        });
        if (!project) throw new NotFoundException("Project not found");
        if (project.userId !== userId) throw new ForbiddenException();

        // 2. Check Quota
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException("User not found");

        const isAdmin = user.role === "ADMIN";

        if (!isAdmin && user.usedVideoCount >= user.monthlyVideoQuota) {
            throw new HttpException(
                {
                    error: "QUOTA_EXCEEDED",
                    message: `Bạn đã sử dụng hết ${user.usedVideoCount}/${user.monthlyVideoQuota} video trong tháng này.`,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // 3. Check concurrent slots
        const activeJobs = await this.prisma.production.count({
            where: {
                project: { userId },
                status: { in: ["QUEUED", "PROCESSING"] },
            },
        });

        if (!isAdmin && activeJobs >= user.maxConcurrentSlots) {
            throw new HttpException(
                {
                    error: "CONCURRENT_LIMIT",
                    message: `Đang chạy ${activeJobs}/${user.maxConcurrentSlots} slot. Vui lòng đợi 1 slot hoàn thành.`,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // 4. Create production + checkpoints in transaction
        const production = await this.prisma.$transaction(async (tx) => {
            // Deduct quota (skip for admin)
            if (!isAdmin) {
                await tx.user.update({
                    where: { id: userId },
                    data: { usedVideoCount: { increment: 1 } },
                });
            }

            // Create production
            const prod = await tx.production.create({
                data: {
                    projectId: data.projectId,
                    title: data.title,
                    inputScript: data.inputScript,
                    youtubeUrl: data.youtubeUrl,
                    language: data.language ?? "vi",
                    mediaGeneration: data.mediaGeneration ?? true,
                    status: "QUEUED",
                },
            });

            // Create pipeline checkpoints (always all 7 steps)
            const steps = PIPELINE_STEPS;

            await tx.pipelineCheckpoint.createMany({
                data: steps.map((step) => ({
                    productionId: prod.id,
                    stepNumber: step.number,
                    stepName: step.name,
                })),
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    action: "deduct_quota",
                    description: `Trừ 1 video cho Production '${data.title}'`,
                    metadata: { productionId: prod.id },
                },
            });

            return prod;
        });

        // 5. Add to BullMQ queue
        await this.pipelineQueue.add(
            "process-pipeline",
            {
                productionId: production.id,
                userId,
                mediaGeneration: data.mediaGeneration ?? true,
            },
            {
                removeOnComplete: true,
                removeOnFail: 100,
                attempts: 3,
                backoff: { type: "exponential", delay: 5000 },
            },
        );

        return {
            id: production.id,
            status: "QUEUED",
            message: "Job đã được đẩy vào hàng đợi xử lý.",
        };
    }

    /**
     * Retry a failed production — reset status + checkpoints, re-queue.
     * Does NOT deduct quota again.
     */
    async retryProduction(userId: string, productionId: string) {
        const production = await this.prisma.production.findUnique({
            where: { id: productionId },
            include: { project: true },
        });

        if (!production) throw new NotFoundException("Production not found");
        if (production.project.userId !== userId)
            throw new ForbiddenException();
        if (!["FAILED", "COMPLETED"].includes(production.status))
            throw new HttpException(
                { error: "NOT_RETRYABLE", message: "Chỉ có thể retry production đã hoàn thành hoặc bị lỗi." },
                HttpStatus.BAD_REQUEST,
            );

        // Reset production + recreate all 7 checkpoints
        await this.prisma.$transaction(async (tx) => {
            await tx.production.update({
                where: { id: productionId },
                data: { status: "QUEUED", currentStep: 0, outputData: {} },
            });

            // Delete old checkpoints (may only have 5 for old productions)
            await tx.pipelineCheckpoint.deleteMany({ where: { productionId } });

            // Create fresh checkpoints — all 7 steps
            await tx.pipelineCheckpoint.createMany({
                data: PIPELINE_STEPS.map((step) => ({
                    productionId,
                    stepNumber: step.number,
                    stepName: step.name,
                })),
            });
        });

        // Re-queue
        await this.pipelineQueue.add(
            "process-pipeline",
            {
                productionId,
                userId,
                mediaGeneration: production.mediaGeneration,
            },
            {
                removeOnComplete: true,
                removeOnFail: 100,
                attempts: 3,
                backoff: { type: "exponential", delay: 5000 },
            },
        );

        return { id: productionId, status: "QUEUED", message: "Đang thử lại..." };
    }

    /**
     * Retry a specific step — reset only that step and subsequent steps, re-queue.
     * Keeps outputData from earlier steps intact.
     * Does NOT deduct quota.
     */
    async retryStep(userId: string, productionId: string, stepNumber: number) {
        const production = await this.prisma.production.findUnique({
            where: { id: productionId },
            include: { project: true },
        });

        if (!production) throw new NotFoundException("Production not found");
        if (production.project.userId !== userId)
            throw new ForbiddenException();
        if (production.status === "PROCESSING")
            throw new HttpException(
                { error: "NOT_RETRYABLE", message: "Không thể retry step khi pipeline đang chạy." },
                HttpStatus.BAD_REQUEST,
            );

        // Reset the target step + all subsequent steps to PENDING
        await this.prisma.$transaction(async (tx) => {
            await tx.production.update({
                where: { id: productionId },
                data: { status: "QUEUED", currentStep: stepNumber - 1 },
            });

            // Reset this step and all steps after it
            await tx.pipelineCheckpoint.updateMany({
                where: {
                    productionId,
                    stepNumber: { gte: stepNumber },
                },
                data: { status: "PENDING", startedAt: null, completedAt: null, errorMessage: null },
            });
        });

        // Re-queue — processor will skip SUCCESS steps
        await this.pipelineQueue.add(
            "process-pipeline",
            {
                productionId,
                userId,
                mediaGeneration: production.mediaGeneration,
            },
            {
                removeOnComplete: true,
                removeOnFail: 100,
                attempts: 3,
                backoff: { type: "exponential", delay: 5000 },
            },
        );

        return {
            id: productionId,
            status: "QUEUED",
            message: `Đang thử lại step ${stepNumber}...`,
        };
    }
}
