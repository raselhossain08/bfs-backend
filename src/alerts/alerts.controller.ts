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
import { AlertsService } from './alerts.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES, EDITOR_ROLES } from '../common/decorators/roles.decorator';
import {
    CreateAlertTemplateDto,
    UpdateAlertTemplateDto,
    BroadcastAlertDto,
    AlertTemplateQueryDto,
    AlertBroadcastQueryDto,
} from './dto/alert.dto';

/**
 * Alerts Controller
 * Manages emergency alerts and templates
 * Base path: /api/alerts
 */
@Controller('alerts')
export class AlertsController {
    private readonly logger = new Logger(AlertsController.name);

    constructor(private readonly alertsService: AlertsService) {}

    // ============ TEMPLATE ENDPOINTS ============

    /**
     * Get all alert templates (public)
     * GET /api/alerts/templates
     */
    @Get('templates')
    async getTemplates(@Query() query: AlertTemplateQueryDto) {
        const templates = await this.alertsService.findAllTemplates(query);
        return { data: templates };
    }

    /**
     * Create alert template (admin)
     * POST /api/alerts/templates
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('templates')
    async createTemplate(@Body() dto: CreateAlertTemplateDto) {
        const template = await this.alertsService.createTemplate(dto);
        return { success: true, data: template };
    }

    /**
     * Get single template (public)
     * GET /api/alerts/templates/:id
     */
    @Get('templates/:id')
    async getTemplate(@Param('id') id: string) {
        const template = await this.alertsService.findTemplateById(parseInt(id, 10));
        return { data: template };
    }

    /**
     * Update template (admin)
     * PATCH /api/alerts/templates/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('templates/:id')
    async updateTemplate(
        @Param('id') id: string,
        @Body() dto: UpdateAlertTemplateDto,
    ) {
        const template = await this.alertsService.updateTemplate(parseInt(id, 10), dto);
        return { success: true, data: template };
    }

    /**
     * Delete template (admin)
     * DELETE /api/alerts/templates/:id
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Delete('templates/:id')
    async deleteTemplate(@Param('id') id: string) {
        await this.alertsService.deleteTemplate(parseInt(id, 10));
        return { success: true, message: 'Template deleted' };
    }

    // ============ BROADCAST ENDPOINTS ============

    /**
     * Get broadcast stats (admin)
     * GET /api/alerts/broadcasts/stats
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('broadcasts/stats')
    async getStats() {
        const stats = await this.alertsService.getStats();
        return { data: stats };
    }

    /**
     * Get broadcast history (admin)
     * GET /api/alerts/broadcasts
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('broadcasts')
    async getBroadcasts(@Query() query: AlertBroadcastQueryDto) {
        return this.alertsService.findAllBroadcasts(query);
    }

    /**
     * Create broadcast (admin)
     * POST /api/alerts/broadcasts
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('broadcasts')
    async createBroadcast(
        @Body() dto: BroadcastAlertDto,
        @Request() req: any,
    ) {
        const broadcast = await this.alertsService.createBroadcast(
            dto,
            req.user?.userId || 'unknown',
        );
        return {
            success: true,
            data: broadcast,
            message: 'Broadcast created successfully',
        };
    }

    /**
     * Export broadcasts (admin)
     * GET /api/alerts/broadcasts/export
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('broadcasts/export')
    async exportBroadcasts(
        @Query('format') format: 'csv' | 'json',
        @Query() query: AlertBroadcastQueryDto,
        @Res() res: Response,
    ) {
        const result = await this.alertsService.exportBroadcasts(
            format || 'csv',
            query,
        );

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="broadcasts-${new Date().toISOString().split('T')[0]}.csv"`,
        );
        return res.send(csvContent);
    }
}
