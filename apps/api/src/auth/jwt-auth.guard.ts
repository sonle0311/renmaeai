import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * JwtAuthGuard — Verify JWT token từ NextAuth.js Frontend.
 *
 * NextAuth session database strategy tạo session token (không phải JWT),
 * nên chúng ta verify bằng cách gọi NextAuth session endpoint.
 * Trong tương lai có thể switch sang JWT strategy nếu cần.
 *
 * Hiện tại dùng approach đơn giản:
 * - Bearer token = session token
 * - Verify bằng cách query DB (hoặc call NextAuth API)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid authorization header");
        }

        const token = authHeader.split(" ")[1];

        try {
            // Verify token by calling NextAuth session endpoint
            const nextAuthUrl = this.configService.get<string>("NEXTAUTH_URL", "http://localhost:3000");
            const response = await fetch(`${nextAuthUrl}/api/auth/session`, {
                headers: {
                    // Auth.js v5 dùng "authjs.session-token", v4 dùng "next-auth.session-token"
                    cookie: `authjs.session-token=${token}; next-auth.session-token=${token}`,
                },
            });

            if (!response.ok) {
                throw new UnauthorizedException("Invalid session token");
            }

            const session = await response.json();

            if (!session?.user) {
                throw new UnauthorizedException("Invalid session");
            }

            // Attach user to request
            request.user = session.user;
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException("Authentication failed");
        }
    }
}
