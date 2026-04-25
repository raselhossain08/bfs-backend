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
  CreateProgramCategoryDto,
  UpdateProgramCategoryDto,
  ProgramCategoryQueryDto,
  ReorderProgramCategoriesDto,
  UpdateProgramsSectionDto,
} from './dto/programs.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // ============ ADMIN ENDPOINTS - MUST BE FIRST ============
  // These specific routes must come BEFORE the parameterized routes

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getStats() {
    const stats = await this.programsService.getStats();
    return { data: stats };
  }

  @Get('admin/categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getAdminCategories(@Query() query: ProgramCategoryQueryDto) {
    return this.programsService.findAllCategories(query);
  }

  @Get('admin/section-config')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getAdminSectionConfig() {
    return this.programsService.getSectionConfig();
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getAdminProgram(@Param('id') id: string) {
    const program = await this.programsService.findOne(parseInt(id, 10));
    const transformed = await this.programsService.transformProgram(program);
    return { data: transformed };
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getAdminPrograms(@Query() query: ProgramQueryDto) {
    return this.programsService.findAll(query);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async createProgram(@Body() dto: CreateProgramDto) {
    const program = await this.programsService.create(dto);
    const transformed = await this.programsService.transformProgram(program);
    return { data: transformed };
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    const program = await this.programsService.update(parseInt(id, 10), dto);
    const transformed = await this.programsService.transformProgram(program);
    return { data: transformed };
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  async deleteProgram(@Param('id') id: string) {
    await this.programsService.remove(parseInt(id, 10));
    return { success: true, message: 'Program deleted' };
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

  @Post('admin/categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async createCategory(@Body() dto: CreateProgramCategoryDto) {
    const category = await this.programsService.createCategory(dto);
    return { data: category };
  }

  @Patch('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateProgramCategoryDto) {
    const category = await this.programsService.updateCategory(parseInt(id, 10), dto);
    return { data: category };
  }

  @Delete('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  async deleteCategory(@Param('id') id: string) {
    await this.programsService.removeCategory(parseInt(id, 10));
    return { success: true, message: 'Category deleted' };
  }

  @Post('admin/categories/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async reorderCategories(@Body() dto: ReorderProgramCategoriesDto) {
    return this.programsService.reorderCategories(dto);
  }

  @Patch('admin/section-config')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  async updateSectionConfig(@Body() dto: UpdateProgramsSectionDto) {
    const config = this.programsService.updateSectionConfig(dto);
    return { data: config };
  }

  // ============ PUBLIC ENDPOINTS - MUST BE AFTER ADMIN ROUTES ============

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

  @Get('categories')
  async getPublicCategories() {
    const categories = await this.programsService.findActiveCategories();
    return { data: categories };
  }

  @Get('section-config')
  async getSectionConfig() {
    return this.programsService.getSectionConfig();
  }

  // ============ SLUG ROUTES - MUST BE LAST ============
  // These catch-all routes must come last to avoid conflicts

  @Get('slug/:slug')
  async getProgramBySlug(@Param('slug') slug: string) {
    const program = await this.programsService.findBySlug(slug);
    return { data: program };
  }

  @Get(':slug')
  async getProgramSlug(@Param('slug') slug: string) {
    const program = await this.programsService.findBySlug(slug);
    return { data: program };
  }
}
