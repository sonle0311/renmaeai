import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        credentials: true,
    },
})
export class RealtimeGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(RealtimeGateway.name);

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            client.join(`user:${userId}`);
            this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    emitToUser(userId: string, event: string, data: any): void {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
