import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Proxy — Forward requests tới NestJS backend với session token.
 *
 * Frontend gọi: /api/proxy/projects → Proxy → NestJS http://localhost:4000/api/v1/projects
 *
 * Vì NextAuth v5 dùng httpOnly cookie (JS không đọc được),
 * nên proxy này đọc session server-side rồi gửi Bearer token cho NestJS.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params;
    const targetPath = path.join("/");
    // Static files (uploads/) are served at root, not under /api/v1/
    const prefix = targetPath.startsWith("uploads/") ? "" : "/api/v1";
    const url = new URL(`${prefix}/${targetPath}`, API_BASE);

    // Forward query params
    req.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
    });

    // Get session token from cookies
    const sessionToken =
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value ||
        req.cookies.get("next-auth.session-token")?.value ||
        "";

    const headers: Record<string, string> = {
        Authorization: `Bearer ${sessionToken}`,
    };

    // Forward content-type for POST/PUT
    const contentType = req.headers.get("content-type");
    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    const fetchOptions: RequestInit = {
        method: req.method,
        headers,
    };

    // Forward body for non-GET requests
    if (req.method !== "GET" && req.method !== "HEAD") {
        fetchOptions.body = await req.text();
    }

    try {
        const response = await fetch(url.toString(), fetchOptions);
        const responseContentType = response.headers.get("Content-Type") || "application/json";

        // Binary content (audio, video, images) must use arrayBuffer, not text
        const isBinary = /^(audio|video|image|application\/octet)/.test(responseContentType);

        if (isBinary) {
            const buffer = await response.arrayBuffer();
            return new NextResponse(buffer, {
                status: response.status,
                headers: {
                    "Content-Type": responseContentType,
                    "Content-Length": buffer.byteLength.toString(),
                },
            });
        }

        const data = await response.text();
        return new NextResponse(data, {
            status: response.status,
            headers: { "Content-Type": responseContentType },
        });
    } catch {
        return NextResponse.json({ error: "API unavailable" }, { status: 502 });
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
