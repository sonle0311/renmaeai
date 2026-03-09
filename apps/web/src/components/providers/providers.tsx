"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "./socket-provider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SocketProvider>{children}</SocketProvider>
        </SessionProvider>
    );
}
