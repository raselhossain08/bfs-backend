import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { ChatSession, SessionStatus } from './entities/chat-session.entity';
import { ChatMessageEntity, MessageSender } from './entities/chat-message.entity';
import { ChatAgent, AgentStatus } from './entities/chat-agent.entity';
import { ChatAnalytics } from './entities/chat-analytics.entity';
import { BotService, BotResponse } from './bot/bot.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatSession)
        private sessionRepo: Repository<ChatSession>,
        @InjectRepository(ChatMessageEntity)
        private messageRepo: Repository<ChatMessageEntity>,
        @InjectRepository(ChatAgent)
        private agentRepo: Repository<ChatAgent>,
        @InjectRepository(ChatAnalytics)
        private analyticsRepo: Repository<ChatAnalytics>,
        private botService: BotService,
    ) {}

    // ==================== SESSION METHODS ====================

    async startSession(userId?: number, sessionToken?: string, metadata?: any) {
        // Generate session token if not provided
        if (!sessionToken) {
            sessionToken = randomBytes(32).toString('hex');
        }

        const session = this.sessionRepo.create({
            userId,
            sessionToken,
            status: SessionStatus.ACTIVE,
            isBotActive: true,
            metadata: {
                pageUrl: metadata?.pageUrl,
                userAgent: metadata?.userAgent,
            },
            lastActivityAt: new Date(),
        });

        return this.sessionRepo.save(session);
    }

    async getSession(sessionId: number) {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['user', 'assignedAgent'],
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return session;
    }

    async getSessionByToken(sessionToken: string) {
        return this.sessionRepo.findOne({
            where: { sessionToken },
            relations: ['user', 'assignedAgent'],
        });
    }

    async validateSessionAccess(sessionId: number, userId?: number, sessionToken?: string): Promise<boolean> {
        const session = await this.sessionRepo.findOne({ where: { id: sessionId } });

        if (!session) {
            return false;
        }

        // Check if user owns the session
        if (userId && session.userId === userId) {
            return true;
        }

        // Check if session token matches (for anonymous users)
        if (sessionToken && session.sessionToken === sessionToken) {
            return true;
        }

        // Check if user is assigned agent
        if (userId && session.assignedAgentId === userId) {
            return true;
        }

        return false;
    }

    async updateSessionStatus(sessionId: number, status: SessionStatus) {
        await this.sessionRepo.update(sessionId, {
            status,
            endedAt: status === SessionStatus.CLOSED || status === SessionStatus.RESOLVED
                ? new Date()
                : undefined,
        });
        return this.getSession(sessionId);
    }

    // ==================== MESSAGE METHODS ====================

    async sendMessage(sessionId: number, content: string, sender: MessageSender, senderId?: number) {
        const message = this.messageRepo.create({
            sessionId,
            content,
            sender,
            userId: senderId,
            isRead: sender !== MessageSender.USER,
        });

        // Update session last activity
        await this.sessionRepo.update(sessionId, { lastActivityAt: new Date() });

        return this.messageRepo.save(message);
    }

    async getMessages(sessionId: number, limit: number = 100) {
        return this.messageRepo.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }

    async markMessagesAsRead(sessionId: number, userId?: number) {
        await this.messageRepo.update(
            {
                sessionId,
                isRead: false,
                sender: In([MessageSender.BOT, MessageSender.AGENT]),
            },
            { isRead: true }
        );
    }

    // ==================== BOT METHODS ====================

    async processBotMessage(sessionId: number, userMessage: string): Promise<{ message: ChatMessageEntity; shouldEscalate: boolean }> {
        const botResponse: BotResponse = await this.botService.processMessage(userMessage);

        const message = await this.sendMessage(
            sessionId,
            botResponse.content,
            MessageSender.BOT,
        );

        return {
            message,
            shouldEscalate: botResponse.shouldEscalate,
        };
    }

    // ==================== AGENT METHODS ====================

    async getAgentByUserId(userId: number) {
        return this.agentRepo.findOne({
            where: { userId },
            relations: ['user'],
        });
    }

    async getAgentInfo(userId: number) {
        const agent = await this.agentRepo.findOne({
            where: { userId },
            relations: ['user'],
        });

        if (!agent) {
            return null;
        }

        return {
            id: agent.id,
            userId: agent.userId,
            name: `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim() || 'Agent',
            email: agent.user?.email,
            avatar: agent.user?.avatar,
            status: agent.status,
            activeChats: agent.activeChats,
        };
    }

    async updateAgentStatus(userId: number, status: AgentStatus | 'online' | 'busy' | 'away' | 'offline') {
        let agent = await this.agentRepo.findOne({ where: { userId } });

        if (!agent) {
            // Create agent if doesn't exist
            agent = this.agentRepo.create({
                userId,
                status: status as AgentStatus,
            });
        } else {
            agent.status = status as AgentStatus;
            if (status === 'online') {
                agent.lastOnlineAt = new Date();
            }
        }

        return this.agentRepo.save(agent);
    }

    async assignAgentToSession(sessionId: number, agentId: number) {
        // Update session
        await this.sessionRepo.update(sessionId, {
            assignedAgentId: agentId,
            isBotActive: false,
            status: SessionStatus.ACTIVE,
        });

        // Increment agent's active chats
        await this.agentRepo.update(
            { userId: agentId },
            { activeChats: () => 'active_chats + 1' }
        );

        return this.getSession(sessionId);
    }

    async autoAssignAgent(sessionId: number) {
        // Get online agents sorted by active chats (ascending)
        const agents = await this.agentRepo.find({
            where: { status: AgentStatus.ONLINE },
            order: { activeChats: 'ASC' },
        });

        // Find first available agent
        const availableAgent = agents.find(a => a.activeChats < a.maxChats);

        if (availableAgent) {
            return this.assignAgentToSession(sessionId, availableAgent.userId);
        }

        return null;
    }

    async getOnlineAgents() {
        return this.agentRepo.find({
            where: { status: In([AgentStatus.ONLINE, AgentStatus.BUSY]) },
            relations: ['user'],
        });
    }

    // ==================== ADMIN METHODS ====================

    async getAllSessions(status?: SessionStatus) {
        const query = this.sessionRepo
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.user', 'user')
            .leftJoinAndSelect('session.assignedAgent', 'agent')
            .orderBy('session.lastActivityAt', 'DESC');

        if (status) {
            query.where('session.status = :status', { status });
        }

        return query.getMany();
    }

    async getAdminStats() {
        const [activeSessions, waitingSessions, onlineAgents, unreadMessages] = await Promise.all([
            this.sessionRepo.count({ where: { status: SessionStatus.ACTIVE } }),
            this.sessionRepo.count({ where: { status: SessionStatus.WAITING } }),
            this.agentRepo.count({ where: { status: AgentStatus.ONLINE } }),
            this.messageRepo.count({ where: { isRead: false, sender: MessageSender.USER } }),
        ]);

        return {
            activeSessions,
            waitingSessions,
            onlineAgents,
            unreadMessages,
        };
    }

    async getSessionWithMessages(sessionId: number) {
        const session = await this.getSession(sessionId);
        const messages = await this.getMessages(sessionId);

        return { session, messages };
    }

    // ==================== ANALYTICS METHODS ====================

    async submitFeedback(sessionId: number, rating: number, feedback?: string) {
        const session = await this.getSession(sessionId);

        const analytics = this.analyticsRepo.create({
            sessionId,
            satisfactionRating: rating,
            feedbackText: feedback,
            wasEscalated: !session.isBotActive,
        });

        return this.analyticsRepo.save(analytics);
    }

    async getSessionAnalytics(sessionId: number) {
        return this.analyticsRepo.findOne({
            where: { sessionId },
        });
    }
}