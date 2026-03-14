import { Module } from "@nestjs/common";
import { PolarService } from "./polar.service";
import { PolarController } from "./polar.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [PolarController],
    providers: [PolarService],
    exports: [PolarService],
})
export class PolarModule {}
