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
import { VolunteersService } from './volunteers.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  BulkStatusUpdateDto,
  AddNoteDto,
  ApplicationQueryDto,
  CreateVolunteerDto,
  UpdateVolunteerDto,
  VolunteerQueryDto,
  BulkVolunteerStatusDto,
  CreateVolunteerFromApplicationDto,
} from './volunteers.dto';

/**
 * Volunteers Controller
 * Handles volunteer applications and volunteer management
 * Base path: /api/volunteers
 */
@Controller('volunteers')
export class VolunteersController {
  private readonly logger = new Logger(VolunteersController.name);

  constructor(private readonly volunteersService: VolunteersService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Submit volunteer application
   * POST /api/volunteers/applications
   * Legacy: /api/volunteers/applications (same)
   */
  @Post('applications')
  async submitApplication(@Body() dto: CreateApplicationDto) {
    const application = await this.volunteersService.createApplication(dto);
    this.logger.log(`Public application submitted: ${dto.email}`);
    return {
      success: true,
      message:
        'Application submitted successfully! We will review and contact you within 3-5 business days.',
      data: application,
    };
  }

  /**
   * Get public volunteers
   * GET /api/volunteers
   * Legacy: /api/volunteers (same)
   */
  @Get()
  async getPublicVolunteers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.volunteersService.getVolunteers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status: status || 'active',
      search,
    });
    return { data: result.data, total: result.total };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @Get('volunteers')
  async getPublicVolunteersLegacy(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.getPublicVolunteers(page, limit, status, search);
  }

  /**
   * Get volunteer by slug
   * GET /api/volunteers/:slug
   * Legacy: /api/volunteers/:slug (same)
   */
  @Get(':slug')
  async getPublicVolunteer(@Param('slug') slug: string) {
    const volunteer = await this.volunteersService.getVolunteerBySlug(slug);
    return { data: volunteer };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @Get('volunteers/:slug')
  async getPublicVolunteerLegacy(@Param('slug') slug: string) {
    return this.getPublicVolunteer(slug);
  }

  // ============ ADMIN ENDPOINTS - APPLICATIONS ============

  /**
   * Get all applications (admin)
   * GET /api/volunteers/admin/applications
   * Legacy: /api/admin/volunteers/applications
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/applications')
  async getApplications(@Query() query: ApplicationQueryDto) {
    const result = await this.volunteersService.getApplications(query);
    return result;
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/applications')
  async getApplicationsLegacy(
    @Query() query: ApplicationQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0, message: 'Access denied' };
    }
    const result = await this.volunteersService.getApplications(query);
    return result;
  }

  /**
   * Get application stats (admin)
   * GET /api/volunteers/admin/applications/stats
   * Legacy: /api/admin/volunteers/applications/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/applications/stats')
  async getApplicationStats() {
    const stats = await this.volunteersService.getApplicationStats();
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/applications/stats')
  async getApplicationStatsLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: { total: 0, pending: 0, approved: 0, rejected: 0 } };
    }
    const stats = await this.volunteersService.getApplicationStats();
    return { data: stats };
  }

  /**
   * Get single application (admin)
   * GET /api/volunteers/admin/applications/:id
   * Legacy: /api/admin/volunteers/applications/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/applications/:id')
  async getApplication(@Param('id') id: string) {
    const application = await this.volunteersService.getApplicationById(
      parseInt(id, 10),
    );
    return { data: application };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/applications/:id')
  async getApplicationLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const application = await this.volunteersService.getApplicationById(
      parseInt(id, 10),
    );
    return { data: application };
  }

  /**
   * Update application status (admin)
   * PATCH /api/volunteers/admin/applications/:id/status
   * Legacy: /api/admin/volunteers/applications/:id/status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Patch('admin/applications/:id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @Request() req: any,
  ) {
    const application = await this.volunteersService.updateApplicationStatus(
      parseInt(id, 10),
      dto,
      req.user.id,
    );
    return {
      success: true,
      message: `Application ${dto.status}`,
      data: application,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/volunteers/applications/:id/status')
  async updateApplicationStatusLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can approve/reject applications',
      };
    }
    const application = await this.volunteersService.updateApplicationStatus(
      parseInt(id, 10),
      dto,
      req.user.id,
    );
    return {
      success: true,
      message: `Application ${dto.status}`,
      data: application,
    };
  }

  /**
   * Bulk update applications status (admin)
   * POST /api/volunteers/admin/applications/bulk-status
   * Legacy: /api/admin/volunteers/applications/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/applications/bulk-status')
  async bulkUpdateStatus(
    @Body() dto: BulkStatusUpdateDto,
    @Request() req: any,
  ) {
    const result = await this.volunteersService.bulkUpdateStatus(
      dto,
      req.user.id,
    );
    return {
      success: result.success,
      message: `Updated ${result.count} applications`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/volunteers/applications/bulk-status')
  async bulkUpdateStatusLegacy(
    @Body() dto: BulkStatusUpdateDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.volunteersService.bulkUpdateStatus(
      dto,
      req.user.id,
    );
    return {
      success: result.success,
      message: `Updated ${result.count} applications`,
      count: result.count,
    };
  }

  /**
   * Add note to application (admin)
   * POST /api/volunteers/admin/applications/:id/notes
   * Legacy: /api/admin/volunteers/applications/:id/notes
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post('admin/applications/:id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @Request() req: any,
  ) {
    const application = await this.volunteersService.addNote(
      parseInt(id, 10),
      dto,
      req.user.id,
    );
    return { success: true, data: application };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/volunteers/applications/:id/notes')
  async addNoteLegacy(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Access denied' };
    }
    const application = await this.volunteersService.addNote(
      parseInt(id, 10),
      dto,
      req.user.id,
    );
    return { success: true, data: application };
  }

  /**
   * Delete application (admin)
   * DELETE /api/volunteers/admin/applications/:id
   * Legacy: /api/admin/volunteers/applications/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/applications/:id')
  async deleteApplication(@Param('id') id: string) {
    await this.volunteersService.deleteApplication(parseInt(id, 10));
    return { success: true, message: 'Application deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/volunteers/applications/:id')
  async deleteApplicationLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete applications' };
    }
    await this.volunteersService.deleteApplication(parseInt(id, 10));
    return { success: true, message: 'Application deleted' };
  }

  /**
   * Export applications (admin)
   * GET /api/volunteers/admin/applications/export
   * Legacy: /api/admin/volunteers/applications/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/applications/export')
  async exportApplications(
    @Query('format') format: 'csv' | 'json',
    @Query() query: ApplicationQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.volunteersService.exportApplications(
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
      `attachment; filename="volunteer-applications-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/applications/export')
  async exportApplicationsLegacy(
    @Query('format') format: 'csv' | 'json',
    @Query() query: ApplicationQueryDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await this.volunteersService.exportApplications(
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
      `attachment; filename="volunteer-applications-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  // ============ ADMIN ENDPOINTS - VOLUNTEERS ============

  /**
   * Get all volunteers (admin)
   * GET /api/volunteers/admin/volunteers
   * Legacy: /api/admin/volunteers
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/volunteers')
  async getAdminVolunteers(@Query() query: VolunteerQueryDto) {
    const result = await this.volunteersService.getVolunteers(query);
    return result;
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers')
  async getAdminVolunteersLegacy(
    @Query() query: VolunteerQueryDto,
    @Request() req: any,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [], total: 0 };
    }
    const result = await this.volunteersService.getVolunteers(query);
    return result;
  }

  /**
   * Get volunteer stats (admin)
   * GET /api/volunteers/admin/volunteers/stats
   * Legacy: /api/admin/volunteers/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/volunteers/stats')
  async getVolunteerStats() {
    const stats = await this.volunteersService.getVolunteerStats();
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/stats')
  async getVolunteerStatsLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: { total: 0, active: 0, inactive: 0 } };
    }
    const stats = await this.volunteersService.getVolunteerStats();
    return { data: stats };
  }

  /**
   * Get volunteer roles (admin)
   * GET /api/volunteers/admin/volunteers/roles
   * Legacy: /api/admin/volunteers/roles
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/volunteers/roles')
  async getVolunteerRoles() {
    const roles = await this.volunteersService.getVolunteerRoles();
    return { data: roles };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/roles')
  async getVolunteerRolesLegacy(@Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: [] };
    }
    const roles = await this.volunteersService.getVolunteerRoles();
    return { data: roles };
  }

  /**
   * Get single volunteer (admin)
   * GET /api/volunteers/admin/volunteers/:id
   * Legacy: /api/admin/volunteers/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/volunteers/:id')
  async getVolunteer(@Param('id') id: string) {
    const volunteer = await this.volunteersService.getVolunteerById(
      parseInt(id, 10),
    );
    return { data: volunteer };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/:id')
  async getVolunteerLegacy(@Param('id') id: string, @Request() req: any) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return { data: null, message: 'Access denied' };
    }
    const volunteer = await this.volunteersService.getVolunteerById(
      parseInt(id, 10),
    );
    return { data: volunteer };
  }

  /**
   * Create volunteer (admin)
   * POST /api/volunteers/admin/volunteers
   * Legacy: /api/admin/volunteers
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/volunteers')
  async createVolunteer(@Body() dto: CreateVolunteerDto, @Request() req: any) {
    const volunteer = await this.volunteersService.createVolunteer(
      dto,
      req.user?.id,
    );
    return { success: true, data: volunteer };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/volunteers')
  async createVolunteerLegacy(
    @Body() dto: CreateVolunteerDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can create volunteers' };
    }
    const volunteer = await this.volunteersService.createVolunteer(
      dto,
      req.user?.id,
    );
    return { success: true, data: volunteer };
  }

  /**
   * Create volunteer from application (admin)
   * POST /api/volunteers/admin/volunteers/from-application/:id
   * Legacy: /api/admin/volunteers/from-application/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/volunteers/from-application/:id')
  async createVolunteerFromApplication(
    @Param('id') id: string,
    @Body() dto: CreateVolunteerFromApplicationDto,
    @Request() req: any,
  ) {
    const volunteer =
      await this.volunteersService.createVolunteerFromApplicationDto(
        { ...dto, applicationId: parseInt(id, 10) },
        req.user?.id,
      );
    return { success: true, data: volunteer };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/volunteers/from-application/:id')
  async createVolunteerFromApplicationLegacy(
    @Param('id') id: string,
    @Body() dto: CreateVolunteerFromApplicationDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can create volunteers from applications',
      };
    }
    const volunteer =
      await this.volunteersService.createVolunteerFromApplicationDto(
        { ...dto, applicationId: parseInt(id, 10) },
        req.user?.id,
      );
    return { success: true, data: volunteer };
  }

  /**
   * Update volunteer (admin)
   * PATCH /api/volunteers/admin/volunteers/:id
   * Legacy: /api/admin/volunteers/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Patch('admin/volunteers/:id')
  async updateVolunteer(
    @Param('id') id: string,
    @Body() dto: UpdateVolunteerDto,
    @Request() req: any,
  ) {
    const volunteer = await this.volunteersService.updateVolunteer(
      parseInt(id, 10),
      dto,
      req.user?.id,
    );
    return { success: true, data: volunteer };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/volunteers/:id')
  async updateVolunteerLegacy(
    @Param('id') id: string,
    @Body() dto: UpdateVolunteerDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can update volunteers' };
    }
    const volunteer = await this.volunteersService.updateVolunteer(
      parseInt(id, 10),
      dto,
      req.user?.id,
    );
    return { success: true, data: volunteer };
  }

  /**
   * Delete volunteer (admin)
   * DELETE /api/volunteers/admin/volunteers/:id
   * Legacy: /api/admin/volunteers/:id
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/volunteers/:id')
  async deleteVolunteer(@Param('id') id: string) {
    await this.volunteersService.deleteVolunteer(parseInt(id, 10));
    return { success: true, message: 'Volunteer deleted' };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/volunteers/:id')
  async deleteVolunteerLegacy(@Param('id') id: string, @Request() req: any) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return { success: false, message: 'Only admins can delete volunteers' };
    }
    await this.volunteersService.deleteVolunteer(parseInt(id, 10));
    return { success: true, message: 'Volunteer deleted' };
  }

  /**
   * Bulk update volunteers status (admin)
   * POST /api/volunteers/admin/volunteers/bulk-status
   * Legacy: /api/admin/volunteers/bulk-status
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/volunteers/bulk-status')
  async bulkUpdateVolunteerStatus(
    @Body() dto: BulkVolunteerStatusDto,
    @Request() req: any,
  ) {
    const result = await this.volunteersService.bulkUpdateVolunteerStatus(
      dto,
      req.user?.id,
    );
    return {
      success: result.success,
      message: `Updated ${result.count} volunteers`,
      count: result.count,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/volunteers/bulk-status')
  async bulkUpdateVolunteerStatusLegacy(
    @Body() dto: BulkVolunteerStatusDto,
    @Request() req: any,
  ) {
    if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
      return {
        success: false,
        message: 'Only admins can perform bulk actions',
      };
    }
    const result = await this.volunteersService.bulkUpdateVolunteerStatus(
      dto,
      req.user?.id,
    );
    return {
      success: result.success,
      message: `Updated ${result.count} volunteers`,
      count: result.count,
    };
  }

  /**
   * Export volunteers (admin)
   * GET /api/volunteers/admin/volunteers/export
   * Legacy: /api/admin/volunteers/export
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/volunteers/export')
  async exportVolunteers(
    @Query('format') format: 'csv' | 'json',
    @Query() query: VolunteerQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.volunteersService.exportVolunteers(
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
      `attachment; filename="volunteers-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/volunteers/export')
  async exportVolunteersLegacy(
    @Query('format') format: 'csv' | 'json',
    @Query() query: VolunteerQueryDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await this.volunteersService.exportVolunteers(
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
      `attachment; filename="volunteers-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }
}
