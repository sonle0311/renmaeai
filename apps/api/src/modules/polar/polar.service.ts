import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Polar base URLs — sandbox for testing, production for live
const POLAR_URLS = {
    production: "https://api.polar.sh/v1",
    sandbox: "https://sandbox-api.polar.sh/v1",
};

export interface PolarSubscription {
    id: string;
    status: string;
    current_period_end: string | null;
    product_id: string;
    customer_id: string;
    customer_email: string;
    cancel_at_period_end: boolean;
}

export interface PolarCheckoutLink {
    url: string;
    isSandbox: boolean;
}

@Injectable()
export class PolarService {
    private readonly logger = new Logger(PolarService.name);
    private readonly accessToken: string | undefined;
    private readonly isSandbox: boolean;
    private readonly baseUrl: string;

    /**
     * Product IDs on Polar.sh — must match what you create in the dashboard.
     * Sandbox and production each have separate product IDs.
     * POLAR_SANDBOX=true  → use POLAR_PRODUCT_ID_PRO_SANDBOX etc.
     * POLAR_SANDBOX=false → use POLAR_PRODUCT_ID_PRO etc.
     */
    private readonly productIds: Record<string, string>;

    constructor(private config: ConfigService) {
        // Read env with process.env fallback (monorepo dotenv load-order issue)
        const get = (key: string) =>
            this.stripQuotes(config.get<string>(key) || process.env[key] || "");

        const sandboxRaw = get("POLAR_SANDBOX");
        this.isSandbox = sandboxRaw === "true" || sandboxRaw === "1";
        this.baseUrl = this.isSandbox ? POLAR_URLS.sandbox : POLAR_URLS.production;

        this.accessToken = get("POLAR_ACCESS_TOKEN") || undefined;

        if (this.isSandbox) {
            this.productIds = {
                pro: get("POLAR_PRODUCT_ID_PRO_SANDBOX"),
                business: get("POLAR_PRODUCT_ID_BUSINESS_SANDBOX"),
            };
        } else {
            this.productIds = {
                pro: get("POLAR_PRODUCT_ID_PRO"),
                business: get("POLAR_PRODUCT_ID_BUSINESS"),
            };
        }

        this.logger.log(
            `Polar initialized — mode: ${this.isSandbox ? "SANDBOX 🧪" : "PRODUCTION 🚀"} | url: ${this.baseUrl}`,
        );
        // DEBUG: show raw env values to diagnose load-order issues
        this.logger.debug(`[ENV] POLAR_SANDBOX raw = "${process.env["POLAR_SANDBOX"]}" | ConfigService = "${this.config.get("POLAR_SANDBOX")}"`);
        this.logger.debug(`[ENV] TOKEN prefix = "${this.accessToken?.substring(0, 20)}..." | SANDBOX_FLAG = ${this.isSandbox}`);
    }

    /** Strip leading/trailing double quotes from env values (defensive dotenv fix) */
    private stripQuotes(value: string): string {
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        return value;
    }

    private get headers(): Record<string, string> {
        return {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
        };
    }

    private isConfigured(): boolean {
        return Boolean(this.accessToken);
    }

