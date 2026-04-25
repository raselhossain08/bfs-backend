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
  Res,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { CategoriesService } from './categories.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  ReorderCategoriesDto,
  BulkStatusDto,
} from './categories.dto';

/**
 * Categories Controller
 * Handles article categories
 * Base path: /api/categories
 */
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Get active categories
   * GET /api/categories
   */
  @Get()
  async getPublicCategories() {
    const categories = await this.categoriesService.findActive();
    return { data: categories };
  }

  /**
   * Get category tree
   * GET /api/categories/tree
   */
  @Get('tree')
  async getCategoryTree() {
    const tree = await this.categoriesService.getTree();
    return { data: tree };
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all categories (admin)
   * GET /api/categories/admin
   * Legacy: /api/admin/categories
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminCategories(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/categories')
  async getAdminCategoriesLegacy(
    @Query() query: CategoryQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    return this.categoriesService.findAll(query);
  }

  /**
   * Get category stats (admin)
   * GET /api/categories/admin/stats
   * Legacy: /api/admin/categories/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getCategoryStats() {
    const stats = await this.categoriesService.getStats();
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/categories/stats')
  async getCategoryStatsLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: { total: 0, active: 0, inactive: 0, withArticles: 0 } };
    }
    const stats = await this.categoriesService.getStats();
    return { data: stats };
  }

  /**
   * Get single category (admin)
   * GET /api/categories/admin/:id
   * Legacy: /api/admin/categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getCategory(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(parseInt(id, 10));
    return { data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/categories/:id')
  async getCategoryLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const category = await this.categoriesService.findOne(parseInt(id, 10));
    return { data: category };
  }

  /**
   * Create category (admin)
   * POST /api/categories/admin
   * Legacy: /api/admin/categories
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin')
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return { success: true, data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/categories')
  async createCategoryLegacy(
    @Body() dto: CreateCategoryDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can create categories' };
    }
    const category = await this.categoriesService.create(dto);
    return { success: true, data: category };
  }

  /**
   * Update category (admin)
   * PATCH /api/categories/admin/:id
   * Legacy: /api/admin/categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(parseInt(id, 10), dto);
    return { success: true, data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/categories/:id')
  async updateCategoryLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const category = await this.categoriesService.update(parseInt(id, 10), dto);
    return { success: true, data: category };
  }

  /**
   * Delete category (admin)
   * DELETE /api/categories/admin/:id
   * Legacy: /api/admin/categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.remove(parseInt(id, 10));
    return { success: true, message: 'Category deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/categories/:id')
  async deleteCategoryLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete categories' };
    }
    await this.categoriesService.remove(parseInt(id, 10));
    return { success: true, message: 'Category deleted' };
  }

  /**
   * Reorder categories (admin)
   * POST /api/categories/admin/reorder
   * Legacy: /api/admin/categories/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/reorder')
  async reorderCategories(@Body() dto: ReorderCategoriesDto) {
    const result = await this.categoriesService.reorder(dto);
    return { success: result.success, message: 'Categories reordered' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/categories/reorder')
  async reorderCategoriesLegacy(
    @Body() dto: ReorderCategoriesDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const result = await this.categoriesService.reorder(dto);
    return { success: result.success, message: 'Categories reordered' };
  }

  /**
   * Bulk update categories status (admin)
   * POST /api/categories/admin/bulk-status
   * Legacy: /api/admin/categories/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkStatusDto) {
    const result = await this.categoriesService.bulkUpdateStatus(dto);
    return {
      success: result.success,
      message: `${result.count} categories updated`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/categories/bulk-status')
  async bulkUpdateStatusLegacy(
    @Body() dto: BulkStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.categoriesService.bulkUpdateStatus(dto);
    return {
      success: result.success,
      message: `${result.count} categories updated`,
      count: result.count,
    };
  }

  /**
   * Export categories (admin)
   * GET /api/categories/admin/export
   * Legacy: /api/admin/categories/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/export')
  async exportCategories(
    @Query('format') format: 'csv' | 'json',
    @Res() res: Response,
  ) {
    const { data } = await this.categoriesService.findAll({ limit: 10000 });

    if (format === 'json') {
      return res.json({ data });
    }

    // CSV format
    const headers = [
      'ID',
      'Name',
      'Slug',
      'Description',
      'Status',
      'Order',
      'Parent ID',
      'Created At',
    ];
    const rows = data.map((c: any) => [
      c.id,
      `"${c.name}"`,
      c.slug,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.status,
      c.order,
      c.parentId || '',
      c.createdAt?.toISOString() || '',
    ]);

    const csvContent = `${headers.join(',')}\n${rows.map((r) => r.join(',')).join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="categories-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/categories/export')
  async exportCategoriesLegacy(
    @Query('format') format: 'csv' | 'json',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { data } = await this.categoriesService.findAll({ limit: 10000 });

    if (format === 'json') {
      return res.json({ data });
    }

    const headers = [
      'ID',
      'Name',
      'Slug',
      'Description',
      'Status',
      'Order',
      'Parent ID',
      'Created At',
    ];
    const rows = data.map((c: any) => [
      c.id,
      `"${c.name}"`,
      c.slug,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.status,
      c.order,
      c.parentId || '',
      c.createdAt?.toISOString() || '',
    ]);

    const csvContent = `${headers.join(',')}\n${rows.map((r) => r.join(',')).join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="categories-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /**
   * Get category by slug (MUST be last - catches all /api/categories/:slug)
   * GET /api/categories/:slug
   */
  @Get(':slug')
  async getPublicCategory(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    return { data: category };
  }
}
