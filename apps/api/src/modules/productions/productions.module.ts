import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ProductionsController } from "./productions.controller";
import { ProductionsService } from "./productions.service";
import { YoutubeExtractService } from "../pipeline/youtube-extract.service";

@Module({
    imports: [BullModule.registerQueue({ name: "pipeline" })],
    controllers: [ProductionsController],
    providers: [ProductionsService, YoutubeExtractService],
    exports: [ProductionsService],
})
export class ProductionsModule { }
