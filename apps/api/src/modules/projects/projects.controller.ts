import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    HttpCode,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";

@Controller("api/v1/projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    async findAll(@Req() req: any) {
        return this.projectsService.findAllByUser(req.user.id);
    }

    @Post()
    @HttpCode(201)
    async create(
        @Req() req: any,
        @Body() body: { name: string; description?: string; globalSettings?: any },
    ) {
        return this.projectsService.create(req.user.id, body);
    }

    @Put(":id")
    async update(
        @Req() req: any,
        @Param("id") id: string,
        @Body() body: { name?: string; description?: string; globalSettings?: any },
    ) {
        return this.projectsService.update(req.user.id, id, body);
    }

    @Patch(":id")
    async partialUpdate(
        @Req() req: any,
        @Param("id") id: string,
        @Body() body: { name?: string; description?: string; globalSettings?: any },
    ) {
        return this.projectsService.update(req.user.id, id, body);
    }

    @Delete(":id")
    @HttpCode(204)
    async remove(@Req() req: any, @Param("id") id: string) {
        return this.projectsService.remove(req.user.id, id);
    }
}
