import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Only allow admin roles to view audit logs
    const userRole = req.user?.role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      return { data: [], total: 0, message: 'Access denied' };
    }

    const result = await this.auditService.getLogs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      action,
      entityType,
      entityId: entityId ? parseInt(entityId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return result;
  }

  @Get('user/:id')
  async getUserActivity(
    @Request() req: any,
    @Param('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    // Only allow admin roles or the user themselves
    const userRole = req.user?.role;
    const currentUserId = req.user?.id;
    const targetUserId = parseInt(userId, 10);

    if (
      !['super_admin', 'admin'].includes(userRole) &&
      currentUserId !== targetUserId
    ) {
      return { data: [], message: 'Access denied' };
    }

    const data = await this.auditService.getRecentActivity(
      targetUserId,
      limit ? parseInt(limit, 10) : 10,
    );

    return { data };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    // Only allow admin roles to view stats
    const userRole = req.user?.role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      return { data: null, message: 'Access denied' };
    }

    const stats = await this.auditService.getRecentActivityStats();
    return { data: stats };
  }
}
