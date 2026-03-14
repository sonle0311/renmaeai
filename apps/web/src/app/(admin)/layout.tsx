import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin route group layout.
 * - Centralized ADMIN role guard (no per-page checks needed)
 * - Dedicated AdminShell (separate from user AppShell)
 * - All /admin/* routes are protected here
 */
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, name: true, email: true, image: true },
    });

    if (dbUser?.role !== "ADMIN") redirect("/dashboard");

    return (
        <Providers>
            <AdminShell admin={{ name: dbUser.name, email: dbUser.email, image: dbUser.image }}>
                {children}
            </AdminShell>
            <Toaster richColors position="bottom-right" />
        </Providers>
    );
}
