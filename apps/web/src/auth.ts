import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "database",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Extend session with custom fields
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        role: true,
                        subscriptionTier: true,
                        usedVideoCount: true,
                        monthlyVideoQuota: true,
                        usedMinuteCount: true,
                        monthlyMinuteQuota: true,
                        maxConcurrentSlots: true,
                    },
                });
                if (dbUser) {
                    const user = session.user as unknown as Record<string, unknown>;
                    user.role = dbUser.role;
                    user.subscriptionTier = dbUser.subscriptionTier;
                    user.quota = {
                        video: {
                            used: dbUser.usedVideoCount,
                            limit: dbUser.monthlyVideoQuota,
                        },
                        minutes: {
                            used: dbUser.usedMinuteCount,
                            limit: dbUser.monthlyMinuteQuota,
                        },
                    };
                    user.maxConcurrentSlots = dbUser.maxConcurrentSlots;
                }
            }
            return session;
        },
    },
});
