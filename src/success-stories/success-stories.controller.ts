import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuccessStoriesService } from './success-stories.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateSuccessStoryDto,
  UpdateSuccessStoryDto,
  SuccessStoryQueryDto,
  BulkSuccessStoryStatusDto,
  ReorderSuccessStoriesDto,
  BulkCreateSuccessStoriesDto,
} from './dto/success-story.dto';

/**
 * Success Stories Controller
 * Handles success stories management
 * Base path: /api/success-stories
 */
@Controller('success-stories')
export class SuccessStoriesController {
  private readonly logger = new Logger(SuccessStoriesController.name);

  constructor(private readonly successStoriesService: SuccessStoriesService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Get all published success stories (public)
   * GET /api/success-stories
   */
  @Get()
  async getPublicSuccessStories() {
    const stories = await this.successStoriesService.findPublic();
    return { data: stories };
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all success stories (admin)
   * GET /api/success-stories/admin
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminSuccessStories(@Query() query: SuccessStoryQueryDto) {
    return this.successStoriesService.findAll(query);
  }

  /**
   * Get success story stats (admin)
   * GET /api/success-stories/admin/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getStats() {
    const stats = await this.successStoriesService.getStats();
    return { data: stats };
  }

  /**
   * Get categories (admin)
   * GET /api/success-stories/admin/categories
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/categories')
  async getCategories() {
    const categories = await this.successStoriesService.getCategories();
    return { data: categories };
  }

  /**
   * Get single success story (admin)
   * GET /api/success-stories/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getSuccessStory(@Param('id') id: string) {
    const story = await this.successStoriesService.findById(parseInt(id, 10));
    return { data: story };
  }

  /**
   * Create success story (admin)
   * POST /api/success-stories/admin
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin')
  async createSuccessStory(@Body() dto: CreateSuccessStoryDto) {
    const story = await this.successStoriesService.create(dto);
    return { success: true, data: story };
  }

  /**
   * Update success story (admin)
   * PATCH /api/success-stories/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updateSuccessStory(
    @Param('id') id: string,
    @Body() dto: UpdateSuccessStoryDto,
  ) {
    const story = await this.successStoriesService.update(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: story };
  }

  /**
   * Delete success story (admin)
   * DELETE /api/success-stories/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Delete('admin/:id')
  async deleteSuccessStory(@Param('id') id: string) {
    await this.successStoriesService.delete(parseInt(id, 10));
    return { success: true, message: 'Success story deleted' };
  }

  /**
   * Bulk create success stories (admin)
   * POST /api/success-stories/admin/bulk
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/bulk')
  async bulkCreateSuccessStories(@Body() dto: BulkCreateSuccessStoriesDto) {
    const result = await this.successStoriesService.bulkCreate(dto);
    return {
      success: true,
      count: result.count,
      failed: result.failed || 0,
      errors: result.errors || [],
    };
  }

  /**
   * Bulk status update (admin)
   * POST /api/success-stories/admin/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkSuccessStoryStatusDto) {
    const result = await this.successStoriesService.bulkUpdateStatus(dto);
    return {
      success: true,
      message: `${result.count} stories updated`,
      count: result.count,
    };
  }

  /**
   * Bulk delete (admin)
   * POST /api/success-stories/admin/bulk-delete
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post('admin/bulk-delete')
  async bulkDelete(@Body() body: { ids: number[] }) {
    const result = await this.successStoriesService.bulkDelete(body.ids);
    return {
      success: true,
      message: `${result.count} stories deleted`,
      count: result.count,
    };
  }

  /**
   * Reorder stories (admin)
   * POST /api/success-stories/admin/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/reorder')
  async reorder(@Body() dto: ReorderSuccessStoriesDto) {
    const result = await this.successStoriesService.reorder(dto);
    return {
      success: true,
      message: `${result.count} stories reordered`,
      count: result.count,
    };
  }

  // ============ PUBLIC ENDPOINTS - SLUG ROUTE ============
  // IMPORTANT: Must come after all admin routes, otherwise "admin" is matched as a slug.

  /**
   * Get single success story by slug (public)
   * GET /api/success-stories/:slug
   */
  @Get(':slug')
  async getSuccessStoryBySlug(@Param('slug') slug: string) {
    const story = await this.successStoriesService.findBySlug(slug);
    await this.successStoriesService.incrementViews(story.id);
    return { data: story };
  }
}
