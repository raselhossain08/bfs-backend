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
import { ServicesService } from './services.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryDto,
  BulkServiceStatusDto,
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  ServiceCategoryQueryDto,
  CreateServiceInquiryDto,
  UpdateServiceInquiryDto,
  ServiceInquiryQueryDto,
  BulkInquiryStatusDto,
  ReorderServicesDto,
  ReorderCategoriesDto,
} from './dto/services.dto';

/**
 * Services Controller
 * Handles services, categories, and inquiries
 * Base path: /api/services
 */
@Controller('services')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) {}

  // ============ PUBLIC ENDPOINTS - CATEGORIES ============

  /**
   * Get active service categories
   * GET /api/services/categories
   * Legacy: /api/service-categories
   */
  @Get('categories')
  async getPublicCategories() {
    const categories = await this.servicesService.findActiveCategories();
    return { data: categories };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @Get('service-categories')
  async getPublicCategoriesLegacy() {
    return this.getPublicCategories();
  }

  // ============ PUBLIC ENDPOINTS - SERVICES ============

  /**
   * Get public services
   * GET /api/services
   * Legacy: /api/services (same)
   */
  @Get()
  async getPublicServices(
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const services = await this.servicesService.findPublicServices({
      limit: limit ? parseInt(limit, 10) : 10,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    });
    return { data: services };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @Get('services')
  async getPublicServicesLegacy(
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.getPublicServices(limit, categoryId, isFeatured);
  }

  // ============ ADMIN ENDPOINTS - CATEGORIES ============

  /**
   * Get all categories (admin)
   * GET /api/services/admin/categories
   * Legacy: /api/admin/service-categories
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/categories')
  async getAdminCategories(@Query() query: ServiceCategoryQueryDto) {
    return this.servicesService.findAllCategories(query);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/service-categories')
  async getAdminCategoriesLegacy(
    @Query() query: ServiceCategoryQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    return this.servicesService.findAllCategories(query);
  }

  /**
   * Get single category (admin)
   * GET /api/services/admin/categories/:id
   * Legacy: /api/admin/service-categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/categories/:id')
  async getCategory(@Param('id') id: string) {
    const category = await this.servicesService.findOneCategory(
      parseInt(id, 10),
    );
    return { data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/service-categories/:id')
  async getCategoryLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const category = await this.servicesService.findOneCategory(
      parseInt(id, 10),
    );
    return { data: category };
  }

  /**
   * Create category (admin)
   * POST /api/services/admin/categories
   * Legacy: /api/admin/service-categories
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/categories')
  async createCategory(@Body() dto: CreateServiceCategoryDto) {
    const category = await this.servicesService.createCategory(dto);
    return { success: true, data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/service-categories')
  async createCategoryLegacy(
    @Body() dto: CreateServiceCategoryDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can create categories' };
    }
    const category = await this.servicesService.createCategory(dto);
    return { success: true, data: category };
  }

  /**
   * Update category (admin)
   * PATCH /api/services/admin/categories/:id
   * Legacy: /api/admin/service-categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    const category = await this.servicesService.updateCategory(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: category };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/service-categories/:id')
  async updateCategoryLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const category = await this.servicesService.updateCategory(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: category };
  }

  /**
   * Delete category (admin)
   * DELETE /api/services/admin/categories/:id
   * Legacy: /api/admin/service-categories/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.servicesService.removeCategory(parseInt(id, 10));
    return { success: true, message: 'Category deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/service-categories/:id')
  async deleteCategoryLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete categories' };
    }
    await this.servicesService.removeCategory(parseInt(id, 10));
    return { success: true, message: 'Category deleted' };
  }

  /**
   * Reorder categories (admin)
   * POST /api/services/admin/categories/reorder
   * Legacy: /api/admin/service-categories/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/categories/reorder')
  async reorderCategories(@Body() dto: ReorderCategoriesDto) {
    await this.servicesService.reorderCategories(dto);
    return { success: true, message: 'Categories reordered' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/service-categories/reorder')
  async reorderCategoriesLegacy(
    @Body() dto: ReorderCategoriesDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    await this.servicesService.reorderCategories(dto);
    return { success: true, message: 'Categories reordered' };
  }

  // ============ ADMIN ENDPOINTS - SERVICES ============

  /**
   * Get all services (admin)
   * GET /api/services/admin
   * Legacy: /api/admin/services
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminServices(@Query() query: ServiceQueryDto) {
    return this.servicesService.findAllServices(query);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/services')
  async getAdminServicesLegacy(
    @Query() query: ServiceQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    return this.servicesService.findAllServices(query);
  }

  /**
   * Get service stats (admin)
   * GET /api/services/admin/stats
   * Legacy: /api/admin/services/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getServiceStats() {
    const stats = await this.servicesService.getServiceStats();
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/services/stats')
  async getServiceStatsLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return {
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          draft: 0,
          featured: 0,
          totalInquiries: 0,
          totalViews: 0,
        },
      };
    }
    const stats = await this.servicesService.getServiceStats();
    return { data: stats };
  }

  /**
   * Create service (admin)
   * POST /api/services/admin
   * Legacy: /api/admin/services
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin')
  async createService(@Body() dto: CreateServiceDto) {
    const service = await this.servicesService.createService(dto);
    return { success: true, data: service };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/services')
  async createServiceLegacy(
    @Body() dto: CreateServiceDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins and editors can create services',
      };
    }
    const service = await this.servicesService.createService(dto);
    return { success: true, data: service };
  }

  /**
   * Update service (admin)
   * PATCH /api/services/admin/:id
   * Legacy: /api/admin/services/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const service = await this.servicesService.updateService(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: service };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/services/:id')
  async updateServiceLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const service = await this.servicesService.updateService(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: service };
  }

  /**
   * Delete service (admin)
   * DELETE /api/services/admin/:id
   * Legacy: /api/admin/services/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/:id')
  async deleteService(@Param('id') id: string) {
    await this.servicesService.removeService(parseInt(id, 10));
    return { success: true, message: 'Service deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/services/:id')
  async deleteServiceLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete services' };
    }
    await this.servicesService.removeService(parseInt(id, 10));
    return { success: true, message: 'Service deleted' };
  }

  /**
   * Bulk update services status (admin)
   * POST /api/services/admin/bulk-status
   * Legacy: /api/admin/services/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkServiceStatusDto) {
    const result = await this.servicesService.bulkUpdateStatus(dto);
    return {
      success: result.success,
      message: `${result.count} services updated`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/services/bulk-status')
  async bulkUpdateStatusLegacy(
    @Body() dto: BulkServiceStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.servicesService.bulkUpdateStatus(dto);
    return {
      success: result.success,
      message: `${result.count} services updated`,
      count: result.count,
    };
  }

  /**
   * Reorder services (admin)
   * POST /api/services/admin/reorder
   * Legacy: /api/admin/services/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/reorder')
  async reorderServices(@Body() dto: ReorderServicesDto) {
    await this.servicesService.reorderServices(dto);
    return { success: true, message: 'Services reordered' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/services/reorder')
  async reorderServicesLegacy(
    @Body() dto: ReorderServicesDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    await this.servicesService.reorderServices(dto);
    return { success: true, message: 'Services reordered' };
  }

  /**
   * Export services (admin)
   * GET /api/services/admin/export
   * Legacy: /api/admin/services/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/export')
  async exportServices(
    @Query('format') format: 'csv' | 'json',
    @Query() query: ServiceQueryDto,
    @Res() res: Response,
  ) {
    const result = this.servicesService.exportServices(format || 'csv', query);

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="services-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/services/export')
  async exportServicesLegacy(
    @Query('format') format: 'csv' | 'json',
    @Query() query: ServiceQueryDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = this.servicesService.exportServices(format || 'csv', query);

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="services-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  // ============ ADMIN ENDPOINTS - INQUIRIES ============

  /**
   * Get all inquiries (admin)
   * GET /api/services/admin/inquiries
   * Legacy: /api/admin/service-inquiries
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/inquiries')
  async getInquiries(@Query() query: ServiceInquiryQueryDto) {
    return this.servicesService.findAllInquiries(query);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/service-inquiries')
  async getInquiriesLegacy(
    @Query() query: ServiceInquiryQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    return this.servicesService.findAllInquiries(query);
  }

  /**
   * Get single inquiry (admin)
   * GET /api/services/admin/inquiries/:id
   * Legacy: /api/admin/service-inquiries/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/inquiries/:id')
  async getInquiry(@Param('id') id: string) {
    const inquiry = await this.servicesService.findOneInquiry(parseInt(id, 10));
    return { data: inquiry };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/service-inquiries/:id')
  async getInquiryLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const inquiry = await this.servicesService.findOneInquiry(parseInt(id, 10));
    return { data: inquiry };
  }

  /**
   * Update inquiry (admin)
   * PATCH /api/services/admin/inquiries/:id
   * Legacy: /api/admin/service-inquiries/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/inquiries/:id')
  async updateInquiry(
    @Param('id') id: string,
    @Body() dto: UpdateServiceInquiryDto,
  ) {
    const inquiry = await this.servicesService.updateInquiry(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: inquiry };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/service-inquiries/:id')
  async updateInquiryLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateServiceInquiryDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const inquiry = await this.servicesService.updateInquiry(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: inquiry };
  }

  /**
   * Bulk update inquiries status (admin)
   * POST /api/services/admin/inquiries/bulk-status
   * Legacy: /api/admin/service-inquiries/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/inquiries/bulk-status')
  async bulkUpdateInquiryStatus(@Body() dto: BulkInquiryStatusDto) {
    const result = await this.servicesService.bulkUpdateInquiryStatus(dto);
    return {
      success: result.success,
      message: `${result.count} inquiries updated`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/service-inquiries/bulk-status')
  async bulkUpdateInquiryStatusLegacy(
    @Body() dto: BulkInquiryStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.servicesService.bulkUpdateInquiryStatus(dto);
    return {
      success: result.success,
      message: `${result.count} inquiries updated`,
      count: result.count,
    };
  }

  /**
   * Export inquiries (admin)
   * GET /api/services/admin/inquiries/export
   * Legacy: /api/admin/service-inquiries/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/inquiries/export')
  async exportInquiries(
    @Query('serviceId') serviceId: string,
    @Query('format') format: 'csv' | 'json',
    @Res() res: Response,
  ) {
    const result = this.servicesService.exportInquiries(
      serviceId ? parseInt(serviceId, 10) : undefined,
      format || 'csv',
    );

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="service-inquiries-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/service-inquiries/export')
  async exportInquiriesLegacy(
    @Query('serviceId') serviceId: string,
    @Query('format') format: 'csv' | 'json',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = this.servicesService.exportInquiries(
      serviceId ? parseInt(serviceId, 10) : undefined,
      format || 'csv',
    );

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="service-inquiries-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  // ============ PUBLIC ENDPOINTS - SLUG ROUTES ============
  // IMPORTANT: These MUST come after all admin routes to avoid "admin" being matched as a slug

  /**
   * Get single service (admin)
   * GET /api/services/admin/:id
   * Legacy: /api/admin/services/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getService(@Param('id') id: string) {
    const service = await this.servicesService.findOneService(parseInt(id, 10));
    return { data: service };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/services/:id')
  async getServiceLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const service = await this.servicesService.findOneService(parseInt(id, 10));
    return { data: service };
  }

  // ============ PUBLIC ENDPOINTS - SLUG ROUTES ============
  // IMPORTANT: These MUST come after all admin routes to avoid "admin" being matched as a slug

  /**
   * Get service by slug
   * GET /api/services/:slug
   * Legacy: /api/services/:slug (same)
   */
  @Get(':slug')
  async getPublicService(@Param('slug') slug: string) {
    const service = await this.servicesService.findBySlug(slug);
    return { data: service };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @Get('services/:slug')
  async getPublicServiceLegacy(@Param('slug') slug: string) {
    return this.getPublicService(slug);
  }

  /**
   * Create service inquiry
   * POST /api/services/:serviceId/inquire
   * Legacy: /api/services/:serviceId/inquire (same)
   */
  @Post(':serviceId/inquire')
  async createInquiry(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceInquiryDto,
  ) {
    const inquiry = await this.servicesService.createInquiry({
      ...dto,
      serviceId: parseInt(serviceId, 10),
    });
    return { success: true, data: inquiry };
  }
}
