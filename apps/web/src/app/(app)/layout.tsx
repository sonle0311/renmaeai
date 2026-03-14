import { Providers } from "@/components/providers/providers";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        return <Providers>{children}</Providers>;
    }

    return (
        <Providers>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="bottom-right" />
        </Providers>
    );
}
