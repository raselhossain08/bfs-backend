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
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ArticlesService } from './articles.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  BulkArticleStatusDto,
  PublicArticleQueryDto,
  BulkImportArticlesDto,
  BulkArticleDto,
} from './articles.dto';

/**
 * Articles Controller
 * Handles blog articles
 * Base path: /api/articles
 */
@Controller('articles')
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);

  constructor(private readonly articlesService: ArticlesService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get()
  async getPublicArticles(@Query() query: PublicArticleQueryDto) {
    return this.articlesService.findPublic(query);
  }

  // Dedicated public endpoint to avoid slug conflict
  @Get('public')
  async getPublicArticlesList(@Query() query: PublicArticleQueryDto) {
    return this.articlesService.findPublic(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminArticles(@Query() query: ArticleQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get('categories/:id/articles')
  async getArticlesByCategory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.articlesService.getArticlesByCategory(
      parseInt(id, 10),
      limit ? parseInt(limit, 10) : undefined,
    );
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('stats')
  async getArticleStats() {
    const stats = await this.articlesService.getStats();
    return { data: stats };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('export')
  async exportArticles(
    @Query('format') format: 'csv' | 'json',
    @Query() query: ArticleQueryDto,
    @Res() res: Response,
  ) {
    const result = this.articlesService.export(format || 'csv', query);

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="articles-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  // Admin endpoint to get article by ID (must be before :slug route)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getArticleById(@Param('id') id: string) {
    const article = await this.articlesService.findOne(parseInt(id, 10));
    return { data: article };
  }

  @Get(':slug')
  async getArticleBySlug(@Param('slug') slug: string) {
    // Check if it's a numeric ID
    if (/^\d+$/.test(slug)) {
      const article = await this.articlesService.findOne(parseInt(slug, 10));
      return { data: article };
    }
    // Otherwise treat as slug
    const article = await this.articlesService.findBySlug(slug);
    return { data: article };
  }

  // ============ MUTATIONS ============

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post()
  async createArticle(@Body() dto: CreateArticleDto) {
    const article = await this.articlesService.create(dto);
    return { success: true, data: article };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin')
  async createArticleAdmin(@Body() dto: CreateArticleDto) {
    const article = await this.articlesService.create(dto);
    return { success: true, data: article };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/bulk-import')
  async bulkImportArticles(@Body() body: { data: any[] } | any[]) {
    const items = Array.isArray(body) ? body : body.data || [];
    const results: { success: boolean; title: string; id: number }[] = [];
    const errors: { title: string; error: string }[] = [];

    for (const item of items) {
      if (!item.title) {
        errors.push({
          title: item.title || 'Unknown',
          error: 'Title is required',
        });
        continue;
      }

      if (!item.slug && item.title) {
        item.slug = item.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      try {
        const article = await this.articlesService.create(item);
        results.push({ success: true, title: article.title, id: article.id });
      } catch (error: any) {
        errors.push({ title: item.title, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      message: `Imported ${results.length} articles, ${errors.length} failed`,
      imported: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkArticleStatusDto) {
    const result = await this.articlesService.bulkUpdateStatus(dto);
    return {
      success: result.success,
      message: `${result.count} articles updated`,
      count: result.count,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  async likeArticle(@Param('id') id: string) {
    const article = await this.articlesService.incrementLikes(parseInt(id, 10));
    return { success: true, data: article };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch(':id')
  async updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    const article = await this.articlesService.update(parseInt(id, 10), dto);
    return { success: true, data: article };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    await this.articlesService.remove(parseInt(id, 10));
    return { success: true, message: 'Article deleted' };
  }
}
