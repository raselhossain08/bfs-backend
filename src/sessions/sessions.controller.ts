import { Controller, Get, Delete, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(AuthGuard('jwt'))
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) {}

    @Get()
    async getMySessions(@Request() req: any) {
        const sessions = await this.sessionsService.getActiveSessions(req.user.id);
        return { data: sessions };
    }

    @Get('all')
    async getAllSessions(
        @Request() req: any,
        @Param('page') page?: string,
        @Param('limit') limit?: string,
    ) {
        // Only admin roles can view all sessions
        const userRole = req.user?.role;
        if (!['super_admin', 'admin'].includes(userRole)) {
            return { data: [], message: 'Access denied' };
        }

        const result = await this.sessionsService.getAllSessions({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });

        return result;
    }

    @Delete(':id')
    async revokeSession(
        @Request() req: any,
        @Param('id') sessionId: string,
    ) {
        const result = await this.sessionsService.revokeSession(
            parseInt(sessionId, 10),
            req.user.id
        );
        return result;
    }

    @Delete('all/others')
    async revokeAllOtherSessions(@Request() req: any) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return { success: false, message: 'No token provided' };
        }

        const result = await this.sessionsService.revokeAllOtherSessions(req.user.id, token);
        return result;
    }
}