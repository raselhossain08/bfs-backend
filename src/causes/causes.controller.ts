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
    NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { CausesService } from './causes.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES, FULL_ADMIN_ROLES, EDITOR_ROLES } from '../common/decorators/roles.decorator';
import {
    CreateCauseDto,
    UpdateCauseDto,
    CauseQueryDto,
    BulkCauseStatusDto,
    CreateCauseCategoryDto,
    UpdateCauseCategoryDto,
    CauseCategoryQueryDto,
    CreateDonationDto,
    UpdateDonationDto,
    DonationQueryDto,
    BulkDonationStatusDto,
    ReorderCausesDto,
    ReorderCauseCategoriesDto,
} from './dto/causes.dto';

/**
 * Causes Controller
 * Handles causes, categories, and donations
 * Base path: /api/causes
 */
@Controller('causes')
export class CausesController {
    private readonly logger = new Logger(CausesController.name);

    constructor(private readonly causesService: CausesService) {}

    // ============ PUBLIC ENDPOINTS - CATEGORIES ============

    /**
     * Get active cause categories
     * GET /api/causes/categories
     * Legacy: /api/cause-categories (also works)
     */
    @Get('categories')
    async getPublicCategories() {
        const categories = await this.causesService.findActiveCategories();
        return { data: categories };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @Get('cause-categories')
    async getPublicCategoriesLegacy() {
        return this.getPublicCategories();
    }

    // ============ PUBLIC ENDPOINTS - CAUSES ============

    /**
     * Get public causes
     * GET /api/causes
     */
    @Get()
    async getPublicCauses(
        @Query('limit') limit?: string,
        @Query('categoryId') categoryId?: string,
        @Query('isFeatured') isFeatured?: string
    ) {
        const causes = await this.causesService.findPublicCauses({
            limit: limit ? parseInt(limit, 10) : 10,
            categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
            isFeatured: isFeatured === 'true' ? true : undefined,
        });
        return { data: causes };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @Get('causes')
    async getPublicCausesLegacy(
        @Query('limit') limit?: string,
        @Query('categoryId') categoryId?: string,
        @Query('isFeatured') isFeatured?: string
    ) {
        return this.getPublicCauses(limit, categoryId, isFeatured);
    }

    // ============ ADMIN ENDPOINTS - CATEGORIES ============

    /**
     * Get all categories (admin)
     * GET /api/causes/admin/categories
     * Legacy: /api/admin/cause-categories
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/categories')
    async getAdminCategories(@Query() query: CauseCategoryQueryDto) {
        return this.causesService.findAllCategories(query);
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/cause-categories')
    async getAdminCategoriesLegacy(@Query() query: CauseCategoryQueryDto, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.causesService.findAllCategories(query);
    }

    /**
     * Get single category (admin)
     * GET /api/causes/admin/categories/:id
     * Legacy: /api/admin/cause-categories/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/categories/:id')
    async getCategory(@Param('id') id: string) {
        const category = await this.causesService.findOneCategory(parseInt(id, 10));
        return { data: category };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/cause-categories/:id')
    async getCategoryLegacy(@Param('id') id: string, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: null, message: 'Access denied' };
        }
        const category = await this.causesService.findOneCategory(parseInt(id, 10));
        return { data: category };
    }

    /**
     * Create category (admin)
     * POST /api/causes/admin/categories
     * Legacy: /api/admin/cause-categories
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/categories')
    async createCategory(@Body() dto: CreateCauseCategoryDto) {
        const category = await this.causesService.createCategory(dto);
        return { success: true, data: category };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/cause-categories')
    async createCategoryLegacy(@Body() dto: CreateCauseCategoryDto, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can create categories' };
        }
        const category = await this.causesService.createCategory(dto);
        return { success: true, data: category };
    }

    /**
     * Update category (admin)
     * PATCH /api/causes/admin/categories/:id
     * Legacy: /api/admin/cause-categories/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/categories/:id')
    async updateCategory(
        @Param('id') id: string,
        @Body() dto: UpdateCauseCategoryDto,
    ) {
        const category = await this.causesService.updateCategory(parseInt(id, 10), dto);
        return { success: true, data: category };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Patch('admin/cause-categories/:id')
    async updateCategoryLegacy(
        @Param('id') id: string,
        @Body() dto: UpdateCauseCategoryDto,
        @Request() req: any,
    ) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        const category = await this.causesService.updateCategory(parseInt(id, 10), dto);
        return { success: true, data: category };
    }

    /**
     * Delete category (admin)
     * DELETE /api/causes/admin/categories/:id
     * Legacy: /api/admin/cause-categories/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Delete('admin/categories/:id')
    async deleteCategory(@Param('id') id: string) {
        await this.causesService.removeCategory(parseInt(id, 10));
        return { success: true, message: 'Category deleted' };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/cause-categories/:id')
    async deleteCategoryLegacy(@Param('id') id: string, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can delete categories' };
        }
        await this.causesService.removeCategory(parseInt(id, 10));
        return { success: true, message: 'Category deleted' };
    }

    /**
     * Reorder categories (admin)
     * POST /api/causes/admin/categories/reorder
     * Legacy: /api/admin/cause-categories/reorder
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('admin/categories/reorder')
    async reorderCategories(@Body() dto: ReorderCauseCategoriesDto) {
        await this.causesService.reorderCategories(dto);
        return { success: true, message: 'Categories reordered' };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/cause-categories/reorder')
    async reorderCategoriesLegacy(@Body() dto: ReorderCauseCategoriesDto, @Request() req: any) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        await this.causesService.reorderCategories(dto);
        return { success: true, message: 'Categories reordered' };
    }

    // ============ ADMIN ENDPOINTS - CAUSES ============

    /**
     * Get all causes (admin)
     * GET /api/causes/admin
     * Legacy: /api/admin/causes
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin')
    async getAdminCauses(@Query() query: CauseQueryDto) {
        return this.causesService.findAllCauses(query);
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/causes')
    async getAdminCausesLegacy(@Query() query: CauseQueryDto, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.causesService.findAllCauses(query);
    }

    /**
     * Get cause stats (admin)
     * GET /api/causes/admin/stats
     * Legacy: /api/admin/causes/stats
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/stats')
    async getCauseStats() {
        const stats = await this.causesService.getCauseStats();
        return { data: stats };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/causes/stats')
    async getCauseStatsLegacy(@Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: { total: 0, active: 0, inactive: 0, draft: 0, featured: 0, totalDonations: 0, totalRaised: 0, totalViews: 0 } };
        }
        const stats = await this.causesService.getCauseStats();
        return { data: stats };
    }

    /**
     * Create cause (admin)
     * POST /api/causes/admin
     * Legacy: /api/admin/causes
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('admin')
    async createCause(@Body() dto: CreateCauseDto, @Request() req: any) {
        const cause = await this.causesService.createCause({
            ...dto,
            createdBy: req.user?.id,
        } as any);
        return { success: true, data: cause };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/causes')
    async createCauseLegacy(@Body() dto: CreateCauseDto, @Request() req: any) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins and editors can create causes' };
        }
        const cause = await this.causesService.createCause({
            ...dto,
            createdBy: req.user?.id,
        } as any);
        return { success: true, data: cause };
    }

    /**
     * Update cause (admin)
     * PATCH /api/causes/admin/:id
     * Legacy: /api/admin/causes/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/:id')
    async updateCause(
        @Param('id') id: string,
        @Body() dto: UpdateCauseDto,
    ) {
        const cause = await this.causesService.updateCause(parseInt(id, 10), dto);
        return { success: true, data: cause };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Patch('admin/causes/:id')
    async updateCauseLegacy(
        @Param('id') id: string,
        @Body() dto: UpdateCauseDto,
        @Request() req: any,
    ) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        const cause = await this.causesService.updateCause(parseInt(id, 10), dto);
        return { success: true, data: cause };
    }

    /**
     * Delete cause (admin)
     * DELETE /api/causes/admin/:id
     * Legacy: /api/admin/causes/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Delete('admin/:id')
    async deleteCause(@Param('id') id: string) {
        await this.causesService.removeCause(parseInt(id, 10));
        return { success: true, message: 'Cause deleted' };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/causes/:id')
    async deleteCauseLegacy(@Param('id') id: string, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can delete causes' };
        }
        await this.causesService.removeCause(parseInt(id, 10));
        return { success: true, message: 'Cause deleted' };
    }

    /**
     * Bulk update causes status (admin)
     * POST /api/causes/admin/bulk-status
     * Legacy: /api/admin/causes/bulk-status
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/bulk-status')
    async bulkUpdateStatus(@Body() dto: BulkCauseStatusDto) {
        const result = await this.causesService.bulkUpdateStatus(dto);
        return {
            success: result.success,
            message: `${result.count} causes updated`,
            count: result.count,
        };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/causes/bulk-status')
    async bulkUpdateStatusLegacy(@Body() dto: BulkCauseStatusDto, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can perform bulk actions' };
        }
        const result = await this.causesService.bulkUpdateStatus(dto);
        return {
            success: result.success,
            message: `${result.count} causes updated`,
            count: result.count,
        };
    }

    /**
     * Reorder causes (admin)
     * POST /api/causes/admin/reorder
     * Legacy: /api/admin/causes/reorder
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('admin/reorder')
    async reorderCauses(@Body() dto: ReorderCausesDto) {
        await this.causesService.reorderCauses(dto);
        return { success: true, message: 'Causes reordered' };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/causes/reorder')
    async reorderCausesLegacy(@Body() dto: ReorderCausesDto, @Request() req: any) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        await this.causesService.reorderCauses(dto);
        return { success: true, message: 'Causes reordered' };
    }

    /**
     * Export causes (admin)
     * GET /api/causes/admin/export
     * Legacy: /api/admin/causes/export
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/export')
    async exportCauses(
        @Query('format') format: 'csv' | 'json',
        @Query() query: CauseQueryDto,
        @Res() res: Response,
    ) {
        const result = this.causesService.exportCauses(format || 'csv', query);

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="causes-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/causes/export')
    async exportCausesLegacy(
        @Query('format') format: 'csv' | 'json',
        @Query() query: CauseQueryDto,
        @Request() req: any,
        @Res() res: Response,
    ) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const result = this.causesService.exportCauses(format || 'csv', query);

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="causes-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    // ============ ADMIN ENDPOINTS - DONATIONS ============

    /**
     * Get all donations (admin)
     * GET /api/causes/admin/donations
     * Legacy: /api/admin/donations
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/donations')
    async getDonations(@Query() query: DonationQueryDto) {
        return this.causesService.findAllDonations(query);
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/donations')
    async getDonationsLegacy(@Query() query: DonationQueryDto, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.causesService.findAllDonations(query);
    }

    /**
     * Get donation stats (admin)
     * GET /api/causes/admin/donations/stats
     * Legacy: /api/admin/donations/stats
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/donations/stats')
    async getDonationStats() {
        const stats = await this.causesService.getDonationStats();
        return { data: stats };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/donations/stats')
    async getDonationStatsLegacy(@Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: { total: 0, completed: 0, pending: 0, failed: 0, totalAmount: 0, thisMonth: 0, thisMonthAmount: 0 } };
        }
        const stats = await this.causesService.getDonationStats();
        return { data: stats };
    }

    /**
     * Get single donation (admin)
     * GET /api/causes/admin/donations/:id
     * Legacy: /api/admin/donations/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/donations/:id')
    async getDonation(@Param('id') id: string) {
        const donation = await this.causesService.findOneDonation(parseInt(id, 10));
        return { data: donation };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/donations/:id')
    async getDonationLegacy(@Param('id') id: string, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: null, message: 'Access denied' };
        }
        const donation = await this.causesService.findOneDonation(parseInt(id, 10));
        return { data: donation };
    }

    /**
     * Update donation (admin)
     * PATCH /api/causes/admin/donations/:id
     * Legacy: /api/admin/donations/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/donations/:id')
    async updateDonation(
        @Param('id') id: string,
        @Body() dto: UpdateDonationDto,
    ) {
        const donation = await this.causesService.updateDonation(parseInt(id, 10), dto);
        return { success: true, data: donation };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Patch('admin/donations/:id')
    async updateDonationLegacy(
        @Param('id') id: string,
        @Body() dto: UpdateDonationDto,
        @Request() req: any,
    ) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        const donation = await this.causesService.updateDonation(parseInt(id, 10), dto);
        return { success: true, data: donation };
    }

    /**
     * Bulk update donations status (admin)
     * POST /api/causes/admin/donations/bulk-status
     * Legacy: /api/admin/donations/bulk-status
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/donations/bulk-status')
    async bulkUpdateDonationStatus(@Body() dto: BulkDonationStatusDto) {
        const result = await this.causesService.bulkUpdateDonationStatus(dto);
        return {
            success: result.success,
            message: `${result.count} donations updated`,
            count: result.count,
        };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/donations/bulk-status')
    async bulkUpdateDonationStatusLegacy(@Body() dto: BulkDonationStatusDto, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can perform bulk actions' };
        }
        const result = await this.causesService.bulkUpdateDonationStatus(dto);
        return {
            success: result.success,
            message: `${result.count} donations updated`,
            count: result.count,
        };
    }

    /**
     * Export donations (admin)
     * GET /api/causes/admin/donations/export
     * Legacy: /api/admin/donations/export
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/donations/export')
    async exportDonations(
        @Query('causeId') causeId: string,
        @Query('format') format: 'csv' | 'json',
        @Res() res: Response,
    ) {
        const result = this.causesService.exportDonations(
            causeId ? parseInt(causeId, 10) : undefined,
            format || 'csv'
        );

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="donations-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/donations/export')
    async exportDonationsLegacy(
        @Query('causeId') causeId: string,
        @Query('format') format: 'csv' | 'json',
        @Request() req: any,
        @Res() res: Response,
    ) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const result = this.causesService.exportDonations(
            causeId ? parseInt(causeId, 10) : undefined,
            format || 'csv'
        );

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="donations-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    // ============ ADMIN DONORS ENDPOINT ============
    // Must come BEFORE parameterized routes like :slug

    /**
     * Get all donors list (admin)
     * GET /api/causes/donors
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('donors')
    async getAllDonors(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        const result = await this.causesService.getAllDonors({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search,
            status,
        });
        return { data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
    }

    /**
     * Get all donations (admin) - Database version
     * GET /api/causes/donations
     * Replaces CMS /api/donations
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('donations')
    async getAllDonationsList(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('causeId') causeId?: string,
    ) {
        const result = await this.causesService.findAllDonations({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            causeId: causeId ? parseInt(causeId, 10) : undefined,
        });
        return { data: result.data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages };
    }

    /**
     * Get single donor with details (admin)
     * GET /api/causes/donors/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('donors/:id')
    async getDonorById(@Param('id') id: string) {
        const donor = await this.causesService.getDonorById(parseInt(id, 10));
        if (!donor) {
            throw new NotFoundException('Donor not found');
        }
        return { data: donor };
    }

    /**
     * Get single cause (admin)
     * GET /api/causes/admin/:id
     * Legacy: /api/admin/causes/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/:id')
    async getCause(@Param('id') id: string) {
        const cause = await this.causesService.findOneCause(parseInt(id, 10));
        return { data: cause };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @UseGuards(AuthGuard('jwt'))
    @Get('admin/causes/:id')
    async getCauseLegacy(@Param('id') id: string, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: null, message: 'Access denied' };
        }
        const cause = await this.causesService.findOneCause(parseInt(id, 10));
        return { data: cause };
    }

    // ============ PUBLIC ENDPOINTS - SLUG ROUTES ============
    // IMPORTANT: These MUST come after all admin routes to avoid "admin" being matched as a slug

    /**
     * Get a cause by slug
     * GET /api/causes/:slug
     * Legacy: /api/causes/:slug (same)
     */
    @Get(':slug')
    async getPublicCause(@Param('slug') slug: string) {
        const cause = await this.causesService.findBySlug(slug);
        return { data: cause };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @Get('causes/:slug')
    async getPublicCauseLegacy(@Param('slug') slug: string) {
        return this.getPublicCause(slug);
    }

    /**
     * Get public donation info for a cause
     * GET /api/causes/:slug/donations
     * Legacy: /api/causes/:slug/donations (same)
     */
    @Get(':slug/donations')
    async getCauseDonations(@Param('slug') slug: string) {
        const cause = await this.causesService.findBySlug(slug);
        return {
            data: {
                raised: cause.raised,
                donors: cause.donors,
                progress: cause.progress,
            },
        };
    }

    /** @deprecated - Legacy route for backward compatibility */
    @Get('causes/:slug/donations')
    async getCauseDonationsLegacy(@Param('slug') slug: string) {
        return this.getCauseDonations(slug);
    }

    // ============ USER IMPACT ENDPOINTS ============
    /** MOVED to UsersController - kept here for backward compatibility */

    /** @deprecated - Moved to UsersController: GET /api/users/me/impact */
    @UseGuards(AuthGuard('jwt'))
    @Get('users/me/impact')
    async getUserImpact(@Request() req: any) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const impact = await this.causesService.getUserImpact(userId);
        return { data: impact };
    }

    /** @deprecated - Moved to UsersController: GET /api/users/me/donations */
    @UseGuards(AuthGuard('jwt'))
    @Get('users/me/donations')
    async getUserDonations(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: [], total: 0, message: 'User not authenticated' };
        }

        const result = await this.causesService.getUserDonations(userId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
        return result;
    }

    // ============ RECEIPT ENDPOINTS ============

    /**
     * Get donation receipt (authenticated)
     * GET /api/causes/donations/:id/receipt
     * Legacy: /api/donations/:id/receipt
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('donations/:id/receipt')
    async getDonationReceipt(
        @Param('id') id: string,
        @Request() req: any,
        @Res() res: Response,
    ) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const receipt = await this.causesService.generateReceipt(parseInt(id, 10), userId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
        return res.send(receipt);
    }

    /**
     * Email donation receipt (authenticated)
     * POST /api/causes/donations/:id/email-receipt
     * Legacy: /api/donations/:id/email-receipt
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('donations/:id/email-receipt')
    async emailDonationReceipt(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        await this.causesService.emailReceipt(parseInt(id, 10), userId);
        return { success: true, message: 'Receipt sent to your email' };
    }

    /**
     * Generate annual tax summary (authenticated)
     * POST /api/causes/donations/annual-summary/:year
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('donations/annual-summary/:year')
    async generateAnnualSummary(
        @Param('year') year: string,
        @Request() req: any,
        @Res() res: Response,
    ) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const summary = await this.causesService.generateAnnualSummary(parseInt(year, 10), userId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="tax-summary-${year}.pdf"`);
        return res.send(summary);
    }
}
