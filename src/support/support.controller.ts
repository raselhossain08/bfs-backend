import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Ip,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupportService } from './support.service';
import { ChatMessage, MessageSender } from './entities/chat-message.entity';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ============================================
  // PUBLIC ENDPOINTS (No Auth Required)
  // ============================================

  /**
   * Anonymous chat - Start a new session or continue existing
   * Creates a session ID that can be used for subsequent messages
   */
  @Post('chat/anonymous/start')
  async startAnonymousSession(
    @Body('sessionId') sessionId?: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const session = await this.supportService.getOrCreateAnonymousSession(
      sessionId,
      { ip, userAgent },
    );
    return { data: session };
  }

  /**
   * Anonymous chat - Send message without auth
   * Uses sessionId from body or header to identify the user
   */
  @Post('chat/anonymous/send')
  async sendAnonymousMessage(
    @Body() body: { sessionId: string; message: string },
  ) {
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return { error: 'sessionId and message are required' };
    }

    // Validate session exists
    const session = await this.supportService.getAnonymousSession(sessionId);
    if (!session) {
      return { error: 'Invalid session. Please start a new chat.' };
    }

    // Save user message
    const userMessage = await this.supportService.saveAnonymousMessage(
      sessionId,
      message,
      MessageSender.USER,
    );

    // Get bot response
    const botResponse = await this.supportService.getBotResponse(message, null);

    // Save bot response
    const botMessage = await this.supportService.saveAnonymousMessage(
      sessionId,
      botResponse,
      MessageSender.BOT,
    );

    return {
      data: {
        userMessage,
        botMessage,
      },
    };
  }

  /**
   * Anonymous chat - Get chat history by session ID
   */
  @Get('chat/anonymous/history/:sessionId')
  async getAnonymousHistory(@Param('sessionId') sessionId: string) {
    const session = await this.supportService.getAnonymousSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    const messages =
      await this.supportService.getAnonymousChatHistory(sessionId);
    return { data: messages };
  }

  // ============================================
  // AUTHENTICATED USER ENDPOINTS
  // ============================================

  // Chat Endpoints
  @UseGuards(AuthGuard('jwt'))
  @Get('chat/history')
  async getChatHistory(@Request() req) {
    const messages = await this.supportService.getChatHistory(req.user.userId);
    return { data: messages.reverse() };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('chat/send')
  async sendMessage(@Request() req, @Body('message') message: string) {
    // Save user message
    const savedMessage = await this.supportService.saveMessage(
      req.user.userId,
      message,
      MessageSender.USER,
    );

    // Get bot response
    const botResponse = await this.supportService.getBotResponse(
      message,
      req.user.userId,
    );

    // Save bot response
    const botMessage = await this.supportService.saveMessage(
      req.user.userId,
      botResponse,
      MessageSender.BOT,
    );

    return {
      data: {
        userMessage: savedMessage,
        botMessage: botMessage,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('chat/read')
  async markMessagesAsRead(@Request() req) {
    await this.supportService.markMessagesAsRead(req.user.userId);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('chat/unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.supportService.getUnreadCount(req.user.userId);
    return { data: { count } };
  }

  // Ticket Endpoints
  @UseGuards(AuthGuard('jwt'))
  @Post('tickets')
  async createTicket(
    @Request() req,
    @Body() ticketData: Partial<SupportTicket>,
  ) {
    const ticket = await this.supportService.createTicket(
      req.user.userId,
      ticketData,
    );
    return { data: ticket };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tickets')
  async getTickets(@Request() req) {
    const tickets = await this.supportService.getTickets(req.user.userId);
    return { data: tickets };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tickets/:id')
  async getTicketById(@Request() req, @Param('id') id: string) {
    const ticket = await this.supportService.getTicketById(
      parseInt(id, 10),
      req.user.userId,
    );
    if (!ticket) {
      return { error: 'Ticket not found' };
    }
    return { data: ticket };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tickets/:id/replies')
  async getUserTicketReplies(@Request() req, @Param('id') id: string) {
    // First verify the ticket belongs to the user
    const ticket = await this.supportService.getTicketById(
      parseInt(id, 10),
      req.user.userId,
    );
    if (!ticket) {
      return { error: 'Ticket not found' };
    }
    const replies = await this.supportService.getTicketReplies(
      parseInt(id, 10),
    );
    return { data: replies };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tickets/:id/replies')
  async addUserTicketReply(
    @Request() req,
    @Param('id') id: string,
    @Body('message') message: string,
  ) {
    // First verify the ticket belongs to the user
    const ticket = await this.supportService.getTicketById(
      parseInt(id, 10),
      req.user.userId,
    );
    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    // Don't allow replies to closed tickets
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return { error: 'Cannot reply to a closed ticket' };
    }

    const reply = await this.supportService.addTicketReply(
      parseInt(id, 10),
      message,
      req.user.userId,
      'user',
    );
    return { data: reply };
  }

  // ============================================
  // ADMIN ENDPOINTS (Require Auth)
  // ============================================

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/tickets')
  async getAllTickets(@Query('status') status?: string) {
    const tickets = await this.supportService.getAllTickets(
      status as TicketStatus | undefined,
    );
    return { data: tickets };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/sessions')
  async getAllChatSessions() {
    const sessions = await this.supportService.getAllChatSessions();
    return { data: sessions };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/unread-messages')
  async getUnreadMessages() {
    const messages = await this.supportService.getUnreadMessages();
    return { data: messages };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/messages/:userId')
  async getMessagesByUserId(@Param('userId') userId: string) {
    const messages = await this.supportService.getMessagesByUserId(
      parseInt(userId, 10),
    );
    return { data: messages };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/anonymous-sessions')
  async getAnonymousSessions() {
    const sessions = await this.supportService.getAllAnonymousSessions();
    return { data: sessions };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/anonymous-messages/:sessionId')
  async getAnonymousMessages(@Param('sessionId') sessionId: string) {
    const messages =
      await this.supportService.getAnonymousChatHistory(sessionId);
    return { data: messages };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    const ticket = await this.supportService.updateTicketStatus(
      parseInt(id, 10),
      status,
    );
    return { data: ticket };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/tickets/:id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body('adminId') adminId: number,
  ) {
    const ticket = await this.supportService.assignTicket(
      parseInt(id, 10),
      adminId,
    );
    return { data: ticket };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/tickets/:id/notes')
  async addTicketNote(@Param('id') id: string, @Body('notes') notes: string) {
    const ticket = await this.supportService.addTicketNote(
      parseInt(id, 10),
      notes,
    );
    return { data: ticket };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/chat/reply')
  async adminReply(@Body() body: { userId: number; message: string }) {
    const message = await this.supportService.saveMessage(
      body.userId,
      body.message,
      MessageSender.SUPPORT,
    );
    return { data: message };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/chat/anonymous/reply')
  async adminReplyAnonymous(
    @Body() body: { sessionId: string; message: string },
  ) {
    const message = await this.supportService.saveAnonymousMessage(
      body.sessionId,
      body.message,
      MessageSender.SUPPORT,
    );
    return { data: message };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/ticket-reply')
  async replyToTicket(
    @Body() body: { ticketId: number; message: string },
    @Request() req,
  ) {
    const adminId = req.user.userId || req.user.id;
    const reply = await this.supportService.addTicketReply(
      body.ticketId,
      body.message,
      adminId,
      'admin',
    );
    return { data: reply };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/tickets/:id/replies')
  async getTicketReplies(@Param('id') id: string) {
    const replies = await this.supportService.getTicketReplies(
      parseInt(id, 10),
    );
    return { data: replies };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  async getTicketStats() {
    const stats = await this.supportService.getTicketStats();
    return { data: stats };
  }
}
