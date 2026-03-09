"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!session?.user?.id) return;

        const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
            query: { userId: session.user.id },
            transports: ["websocket"],
        });

        s.on("connect", () => {
            console.log("[Socket.IO] Connected:", s.id);
        });

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [session?.user?.id]);

    return (
        <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
    );
}
