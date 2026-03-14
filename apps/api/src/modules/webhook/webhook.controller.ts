import {
    Controller,
    Post,
    Body,
    HttpCode,
    Logger,
    Headers,
    UnauthorizedException,
    Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { createHmac, timingSafeEqual } from "crypto";

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
     * Verifies HMAC-SHA256 signature từ Polar: "sha256=<hex_digest>"
     */
    @Post("polar")
    @HttpCode(200)
    async handlePolar(
        @Req() req: any,
        @Headers("x-polar-signature") signature: string,
        @Body() body: { type: string; data: any },
    ) {
        // Verify Polar.sh HMAC-SHA256 signature
        const webhookSecret = this.configService.get<string>("POLAR_WEBHOOK_SECRET");
        if (webhookSecret) {
            if (!signature) {
                this.logger.warn("Polar webhook received without signature");
                throw new UnauthorizedException("Missing webhook signature");
            }

            const [algorithm, receivedHex] = signature.split("=");
            if (algorithm !== "sha256" || !receivedHex) {
                throw new UnauthorizedException("Invalid signature format");
            }

            // ⚡ Use raw body bytes if available (set by NestJS rawBody option)
            // Falls back to re-serialized JSON — less accurate but functional
            const rawPayload: string | Buffer =
                req.rawBody ?? JSON.stringify(body);

            const expectedHex = createHmac("sha256", webhookSecret)
                .update(rawPayload)
                .digest("hex");

            // Timing-safe comparison to prevent timing attacks
            const expectedBuf = Buffer.from(expectedHex, "hex");
            const receivedBuf = Buffer.from(receivedHex, "hex");

            if (
                expectedBuf.length !== receivedBuf.length ||
                !timingSafeEqual(expectedBuf, receivedBuf)
            ) {
                this.logger.warn(`Polar webhook signature mismatch`);
                throw new UnauthorizedException("Invalid webhook signature");
            }
        }

        this.logger.log(`Polar webhook: ${body.type}`);

        // Product ID → Tier mapping — matches .env POLAR_PRODUCT_ID_*
        const productIdToTier = (productId: string): { tier: string; videos: number; minutes: number; slots: number } => {
            const proId = process.env["POLAR_PRODUCT_ID_PRO"] || process.env["POLAR_PRODUCT_ID_PRO_SANDBOX"] || "";
            const bizId = process.env["POLAR_PRODUCT_ID_BUSINESS"] || process.env["POLAR_PRODUCT_ID_BUSINESS_SANDBOX"] || "";
            if (bizId && productId === bizId) return { tier: "BUSINESS", videos: 250, minutes: 5000, slots: 10 };
            if (proId && productId === proId) return { tier: "PRO", videos: 60, minutes: 600, slots: 3 };
            // Fallback by product name
            const name = (body.data.product?.name ?? "").toLowerCase();
            if (name.includes("business")) return { tier: "BUSINESS", videos: 250, minutes: 5000, slots: 10 };
            return { tier: "PRO", videos: 60, minutes: 600, slots: 3 };
        };

        switch (body.type) {
            case "subscription.created":
            case "subscription.updated": {
                // Polar event fields: data.id (sub ID), data.customer_id, data.customer.email, data.product.id
                const customerId: string = body.data.customer_id ?? body.data.customer?.id;
                const subscriptionId: string = body.data.id;
                const customerEmail: string = body.data.customer?.email ?? body.data.customer_email;
                const productId: string = body.data.product?.id ?? body.data.product_id ?? "";
                const tierConfig = productIdToTier(productId);

                this.logger.log(
                    `Polar sub: customer=${customerId} email=${customerEmail} product=${productId} → ${tierConfig.tier}`,
                );

                // 1st: lookup by polarCustomerId (returning customer)
                let user = await this.prisma.user.findFirst({
                    where: { polarCustomerId: customerId },
                    select: { id: true },
                });

                // 2nd: fallback by email (first purchase — polarCustomerId not yet set)
                if (!user && customerEmail) {
                    user = await this.prisma.user.findFirst({
                        where: { email: customerEmail },
                        select: { id: true },
                    });
                    if (user) {
                        this.logger.log(`Polar: Linked new customer ${customerId} to user by email ${customerEmail}`);
                    }
                }

                if (!user) {
                    this.logger.warn(`Polar: No user found for customer ${customerId} / email ${customerEmail}`);
                    break;
                }

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionTier: tierConfig.tier as any,
                        monthlyVideoQuota: tierConfig.videos,
                        monthlyMinuteQuota: tierConfig.minutes,
                        maxConcurrentSlots: tierConfig.slots,
                        subscriptionStatus: "active",
                        polarCustomerId: customerId,
                        polarSubscriptionId: subscriptionId,
                    },
                });
                this.logger.log(`Polar: ✅ User ${user.id} upgraded → ${tierConfig.tier}`);
                break;
            }
            case "subscription.canceled":
            case "subscription.revoked": {
                const customerId: string = body.data.customer_id ?? body.data.customer?.id;
                const customerEmail: string = body.data.customer?.email ?? body.data.customer_email;

                let user = await this.prisma.user.findFirst({
                    where: { polarCustomerId: customerId },
                    select: { id: true },
                });
                if (!user && customerEmail) {
                    user = await this.prisma.user.findFirst({
                        where: { email: customerEmail },
                        select: { id: true },
                    });
                }

                if (!user) {
                    this.logger.warn(`Polar: No user for cancel event customer ${customerId}`);
                    break;
                }

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionTier: "FREE",
                        monthlyVideoQuota: 1,
                        monthlyMinuteQuota: 5,
                        maxConcurrentSlots: 1,
                        subscriptionStatus: "canceled",
                    },
                });
                this.logger.log(`Polar: ✅ User ${user.id} downgraded → FREE`);
                break;
            }
            default:
                this.logger.log(`Polar webhook: unhandled event "${body.type}"`);
        }

        return { received: true };
    }
}
