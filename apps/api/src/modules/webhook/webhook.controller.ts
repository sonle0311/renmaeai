import {
    Controller,
    Post,
    Body,
    HttpCode,
    Logger,
    Headers,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Controller("api/v1/webhooks")
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private realtimeGateway: RealtimeGateway,
    ) { }

    /**
     * Webhook nhận kết quả từ G-Labs API
     */
    @Post("glabs")
    @HttpCode(200)
    async handleGlabs(
        @Headers("x-webhook-secret") secret: string,
        @Body()
        body: {
            job_id: string;
            production_id: string;
            step_number: number;
            status: string;
            output?: { media_url?: string; duration_seconds?: number };
        },
    ) {
        // Verify webhook secret
        const expectedSecret = this.configService.get<string>(
            "GLABS_WEBHOOK_SECRET",
        );
        if (expectedSecret && secret !== expectedSecret) {
            throw new UnauthorizedException("Invalid webhook secret");
        }

        this.logger.log(
            `G-Labs webhook: production=${body.production_id}, step=${body.step_number}, status=${body.status}`,
        );

        // Update checkpoint
        const checkpoint = await this.prisma.pipelineCheckpoint.findUnique({
            where: {
                productionId_stepNumber: {
                    productionId: body.production_id,
                    stepNumber: body.step_number,
                },
            },
        });

        if (!checkpoint) {
            this.logger.warn(
                `Checkpoint not found: ${body.production_id}:${body.step_number}`,
            );
            return { received: true };
        }

        if (body.status === "success") {
            await this.prisma.pipelineCheckpoint.update({
                where: { id: checkpoint.id },
                data: {
                    status: "SUCCESS",
                    outputData: body.output ?? {},
                    completedAt: new Date(),
                },
            });

            // Get production to find userId
            const production = await this.prisma.production.findUnique({
                where: { id: body.production_id },
                include: { project: { select: { userId: true } } },
            });

            if (production) {
                const userId = production.project.userId;

                // Emit realtime event
                this.realtimeGateway.emitToUser(userId, "pipeline:step:completed", {
                    productionId: body.production_id,
                    stepNumber: body.step_number,
                    outputData: body.output,
                });

                // Update estimated minutes if duration provided
                if (body.output?.duration_seconds) {
                    const minutes = body.output.duration_seconds / 60;
                    await this.prisma.production.update({
                        where: { id: body.production_id },
                        data: { estimatedMinutes: { increment: minutes } },
                    });
                }

                // Check if all steps done → mark completed
                const pending = await this.prisma.pipelineCheckpoint.count({
                    where: {
                        productionId: body.production_id,
                        status: { in: ["PENDING", "PROCESSING"] },
                    },
                });

                if (pending === 0) {
                    await this.prisma.production.update({
                        where: { id: body.production_id },
                        data: { status: "COMPLETED" },
                    });

                    // Deduct minutes from user quota
                    if (production.estimatedMinutes) {
                        await this.prisma.user.update({
                            where: { id: userId },
                            data: {
                                usedMinuteCount: {
                                    increment: production.estimatedMinutes,
                                },
                            },
                        });
                    }

                    this.realtimeGateway.emitToUser(userId, "pipeline:completed", {
                        productionId: body.production_id,
                    });
                    this.realtimeGateway.emitToUser(userId, "quota:updated", {
                        productionId: body.production_id,
                    });
                }
            }
        } else {
            // Handle failure
            await this.prisma.pipelineCheckpoint.update({
                where: { id: checkpoint.id },
                data: {
                    status: "ERROR",
                    errorMessage: `G-Labs returned error for step ${body.step_number}`,
                    completedAt: new Date(),
                },
            });

            await this.prisma.production.update({
                where: { id: body.production_id },
                data: {
                    status: "FAILED",
                    errorMessage: `Step ${body.step_number} failed`,
                },
            });
        }

        return { received: true };
    }

    /**
     * Webhook nhận Subscription events từ Polar.sh
     */
    @Post("polar")
    @HttpCode(200)
    async handlePolar(
        @Headers("x-polar-signature") signature: string,
        @Body() body: { type: string; data: any },
    ) {
        // TODO: Verify Polar.sh signature
        this.logger.log(`Polar webhook: ${body.type}`);

        const TIER_MAP: Record<string, { tier: string; videos: number; minutes: number; slots: number }> = {
            pro: { tier: "PRO", videos: 60, minutes: 600, slots: 3 },
            business: { tier: "BUSINESS", videos: 250, minutes: 5000, slots: 10 },
        };

        switch (body.type) {
            case "subscription.created":
            case "subscription.updated": {
                const customerId = body.data.customer_id;
                const planId = body.data.plan_id?.toLowerCase() ?? "pro";
                const config = TIER_MAP[planId] ?? TIER_MAP.pro;

                await this.prisma.user.updateMany({
                    where: { polarCustomerId: customerId },
                    data: {
                        subscriptionTier: config.tier as any,
                        monthlyVideoQuota: config.videos,
                        monthlyMinuteQuota: config.minutes,
                        maxConcurrentSlots: config.slots,
                        subscriptionStatus: "active",
                        polarSubscriptionId: body.data.subscription_id,
                    },
                });
                break;
            }
            case "subscription.canceled": {
                const customerId = body.data.customer_id;
                await this.prisma.user.updateMany({
                    where: { polarCustomerId: customerId },
                    data: {
                        subscriptionTier: "FREE",
                        monthlyVideoQuota: 1,
                        monthlyMinuteQuota: 5,
                        maxConcurrentSlots: 1,
                        subscriptionStatus: "canceled",
                    },
                });
                break;
            }
        }

        return { received: true };
    }
}
