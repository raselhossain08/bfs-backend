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
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateCommentDto,
  UpdateCommentDto,
  ReplyCommentDto,
  BulkCommentStatusDto,
  CommentQueryDto,
} from './dto/comment.dto';

/**
 * Comments Controller
 * Handles article comments and moderation
 * Base path: /api/comments
 */
@Controller('comments')
export class CommentsController {
  private readonly logger = new Logger(CommentsController.name);

  constructor(private readonly commentsService: CommentsService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Submit a comment (public)
   * POST /api/comments
   */
  @Post()
  async createComment(@Body() dto: CreateCommentDto) {
    const comment = await this.commentsService.create(dto);
    return {
      success: true,
      message: 'Comment submitted for review',
      data: comment,
    };
  }

  /**
   * Get approved comments for an article (public)
   * GET /api/comments/article/:slug
   */
  @Get('article/:slug')
  async getCommentsByArticle(@Param('slug') slug: string) {
    const comments = await this.commentsService.findByArticleSlug(slug);
    return { data: comments };
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all comments (admin)
   * GET /api/comments/admin
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminComments(@Query() query: CommentQueryDto) {
    return this.commentsService.findAll(query);
  }

  /**
   * Get comment stats (admin)
   * GET /api/comments/admin/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getStats() {
    const stats = await this.commentsService.getStats();
    return { data: stats };
  }

  /**
   * Export comments (admin)
   * GET /api/comments/admin/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/export')
  async exportComments(
    @Query('format') format: 'csv' | 'json',
    @Query() query: CommentQueryDto,
  ) {
    return this.commentsService.export(format || 'csv', query);
  }

  /**
   * Get single comment (admin)
   * GET /api/comments/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getComment(@Param('id') id: string) {
    const comment = await this.commentsService.findById(parseInt(id, 10));
    return { data: comment };
  }

  /**
   * Update comment (admin)
   * PATCH /api/comments/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updateComment(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    const comment = await this.commentsService.update(parseInt(id, 10), dto);
    return { success: true, data: comment };
  }

  /**
   * Reply to comment (admin)
   * POST /api/comments/admin/:id/reply
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/:id/reply')
  async replyToComment(@Param('id') id: string, @Body() dto: ReplyCommentDto) {
    const comment = await this.commentsService.reply(parseInt(id, 10), dto);
    return { success: true, data: comment };
  }

  /**
   * Delete comment (admin)
   * DELETE /api/comments/admin/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Delete('admin/:id')
  async deleteComment(@Param('id') id: string) {
    await this.commentsService.delete(parseInt(id, 10));
    return { success: true, message: 'Comment deleted' };
  }

  /**
   * Bulk status update (admin)
   * POST /api/comments/admin/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkCommentStatusDto) {
    const result = await this.commentsService.bulkUpdateStatus(dto);
    return {
      success: true,
      message: `${result.count} comments updated`,
      count: result.count,
    };
  }

  /**
   * Bulk delete (admin)
   * POST /api/comments/admin/bulk-delete
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post('admin/bulk-delete')
  async bulkDelete(@Body() body: { ids: number[] }) {
    const result = await this.commentsService.bulkDelete(body.ids);
    return {
      success: true,
      message: `${result.count} comments deleted`,
      count: result.count,
    };
  }
}
