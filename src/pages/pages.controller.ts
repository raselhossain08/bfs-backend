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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PagesService } from './pages.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreatePageDto,
  UpdatePageDto,
  PageQueryDto,
  BulkPageStatusDto,
  ReorderPagesDto,
  CreateSectionDto,
  UpdateSectionDto,
  ReorderSectionsDto,
} from './pages.dto';

/**
 * Pages Controller
 * Handles CMS pages and sections
 * Base path: /api/pages
 */
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // ============ ADMIN PAGE ENDPOINTS ============
  // NOTE: Admin routes must be defined BEFORE public :slug routes
  // to prevent "admin" from being matched as a page slug

  /**
   * Get all pages (admin)
   * GET /api/pages/admin
   * Legacy: /api/admin/pages
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminPages(@Query() query: PageQueryDto) {
    return this.pagesService.findAllPages(query);
  }

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Get public pages
   * GET /api/pages
   * Legacy: /api/pages (same)
   */
  @Get()
  async getPublicPages() {
    const pages = await this.pagesService.findPublicPages();
    return { data: pages };
  }

  /**
   * Get page by slug
   * GET /api/pages/:slug
   * Legacy: /api/pages/:slug (same)
   */
  @Get(':slug')
  async getPublicPage(@Param('slug') slug: string) {
    const page = await this.pagesService.findPageBySlug(slug);
    return { data: page };
  }

  /**
   * Get page sections
   * GET /api/pages/:slug/sections
   * Legacy: /api/pages/:slug/sections (same)
   */
  @Get(':slug/sections')
  async getPublicPageSections(@Param('slug') slug: string) {
    const page = await this.pagesService.findPageBySlug(slug);
    return { data: page.sections };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/pages')
  async getAdminPagesLegacy(@Query() query: PageQueryDto, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    return this.pagesService.findAllPages(query);
  }

  /**
   * Get page stats (admin)
   * GET /api/pages/admin/stats
   * Legacy: /api/admin/pages/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getPageStats() {
    const stats = await this.pagesService.getPageStats();
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/pages/stats')
  async getPageStatsLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return {
        data: { total: 0, published: 0, draft: 0, static: 0, dynamic: 0 },
      };
    }
    const stats = await this.pagesService.getPageStats();
    return { data: stats };
  }

  /**
   * Get single page (admin)
   * GET /api/pages/admin/:id
   * Legacy: /api/admin/pages/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getPage(@Param('id') id: string) {
    const page = await this.pagesService.findOnePage(parseInt(id, 10));
    return { data: page };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/pages/:id')
  async getPageLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const page = await this.pagesService.findOnePage(parseInt(id, 10));
    return { data: page };
  }

  /**
   * Create page (admin)
   * POST /api/pages/admin
   * Legacy: /api/admin/pages
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin')
  async createPage(@Body() dto: CreatePageDto) {
    const page = await this.pagesService.createPage(dto);
    return { success: true, data: page };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/pages')
  async createPageLegacy(@Body() dto: CreatePageDto, @Request() req: any) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins and editors can create pages',
      };
    }
    const page = await this.pagesService.createPage(dto);
    return { success: true, data: page };
  }

  /**
   * Update page (admin)
   * PATCH /api/pages/admin/:id
   * Legacy: /api/admin/pages/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    const page = await this.pagesService.updatePage(parseInt(id, 10), dto);
    return { success: true, data: page };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/pages/:id')
  async updatePageLegacy(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const page = await this.pagesService.updatePage(parseInt(id, 10), dto);
    return { success: true, data: page };
  }

  /**
   * Delete page (admin)
   * DELETE /api/pages/admin/:id
   * Legacy: /api/admin/pages/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/:id')
  async deletePage(@Param('id') id: string) {
    await this.pagesService.removePage(parseInt(id, 10));
    return { success: true, message: 'Page deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/pages/:id')
  async deletePageLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete pages' };
    }
    await this.pagesService.removePage(parseInt(id, 10));
    return { success: true, message: 'Page deleted' };
  }

  /**
   * Bulk update pages status (admin)
   * POST /api/pages/admin/bulk-status
   * Legacy: /api/admin/pages/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/bulk-status')
  async bulkUpdatePageStatus(@Body() dto: BulkPageStatusDto) {
    const result = await this.pagesService.bulkUpdatePageStatus(dto);
    return {
      success: result.success,
      message: `${result.count} pages updated`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/pages/bulk-status')
  async bulkUpdatePageStatusLegacy(
    @Body() dto: BulkPageStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.pagesService.bulkUpdatePageStatus(dto);
    return {
      success: result.success,
      message: `${result.count} pages updated`,
      count: result.count,
    };
  }

  /**
   * Reorder pages (admin)
   * POST /api/pages/admin/reorder
   * Legacy: /api/admin/pages/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/reorder')
  async reorderPages(@Body() dto: ReorderPagesDto) {
    await this.pagesService.reorderPages(dto);
    return { success: true, message: 'Pages reordered' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/pages/reorder')
  async reorderPagesLegacy(@Body() dto: ReorderPagesDto, @Request() req: any) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    await this.pagesService.reorderPages(dto);
    return { success: true, message: 'Pages reordered' };
  }

  // ============ ADMIN SECTION ENDPOINTS ============

  /**
   * Get page sections (admin)
   * GET /api/pages/admin/:id/sections
   * Legacy: /api/admin/pages/:id/sections
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id/sections')
  async getPageSections(@Param('id') id: string) {
    const sections = await this.pagesService.findSectionsByPageId(
      parseInt(id, 10),
    );
    return { data: sections };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/pages/:id/sections')
  async getPageSectionsLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], message: 'Access denied' };
    }
    const sections = await this.pagesService.findSectionsByPageId(
      parseInt(id, 10),
    );
    return { data: sections };
  }

  /**
   * Create section (admin)
   * POST /api/pages/admin/:id/sections
   * Legacy: /api/admin/pages/:id/sections
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/:id/sections')
  async createSection(@Param('id') id: string, @Body() dto: CreateSectionDto) {
    const section = await this.pagesService.createSection(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: section };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/pages/:id/sections')
  async createSectionLegacy(
    @Param('id') id: string,
    @Body() dto: CreateSectionDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins and editors can create sections',
      };
    }
    const section = await this.pagesService.createSection(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: section };
  }

  /**
   * Get single section (admin)
   * GET /api/pages/admin/sections/:id
   * Legacy: /api/admin/sections/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/sections/:id')
  async getSection(@Param('id') id: string) {
    const section = await this.pagesService.findOneSection(parseInt(id, 10));
    return { data: section };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/sections/:id')
  async getSectionLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const section = await this.pagesService.findOneSection(parseInt(id, 10));
    return { data: section };
  }

  /**
   * Update section (admin)
   * PATCH /api/pages/admin/sections/:id
   * Legacy: /api/admin/sections/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/sections/:id')
  async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    const section = await this.pagesService.updateSection(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: section };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/sections/:id')
  async updateSectionLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const section = await this.pagesService.updateSection(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: section };
  }

  /**
   * Delete section (admin)
   * DELETE /api/pages/admin/sections/:id
   * Legacy: /api/admin/sections/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/sections/:id')
  async deleteSection(@Param('id') id: string) {
    await this.pagesService.removeSection(parseInt(id, 10));
    return { success: true, message: 'Section deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/sections/:id')
  async deleteSectionLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete sections' };
    }
    await this.pagesService.removeSection(parseInt(id, 10));
    return { success: true, message: 'Section deleted' };
  }

  /**
   * Reorder sections (admin)
   * POST /api/pages/admin/sections/reorder
   * Legacy: /api/admin/sections/reorder
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/sections/reorder')
  async reorderSections(@Body() dto: ReorderSectionsDto) {
    await this.pagesService.reorderSections(dto);
    return { success: true, message: 'Sections reordered' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/sections/reorder')
  async reorderSectionsLegacy(
    @Body() dto: ReorderSectionsDto,
    @Request() req: any,
  ) {
    if (!EDITOR_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    await this.pagesService.reorderSections(dto);
    return { success: true, message: 'Sections reordered' };
  }
}
