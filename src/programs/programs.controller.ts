import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import {
    CreateProgramDto,
    UpdateProgramDto,
    ProgramQueryDto,
    BulkProgramStatusDto,
    ReorderProgramsDto,
} from './dto/programs.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES, FULL_ADMIN_ROLES, EDITOR_ROLES } from '../common/decorators/roles.decorator';

@Controller('programs')
export class ProgramsController {
    constructor(private readonly programsService: ProgramsService) {}

    @Get('public')
    async getPublicPrograms(
        @Query('limit') limit?: string,
        @Query('category') category?: string,
    ) {
        return this.programsService.findPublic({
            limit: limit ? parseInt(limit, 10) : 50,
            category,
        });
    }

    @Get('slug/:slug')
    async getProgramBySlug(@Param('slug') slug: string) {
        return this.programsService.findBySlug(slug);
    }

    @Get('admin/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    async getStats() {
        return this.programsService.getStats();
    }

    @Get('admin')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    async getAdminPrograms(@Query() query: ProgramQueryDto) {
        return this.programsService.findAll(query);
    }

    @Get('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    async getAdminProgram(@Param('id') id: string) {
        const program = await this.programsService.findOne(parseInt(id, 10));
        return this.programsService.transformProgram(program);
    }

    @Post('admin')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    async createProgram(@Body() dto: CreateProgramDto) {
        const program = await this.programsService.create(dto);
        return this.programsService.transformProgram(program);
    }

    @Patch('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
        const program = await this.programsService.update(parseInt(id, 10), dto);
        return this.programsService.transformProgram(program);
    }

    @Delete('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    async deleteProgram(@Param('id') id: string) {
        await this.programsService.remove(parseInt(id, 10));
        return { deleted: true };
    }

    @Post('admin/bulk-status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    async bulkStatus(@Body() dto: BulkProgramStatusDto) {
        return this.programsService.bulkStatus(dto);
    }

    @Post('admin/reorder')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    async reorder(@Body() dto: ReorderProgramsDto) {
        return this.programsService.reorder(dto);
    }

    @Get(':slug')
    async getProgramSlug(@Param('slug') slug: string) {
        return this.programsService.findBySlug(slug);
    }
}