import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { SubmitFeedbackDto } from './dto/chat.dto';
import { SessionStatus } from './entities/chat-session.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Post('session/start')
  async startSession(@Body() body: { pageUrl?: string; userAgent?: string }) {
    const session = await this.chatService.startSession(undefined, undefined, {
      pageUrl: body.pageUrl,
      userAgent: body.userAgent,
    });
    return { data: session };
  }

  @Get('session/:token')
  async getSessionByToken(@Param('token') token: string) {
    const session = await this.chatService.getSessionByToken(token);
    if (!session) {
      return { error: 'Session not found' };
    }
    return { data: session };
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @UseGuards(AuthGuard('jwt'))
  @Post('session/authenticated')
  async startAuthenticatedSession(@Request() req) {
    const session = await this.chatService.startSession(req.user.userId);
    return { data: session };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('session/:id/messages')
  async getMessages(@Request() req, @Param('id') id: string) {
    const messages = await this.chatService.getMessages(parseInt(id, 10));
    return { data: messages };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('feedback')
  async submitFeedback(@Request() req, @Body() dto: SubmitFeedbackDto) {
    const analytics = await this.chatService.submitFeedback(
      dto.sessionId,
      dto.rating,
      dto.feedback,
    );
    return { data: analytics };
  }

  // ==================== AGENT ENDPOINTS ====================

  @UseGuards(AuthGuard('jwt'))
  @Get('agent/me')
  async getAgentInfo(@Request() req) {
    const agent = await this.chatService.getAgentInfo(req.user.userId);
    return { data: agent };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('agent/status')
  async updateAgentStatus(
    @Request() req,
    @Body('status') status: 'online' | 'busy' | 'away' | 'offline',
  ) {
    const agent = await this.chatService.updateAgentStatus(
      req.user.userId,
      status,
    );
    return { data: agent };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('agent/sessions')
  async getAgentSessions(@Request() req) {
    // Get sessions assigned to this agent
    const sessions = await this.chatService.getAllSessions();
    const agentSessions = sessions.filter(
      (s) => s.assignedAgentId === req.user.userId,
    );
    return { data: agentSessions };
  }

  // ==================== ADMIN ENDPOINTS ====================

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/sessions')
  async getAllSessions(
    @Request() req,
    @Query('status') status?: SessionStatus,
  ) {
    // Role check
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const sessions = await this.chatService.getAllSessions(status);
    return { data: sessions };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/sessions/:id')
  async getSessionDetails(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const sessionData = await this.chatService.getSessionWithMessages(
      parseInt(id, 10),
    );
    return { data: sessionData };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/assign')
  async assignAgent(
    @Request() req,
    @Body('sessionId') sessionId: number,
    @Body('agentId') agentId: number,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const session = await this.chatService.assignAgentToSession(
      sessionId,
      agentId,
    );
    return { data: session };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/sessions/:id/status')
  async updateSessionStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: SessionStatus,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const session = await this.chatService.updateSessionStatus(
      parseInt(id, 10),
      status,
    );
    return { data: session };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  async getAdminStats(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const stats = await this.chatService.getAdminStats();
    return { data: stats };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/agents')
  async getOnlineAgents(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return { error: 'Admin access required' };
    }

    const agents = await this.chatService.getOnlineAgents();
    return { data: agents };
  }

  // ==================== QUICK ACTIONS ====================

  @Get('quick-actions')
  async getQuickActions() {
    const actions = this.chatService['botService'].getQuickActions();
    return { data: actions };
  }
}
