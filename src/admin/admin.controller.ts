import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateAdminDto,
  UpdateAdminDto,
  UpdateRoleDto,
  UpdateStatusDto,
  AdminListQueryDto,
  BulkUpdateDto,
  BulkDeleteDto,
} from './admin.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  // Helper to check if user has admin role
  private isAdmin(user: any): boolean {
    return ['super_admin', 'admin', 'editor', 'manager'].includes(user.role);
  }

  // Helper to check if user is super admin
  private isSuperAdmin(user: any): boolean {
    return user.role === 'super_admin';
  }

  // Get all admin users
  @Get('users')
  async findAll(@Request() req: any, @Query() query: AdminListQueryDto) {
    if (!this.isAdmin(req.user)) {
      return { data: [] };
    }
    const users = await this.adminService.findAll(query);
    return { data: users };
  }

  // Get admin user statistics
  @Get('users/stats')
  async getStats(@Request() req: any) {
    if (!this.isAdmin(req.user)) {
      return {
        data: {
          total: 0,
          superAdmins: 0,
          admins: 0,
          editors: 0,
          managers: 0,
          donors: 0,
          active: 0,
        },
      };
    }
    const stats = await this.adminService.getStats();
    return { data: stats };
  }

  // Export users
  @Get('users/export')
  async exportUsers(
    @Request() req: any,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    if (!this.isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can export users',
      });
    }

    const result = await this.adminService.exportUsers(
      format,
      req.user.id,
      req,
    );

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Role',
        'Status',
        'Phone',
        'Last Active',
        'Created At',
      ];
      const csvRows = [headers.join(',')];

      for (const user of result.data) {
        const row = [
          user.id,
          user.firstName,
          user.lastName,
          user.email,
          user.role,
          user.status,
          user.phone || '',
          user.lastActive ? new Date(user.lastActive).toISOString() : '',
          user.createdAt ? new Date(user.createdAt).toISOString() : '',
        ]
          .map((val) => `"${val}"`)
          .join(',');
        csvRows.push(row);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="users-export.csv"',
      );
      return res.send(csvRows.join('\n'));
    }

    return res.json(result);
  }

  // Get single admin user by ID
  @Get('users/:id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    if (!this.isAdmin(req.user)) {
      return { data: null };
    }
    const user = await this.adminService.findOne(parseInt(id, 10));
    return { data: user };
  }

  // Create new admin user
  @Post('users')
  async create(@Request() req: any, @Body() dto: CreateAdminDto) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can create new admin users',
      };
    }

    const user = await this.adminService.create(dto, req.user.id, req);
    return {
      success: true,
      message: 'Admin user created successfully',
      data: user,
    };
  }

  // Update admin user
  @Patch('users/:id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    // Only super_admin can update, or user updating their own profile
    if (!this.isSuperAdmin(req.user) && req.user.id !== parseInt(id, 10)) {
      return {
        success: false,
        message: 'You do not have permission to update this user',
      };
    }

    const user = await this.adminService.update(
      parseInt(id, 10),
      dto,
      req.user.id,
      req,
    );
    return {
      success: true,
      message: 'Admin user updated successfully',
      data: user,
    };
  }

  // Update user role
  @Patch('users/:id/role')
  async updateRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can change user roles',
      };
    }

    // Prevent demoting yourself
    if (req.user.id === parseInt(id, 10) && dto.role !== 'super_admin') {
      return {
        success: false,
        message: 'You cannot demote yourself from super admin',
      };
    }

    const user = await this.adminService.updateRole(
      parseInt(id, 10),
      dto,
      req.user.id,
      req,
    );
    return {
      success: true,
      message: 'Role updated successfully',
      data: user,
    };
  }

  // Update user status (active/inactive)
  @Patch('users/:id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can change user status',
      };
    }

    // Prevent deactivating yourself
    if (req.user.id === parseInt(id, 10) && dto.status !== 'active') {
      return {
        success: false,
        message: 'You cannot deactivate your own account',
      };
    }

    const user = await this.adminService.updateStatus(
      parseInt(id, 10),
      dto,
      req.user.id,
      req,
    );
    return {
      success: true,
      message: 'Status updated successfully',
      data: user,
    };
  }

  // Initiate password reset for user
  @Post('users/:id/reset-password')
  async initiatePasswordReset(@Request() req: any, @Param('id') id: string) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can initiate password reset',
      };
    }

    const result = await this.adminService.initiatePasswordReset(
      parseInt(id, 10),
      req.user.id,
      req,
    );
    return result;
  }

  // Delete admin user
  @Delete('users/:id')
  async remove(@Request() req: any, @Param('id') id: string) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can remove admin users',
      };
    }

    // Prevent deleting yourself
    if (req.user.id === parseInt(id, 10)) {
      return {
        success: false,
        message: 'You cannot delete your own account',
      };
    }

    await this.adminService.remove(parseInt(id, 10), req.user.id, req);
    return {
      success: true,
      message: 'Admin user removed successfully',
    };
  }

  // ========== BULK OPERATIONS ==========

  // Bulk status update
  @Post('users/bulk/status')
  async bulkUpdateStatus(@Request() req: any, @Body() dto: BulkUpdateDto) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can perform bulk operations',
      };
    }

    // Prevent deactivating yourself in bulk
    if (dto.ids.includes(req.user.id) && dto.value !== 'active') {
      return {
        success: false,
        message: 'You cannot deactivate your own account',
      };
    }

    const result = await this.adminService.bulkUpdateStatus(
      dto.ids,
      dto.value,
      req.user.id,
      req,
    );
    return {
      success: result.success,
      message: `Successfully updated status for ${result.count} users`,
      count: result.count,
    };
  }

  // Bulk role update
  @Post('users/bulk/role')
  async bulkUpdateRole(@Request() req: any, @Body() dto: BulkUpdateDto) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can perform bulk operations',
      };
    }

    // Prevent demoting yourself in bulk
    if (dto.ids.includes(req.user.id) && dto.value !== 'super_admin') {
      return {
        success: false,
        message: 'You cannot demote yourself from super admin',
      };
    }

    const result = await this.adminService.bulkUpdateRole(
      dto.ids,
      dto.value,
      req.user.id,
      req,
    );
    return {
      success: result.success,
      message: `Successfully updated role for ${result.count} users`,
      count: result.count,
    };
  }

  // Bulk delete
  @Post('users/bulk/delete')
  async bulkDelete(@Request() req: any, @Body() dto: BulkDeleteDto) {
    if (!this.isSuperAdmin(req.user)) {
      return {
        success: false,
        message: 'Only super admins can perform bulk operations',
      };
    }

    // Prevent deleting yourself in bulk
    if (dto.ids.includes(req.user.id)) {
      return {
        success: false,
        message: 'You cannot delete your own account',
      };
    }

    const result = await this.adminService.bulkDelete(
      dto.ids,
      req.user.id,
      req,
    );
    return {
      success: result.success,
      message: `Successfully deleted ${result.count} users`,
      count: result.count,
    };
  }

  // ========== AUDIT LOGS ==========

  @Get('audit-logs')
  async getAuditLogs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!this.isAdmin(req.user)) {
      return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }

    const logs = await this.auditService.getLogs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      action,
      entityType,
      actorId: actorId ? parseInt(actorId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return logs;
  }

  @Get('audit-logs/stats')
  async getAuditLogStats(@Request() req: any) {
    if (!this.isAdmin(req.user)) {
      return { data: null };
    }

    // Get counts by action type
    const actionCounts = await this.auditService.getRecentActivityStats();

    return { data: actionCounts };
  }
}
