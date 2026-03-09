import { Providers } from "@/components/providers/providers";
import { Sidebar } from "@/components/layout/sidebar";
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
            <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
            <Toaster richColors position="bottom-right" />
        </Providers>
    );
}
