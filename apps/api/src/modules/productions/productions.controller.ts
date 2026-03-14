import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
    Delete,
} from "@nestjs/common";
import { ProductionsService } from "./productions.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";

@Controller("api/v1")
@UseGuards(JwtAuthGuard)
export class ProductionsController {
    constructor(private readonly productionsService: ProductionsService) { }

    @Get("projects/:projectId/productions")
    async findAll(@Req() req: any, @Param("projectId") projectId: string) {
        return this.productionsService.findAllByProject(req.user.id, projectId);
    }

    @Get("productions/:id")
    async findOne(@Req() req: any, @Param("id") id: string) {
        return this.productionsService.findOneWithCheckpoints(req.user.id, id);
    }

    @Post("productions")
    @HttpCode(HttpStatus.ACCEPTED)
    async create(
        @Req() req: any,
        @Body()
        body: {
            projectId: string;
            title: string;
            inputScript?: string;
            youtubeUrl?: string;
            language?: string;
            mediaGeneration?: boolean;
        },
    ) {
        return this.productionsService.createAndEnqueue(req.user.id, body);
    }

    @Post("productions/:id/retry")
    @HttpCode(HttpStatus.ACCEPTED)
    async retry(@Req() req: any, @Param("id") id: string) {
        return this.productionsService.retryProduction(req.user.id, id);
    }

    @Post("productions/:id/retry-step/:stepNumber")
    @HttpCode(HttpStatus.ACCEPTED)
    async retryStep(
        @Req() req: any,
        @Param("id") id: string,
        @Param("stepNumber") stepNumber: string,
    ) {
        return this.productionsService.retryStep(req.user.id, id, parseInt(stepNumber, 10));
    }

    @Delete("productions/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Req() req: any, @Param("id") id: string) {
        await this.productionsService.removeProduction(req.user.id, id);
    }
}