    /** Create a hosted checkout session for a given tier */
    async createCheckoutLink(
        email: string,
        tier: "pro" | "business",
        successUrl: string,
    ): Promise<PolarCheckoutLink> {
        if (!this.isConfigured()) throw new Error("POLAR_ACCESS_TOKEN not configured");

        const productId = this.productIds[tier];
        if (!productId) throw new Error(`POLAR_PRODUCT_ID_${tier.toUpperCase()}${this.isSandbox ? "_SANDBOX" : ""} not configured`);

        const res = await fetch(`${this.baseUrl}/checkouts`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                product_id: productId,
                customer_email: email,
                success_url: successUrl,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Polar checkout error [${this.isSandbox ? "sandbox" : "prod"}]: ${err}`);
        }

        const data = await res.json() as { url: string };
        return { url: data.url, isSandbox: this.isSandbox };
    }

    /** Get a single subscription by ID */
    async getSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
        if (!this.isConfigured()) return null;

        const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
            headers: this.headers,
        });

        if (!res.ok) return null;
        return res.json() as Promise<PolarSubscription>;
    }

    /** Cancel a subscription immediately */
    async cancelSubscription(subscriptionId: string): Promise<boolean> {
        if (!this.isConfigured()) throw new Error("POLAR_ACCESS_TOKEN not configured");

        const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
            method: "DELETE",
            headers: this.headers,
        });

        if (!res.ok) {
            const err = await res.text();
            this.logger.error(`Cancel subscription failed: ${err}`);
            return false;
        }
        return true;
    }

    /** List all subscriptions (for admin) */
    async listSubscriptions(page = 1, limit = 50): Promise<{
        items: PolarSubscription[];
        total: number;
        isSandbox: boolean;
    }> {
        if (!this.isConfigured()) return { items: [], total: 0, isSandbox: this.isSandbox };

        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sorting: "-created_at",
        });

        const res = await fetch(`${this.baseUrl}/subscriptions?${params}`, {
            headers: this.headers,
        });

        if (!res.ok) return { items: [], total: 0, isSandbox: this.isSandbox };

        const data = await res.json() as { items: PolarSubscription[]; pagination: { total_count: number } };
        return {
            items: data.items ?? [],
            total: data.pagination?.total_count ?? 0,
            isSandbox: this.isSandbox,
        };
    }

    /**
     * Sync user's subscription from Polar — used when webhook was missed.
     * Queries all active subscriptions for the given customerId.
     * Returns the resolved tier config or null if no active sub found.
     */
    async syncByCustomerId(customerId: string): Promise<{
        tier: string;
        videos: number;
        minutes: number;
        slots: number;
        subscriptionId: string;
        status: string;
    } | null> {
        if (!this.isConfigured()) return null;

        const params = new URLSearchParams({
            customer_id: customerId,
            active: "true",
            limit: "10",
        });

        const res = await fetch(`${this.baseUrl}/subscriptions?${params}`, {
            headers: this.headers,
        });

        if (!res.ok) {
            this.logger.error(`syncByCustomerId failed: ${await res.text()}`);
            return null;
        }

        const data = await res.json() as { items: Array<{ id: string; status: string; product?: { id: string; name: string } }> };
        const activeSub = data.items?.find(s => s.status === "active");
        if (!activeSub) return null;

        const productId = activeSub.product?.id ?? "";
        const productName = (activeSub.product?.name ?? "").toLowerCase();
        const proId = process.env["POLAR_PRODUCT_ID_PRO"] || process.env["POLAR_PRODUCT_ID_PRO_SANDBOX"] || "";
        const bizId = process.env["POLAR_PRODUCT_ID_BUSINESS"] || process.env["POLAR_PRODUCT_ID_BUSINESS_SANDBOX"] || "";

        const isBusiness = (bizId && productId === bizId) || productName.includes("business");
        const tier = isBusiness
            ? { tier: "BUSINESS", videos: 250, minutes: 5000, slots: 10 }
            : { tier: "PRO", videos: 60, minutes: 600, slots: 3 };

        return { ...tier, subscriptionId: activeSub.id, status: activeSub.status };
    }

    /**
     * Search active subscription by customer EMAIL — fallback when polarCustomerId is not yet set.
     * Returns subscription data including the Polar customer ID so we can persist it.
     */
    async syncByEmail(email: string): Promise<{
        tier: string;
        videos: number;
        minutes: number;
        slots: number;
        subscriptionId: string;
        customerId: string;
        status: string;
    } | null> {
        if (!this.isConfigured()) return null;

        const params = new URLSearchParams({
            customer_email: email,
            limit: "10",
        });

        const res = await fetch(`${this.baseUrl}/subscriptions?${params}`, {
            headers: this.headers,
        });

        if (!res.ok) {
            this.logger.error(`syncByEmail failed: ${await res.text()}`);
            return null;
        }

        const data = await res.json() as {
            items: Array<{
                id: string;
                status: string;
                customer_id: string;
                product?: { id: string; name: string };
            }>;
        };

        const activeSub = data.items?.find(s => s.status === "active");
        if (!activeSub) return null;

        const productId = activeSub.product?.id ?? "";
        const productName = (activeSub.product?.name ?? "").toLowerCase();
        const proId = process.env["POLAR_PRODUCT_ID_PRO"] || process.env["POLAR_PRODUCT_ID_PRO_SANDBOX"] || "";
        const bizId = process.env["POLAR_PRODUCT_ID_BUSINESS"] || process.env["POLAR_PRODUCT_ID_BUSINESS_SANDBOX"] || "";

        const isBusiness = (bizId && productId === bizId) || productName.includes("business");
        const tier = isBusiness
            ? { tier: "BUSINESS", videos: 250, minutes: 5000, slots: 10 }
            : { tier: "PRO", videos: 60, minutes: 600, slots: 3 };

        return {
            ...tier,
            subscriptionId: activeSub.id,
            customerId: activeSub.customer_id,
            status: activeSub.status,
        };
    }
}

