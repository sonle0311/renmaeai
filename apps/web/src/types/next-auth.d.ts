import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "USER" | "ADMIN";
            subscriptionTier: string;
            quota: {
                video: { used: number; limit: number };
                minutes: { used: number; limit: number };
            };
            maxConcurrentSlots: number;
        } & DefaultSession["user"];
    }
}
