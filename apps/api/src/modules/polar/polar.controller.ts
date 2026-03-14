import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { PolarService } from "./polar.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ConfigService } from "@nestjs/config";

@Controller("api/v1")
@UseGuards(JwtAuthGuard)
export class PolarController {
    constructor(
        private polar: PolarService,
        private prisma: PrismaService,
        private config: ConfigService,
    ) {}

    /**
     * POST /api/v1/billing/checkout
     * Create a Polar checkout URL for upgrading to pro or business.
     */
    @Post("billing/checkout")
    async createCheckout(
        @Req() req: any,
        @Body() body: { tier: "pro" | "business" },
    ) {
        if (!["pro", "business"].includes(body.tier)) {
            throw new BadRequestException("Invalid tier. Must be 'pro' or 'business'");
        }

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: req.user.id },
            select: { email: true },
        });

        const appUrl = this.config.get("NEXTAUTH_URL", "http://localhost:3000");
        const successUrl = `${appUrl}/billing?checkout=success`;

        const { url } = await this.polar.createCheckoutLink(
            user.email,
            body.tier,
            successUrl,
        );

        return { url };
    }

    /**
     * GET /api/v1/billing/subscription
     * Get current user's active Polar subscription details.
     */
    @Get("billing/subscription")
    async getMySubscription(@Req() req: any) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: req.user.id },
            select: {
                subscriptionTier: true,
                subscriptionStatus: true,
                polarSubscriptionId: true,
                monthlyVideoQuota: true,
                monthlyMinuteQuota: true,
                usedVideoCount: true,
                usedMinuteCount: true,
                maxConcurrentSlots: true,
            },
        });

        // Enrich with live Polar data if subscription exists
        let polarDetails = null;
        if (user.polarSubscriptionId) {
            polarDetails = await this.polar.getSubscription(user.polarSubscriptionId);
        }

        return {
            tier: user.subscriptionTier,
            status: user.subscriptionStatus,
            quota: {
                videos: { used: user.usedVideoCount, limit: user.monthlyVideoQuota },
                minutes: { used: Math.round(user.usedMinuteCount), limit: user.monthlyMinuteQuota },
                concurrentSlots: user.maxConcurrentSlots,
            },
            polar: polarDetails,
        };
    }

    /**
     * DELETE /api/v1/billing/subscription
     * Cancel own active subscription.
     */
    @Delete("billing/subscription")
    async cancelMySubscription(@Req() req: any) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: req.user.id },
            select: { polarSubscriptionId: true, subscriptionTier: true },
        });

        if (!user.polarSubscriptionId || user.subscriptionTier === "FREE") {
            throw new NotFoundException("No active subscription found");
        }

        const ok = await this.polar.cancelSubscription(user.polarSubscriptionId);
        if (!ok) throw new BadRequestException("Failed to cancel subscription via Polar");

        // Downgrade to FREE immediately
        await this.prisma.user.update({
            where: { id: req.user.id },
            data: {
                subscriptionTier: "FREE",
                subscriptionStatus: "canceled",
                monthlyVideoQuota: 1,
                monthlyMinuteQuota: 5,
                maxConcurrentSlots: 1,
            },
        });

        return { canceled: true };
    }

    /**
     * POST /api/v1/billing/sync
     * Pull current subscription from Polar and update DB.
     * Use when payment succeeded but webhook was missed.
     */
    @Post("billing/sync")
    async syncMySubscription(@Req() req: any) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: req.user.id },
            select: { email: true, polarCustomerId: true },
        });

        // Try by customerId first, then fallback to email
        let result: Awaited<ReturnType<typeof this.polar.syncByCustomerId>> & { customerId?: string } | null = null;

        if (user.polarCustomerId) {
            result = await this.polar.syncByCustomerId(user.polarCustomerId);
        }

        // Fallback: search by email (first purchase — polarCustomerId not yet in DB)
        if (!result) {
            const byEmail = await this.polar.syncByEmail(user.email);
            if (byEmail) {
                result = byEmail;
            }
        }

        if (!result) {
            return {
                synced: false,
                message: "Không tìm thấy subscription active trên Polar. Vui lòng kiểm tra lại email hoặc thử Replay webhook từ Polar dashboard.",
            };
        }

        await this.prisma.user.update({
            where: { id: req.user.id },
            data: {
                subscriptionTier: result.tier as any,
                subscriptionStatus: result.status,
                monthlyVideoQuota: result.videos,
                monthlyMinuteQuota: result.minutes,
                maxConcurrentSlots: result.slots,
                polarSubscriptionId: result.subscriptionId,
                // Also persist customerId if we found it via email
                ...(result.customerId ? { polarCustomerId: result.customerId } : {}),
            },
        });

        return { synced: true, tier: result.tier, subscriptionId: result.subscriptionId };
    }




    /**
     * GET /api/v1/admin/subscriptions
     * List all Polar subscriptions (admin only).
     */
    @Get("admin/subscriptions")
    async adminListSubscriptions(
        @Req() req: any,
        @Query("page") page = "1",
        @Query("limit") limit = "50",
    ) {
        await this.requireAdmin(req.user.id);
        return this.polar.listSubscriptions(parseInt(page), parseInt(limit));
    }

    /**
     * DELETE /api/v1/admin/subscriptions/:id
     * Force cancel any subscription (admin only).
     */
    @Delete("admin/subscriptions/:id")
    async adminCancelSubscription(@Req() req: any, @Param("id") id: string) {
        await this.requireAdmin(req.user.id);
        const ok = await this.polar.cancelSubscription(id);
        if (!ok) throw new BadRequestException("Failed to cancel subscription");

        // Find user with this sub and downgrade
        await this.prisma.user.updateMany({
            where: { polarSubscriptionId: id },
            data: {
                subscriptionTier: "FREE",
                subscriptionStatus: "canceled",
                monthlyVideoQuota: 1,
                monthlyMinuteQuota: 5,
                maxConcurrentSlots: 1,
            },
        });

        return { canceled: true };
    }

    // ─── Helper ───────────────────────────────────────────────────

    private async requireAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (user?.role !== "ADMIN") {
            throw new ForbiddenException("Admin access required");
        }
    }
}
