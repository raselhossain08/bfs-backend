import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageSender } from './entities/chat-message.entity';
import { SessionStatus } from './entities/chat-session.entity';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

const envCorsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

@WebSocketGateway({
  namespace: '/chat',
  path: '/socket.io',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      ...envCorsOrigins,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    console.log('💬 Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`🔌 New socket connection attempt from: ${client.id}`);
    console.log(`   Handshake query:`, client.handshake.query);
    console.log(`   Handshake auth:`, client.handshake.auth);

    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (token) {
        try {
          const payload: JwtPayload = this.jwtService.verify(token);
          client.data.user = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          console.log(`✅ User connected: ${payload.email}`);
        } catch (jwtError) {
          console.log(
            `⚠️ JWT verification failed, treating as anonymous:`,
            jwtError.message,
          );
        }
      } else {
        // Anonymous user - generate session token
        const sessionToken = client.handshake.query?.sessionToken as string;
        if (sessionToken) {
          client.data.sessionToken = sessionToken;
          console.log(
            `🔗 Anonymous session: ${sessionToken.substring(0, 8)}...`,
          );
        }
        console.log(`ℹ️ Anonymous connection established (no token)`);
      }
    } catch (error) {
      // Allow anonymous connections without valid JWT
      console.log(`❌ Connection error:`, error.message);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.userId;
    const sessionToken = client.data.sessionToken;

    if (userId) {
      // Update agent status if they're an agent
      const agent = await this.chatService.getAgentByUserId(userId);
      if (agent) {
        await this.chatService.updateAgentStatus(userId, 'offline');
        this.broadcastAgentStatus(agent.id, 'offline');
      }
    }

    console.log(`👋 Client disconnected: ${userId || 'anonymous'}`);
  }

  // ==================== USER EVENTS ====================

  @SubscribeMessage('start_session')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageUrl?: string; userAgent?: string },
  ) {
    const userId = client.data.user?.userId;
    const sessionToken = client.data.sessionToken;

    const session = await this.chatService.startSession(userId, sessionToken, {
      pageUrl: data.pageUrl,
      userAgent: data.userAgent,
    });

    // Join the session room
    client.join(`session:${session.id}`);
    client.data.sessionId = session.id;

    // Send welcome message
    const welcomeMessage = await this.chatService.sendMessage(
      session.id,
      "Hi there! 👋 Welcome to Birdsfly Support. I'm here to help you with donations, campaigns, or any questions. How can I assist you today?",
      MessageSender.BOT,
    );

    client.emit('session_started', {
      session,
      welcomeMessage,
    });

    // Notify admins of new session
    this.server.to('admins').emit('admin:session_started', session);

    return session;
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const userId = client.data.user?.userId;
    const sessionToken = client.data.sessionToken;

    // Validate access
    const hasAccess = await this.chatService.validateSessionAccess(
      data.sessionId,
      userId,
      sessionToken,
    );

    if (!hasAccess) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    const session = await this.chatService.getSession(data.sessionId);
    const messages = await this.chatService.getMessages(data.sessionId);

    client.join(`session:${data.sessionId}`);
    client.data.sessionId = data.sessionId;

    client.emit('session_joined', { session, messages });

    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { sessionId: number; content: string; tempId?: string },
  ) {
    const userId = client.data.user?.userId;
    const sessionToken = client.data.sessionToken;

    // Validate access
    const hasAccess = await this.chatService.validateSessionAccess(
      data.sessionId,
      userId,
      sessionToken,
    );

    if (!hasAccess) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    // Save user message
    const userMessage = await this.chatService.sendMessage(
      data.sessionId,
      data.content,
      MessageSender.USER,
      userId,
    );

    // Broadcast to session room
    this.server
      .to(`session:${data.sessionId}`)
      .emit('new_message', userMessage);

    // Get session to check bot status
    const session = await this.chatService.getSession(data.sessionId);

    if (session.isBotActive) {
      // Process bot response
      const botResponse = await this.chatService.processBotMessage(
        data.sessionId,
        data.content,
      );

      // Broadcast bot response
      this.server
        .to(`session:${data.sessionId}`)
        .emit('new_message', botResponse.message);

      // If escalation needed, notify admins
      if (botResponse.shouldEscalate) {
        await this.chatService.updateSessionStatus(
          data.sessionId,
          SessionStatus.WAITING,
        );
        this.server.to('admins').emit('admin:session_waiting', {
          sessionId: data.sessionId,
          message: userMessage,
        });

        // Auto-assign agent
        await this.chatService.autoAssignAgent(data.sessionId);
      }
    }

    return userMessage;
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const userId = client.data.user?.userId;
    client.to(`session:${data.sessionId}`).emit('user_typing', { userId });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const userId = client.data.user?.userId;
    await this.chatService.markMessagesAsRead(data.sessionId, userId);
  }

  // ==================== AGENT EVENTS ====================

  @SubscribeMessage('agent:join')
  async handleAgentJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const agentId = client.data.user?.userId;

    if (!agentId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    // Verify agent
    const agent = await this.chatService.getAgentByUserId(agentId);
    if (!agent) {
      client.emit('error', { message: 'Not an agent' });
      return;
    }

    // Assign agent to session
    await this.chatService.assignAgentToSession(data.sessionId, agentId);
    client.join(`session:${data.sessionId}`);

    // Notify user that agent joined
    const agentInfo = await this.chatService.getAgentInfo(agentId);
    this.server.to(`session:${data.sessionId}`).emit('agent_joined', agentInfo);

    return { success: true };
  }

  @SubscribeMessage('agent:send_message')
  async handleAgentSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number; content: string },
  ) {
    const agentId = client.data.user?.userId;

    if (!agentId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    const message = await this.chatService.sendMessage(
      data.sessionId,
      data.content,
      MessageSender.AGENT,
      agentId,
    );

    this.server.to(`session:${data.sessionId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('agent:typing')
  async handleAgentTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const agentId = client.data.user?.userId;
    const agentInfo = await this.chatService.getAgentInfo(agentId);
    client.to(`session:${data.sessionId}`).emit('agent_typing', agentInfo);
  }

  @SubscribeMessage('agent:update_status')
  async handleAgentUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: 'online' | 'busy' | 'away' | 'offline' },
  ) {
    const agentId = client.data.user?.userId;
    const agent = await this.chatService.updateAgentStatus(
      agentId,
      data.status,
    );

    if (agent) {
      this.broadcastAgentStatus(agent.id, data.status);
    }

    return agent;
  }

  @SubscribeMessage('agent:resolve_session')
  async handleResolveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const agentId = client.data.user?.userId;

    await this.chatService.updateSessionStatus(
      data.sessionId,
      SessionStatus.RESOLVED,
    );
    this.server
      .to(`session:${data.sessionId}`)
      .emit('session_resolved', { sessionId: data.sessionId });
    this.server
      .to('admins')
      .emit('admin:session_resolved', { sessionId: data.sessionId });

    return { success: true };
  }

  // ==================== ADMIN EVENTS ====================

  @SubscribeMessage('admin:join')
  async handleAdminJoin(@ConnectedSocket() client: Socket) {
    const role = client.data.user?.role;

    if (role !== 'admin' && role !== 'super_admin') {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    client.join('admins');

    // Send current stats
    const stats = await this.chatService.getAdminStats();
    client.emit('admin:stats', stats);

    return { success: true };
  }

  @SubscribeMessage('admin:assign_agent')
  async handleAdminAssignAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number; agentId: number },
  ) {
    const role = client.data.user?.role;

    if (role !== 'admin' && role !== 'super_admin') {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    await this.chatService.assignAgentToSession(data.sessionId, data.agentId);

    // Notify the agent
    const agentInfo = await this.chatService.getAgentInfo(data.agentId);
    this.server.to(`session:${data.sessionId}`).emit('agent_joined', agentInfo);
    this.server.to('admins').emit('admin:agent_assigned', {
      sessionId: data.sessionId,
      agent: agentInfo,
    });

    return { success: true };
  }

  // ==================== HELPER METHODS ====================

  private broadcastAgentStatus(agentId: number, status: string) {
    this.server.to('admins').emit('agent_status_changed', { agentId, status });
  }
}
