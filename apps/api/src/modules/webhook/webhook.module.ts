import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
    imports: [RealtimeModule],
    controllers: [WebhookController],
})
export class WebhookModule { }
