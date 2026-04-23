import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { ChatMessage, MessageSender, MessageSource } from './entities/chat-message.entity';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { AnonymousSession } from './entities/anonymous-session.entity';
import { TicketReply } from './entities/ticket-reply.entity';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        @InjectRepository(SupportTicket)
        private ticketRepository: Repository<SupportTicket>,
        @InjectRepository(AnonymousSession)
        private anonymousSessionRepository: Repository<AnonymousSession>,
        @InjectRepository(TicketReply)
        private ticketReplyRepository: Repository<TicketReply>,
    ) {}

    // ============================================
    // AUTHENTICATED USER METHODS
    // ============================================

    async getChatHistory(userId: number, limit: number = 50) {
        return this.chatRepository.find({
            where: { userId, source: MessageSource.AUTHENTICATED },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async saveMessage(userId: number, message: string, sender: MessageSender = MessageSender.USER) {
        const chatMessage = this.chatRepository.create({
            userId,
            message,
            sender,
            source: MessageSource.AUTHENTICATED,
            isRead: sender !== MessageSender.USER,
        });
        return this.chatRepository.save(chatMessage);
    }

    async markMessagesAsRead(userId: number) {
        await this.chatRepository.update(
            { userId, isRead: false, sender: In([MessageSender.SUPPORT, MessageSender.BOT]), source: MessageSource.AUTHENTICATED },
            { isRead: true }
        );
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.chatRepository.count({
            where: { userId, isRead: false, sender: In([MessageSender.SUPPORT, MessageSender.BOT]), source: MessageSource.AUTHENTICATED }
        });
    }

    // ============================================
    // ANONYMOUS SESSION METHODS
    // ============================================

    async getOrCreateAnonymousSession(sessionId?: string, metadata?: { ip?: string; userAgent?: string }) {
        // If session ID provided, try to find existing
        if (sessionId) {
            const existing = await this.anonymousSessionRepository.findOne({
                where: { sessionId, isActive: true }
            });
            if (existing) {
                return existing;
            }
        }

        // Create new session
        const newSessionId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session = this.anonymousSessionRepository.create({
            sessionId: newSessionId,
            ipAddress: metadata?.ip,
            userAgent: metadata?.userAgent,
            isActive: true,
        });
        return this.anonymousSessionRepository.save(session);
    }

    async getAnonymousSession(sessionId: string) {
        return this.anonymousSessionRepository.findOne({
            where: { sessionId, isActive: true }
        });
    }

    async saveAnonymousMessage(sessionId: string, message: string, sender: MessageSender) {
        const chatMessage = this.chatRepository.create({
            sessionId,
            message,
            sender,
            source: MessageSource.ANONYMOUS,
            isRead: sender !== MessageSender.USER,
        });
        return this.chatRepository.save(chatMessage);
    }

    async getAnonymousChatHistory(sessionId: string) {
        return this.chatRepository.find({
            where: { sessionId, source: MessageSource.ANONYMOUS },
            order: { createdAt: 'ASC' },
        });
    }

    async getAllAnonymousSessions() {
        try {
            const sessions = await this.anonymousSessionRepository.find({
                order: { updatedAt: 'DESC' },
                take: 100,
            });
            return sessions;
        } catch (error) {
            console.error('Error fetching anonymous sessions:', error);
            return [];
        }
    }

    // ============================================
    // BOT RESPONSE LOGIC
    // ============================================

    async getBotResponse(message: string, userId: number | null): Promise<string> {
        const lowerMessage = message.toLowerCase();

        // Greeting patterns
        if (/\b(hello|hi|hey|greetings)\b/.test(lowerMessage)) {
            return "Hello! Welcome to Birdsfly Support. How can I assist you today?";
        }

        // Payment related
        if (/\b(payment|pay|card|billing|charge|refund)\b/.test(lowerMessage)) {
            return "For payment-related queries, you can:\n\n1. Update your payment methods in the Payments section\n2. Download receipts from My Donations\n3. Contact us if you see unauthorized charges\n\nWould you like me to connect you with a human agent?";
        }

        // Donation related
        if (/\b(donation|donate|give|contribute|receipt|tax)\b/.test(lowerMessage)) {
            return "I can help with donation questions:\n\n- View your donation history in 'My Donations'\n- Download tax receipts from there\n- Set up recurring donations in the Recurring section\n- All donations are tax-deductible\n\nIs there something specific about your donations I can help with?";
        }

        // Account related
        if (/\b(account|profile|password|login|email|settings)\b/.test(lowerMessage)) {
            return "For account issues:\n\n1. Go to Settings to update your profile\n2. Use the password reset feature if needed\n3. Update your email preferences there\n\nNeed help with something specific?";
        }

        // Campaign/Cause related
        if (/\b(campaign|cause|project|fund|goal)\b/.test(lowerMessage)) {
            return "You can explore all our active campaigns in the Causes section. Each campaign shows:\n- Progress toward the goal\n- Impact stories\n- How your donation helps\n\nWould you like recommendations based on your interests?";
        }

        // Recurring donations
        if (/\b(recurring|monthly|weekly|subscription|automatic)\b/.test(lowerMessage)) {
            return "To manage recurring donations:\n\n1. Go to 'My Donations' → Recurring tab\n2. You can pause, edit, or cancel anytime\n3. You'll receive reminders before each donation\n\nWould you like help setting one up?";
        }

        // Impact related
        if (/\b(impact|where.*money|how.*help|difference|effect)\b/.test(lowerMessage)) {
            return "Your impact matters! Visit the Impact section to see:\n- Total amount donated\n- Campaigns you've supported\n- Success stories from the field\n- Your personal milestones\n\nEvery donation makes a real difference!";
        }

        // Technical issues
        if (/\b(error|bug|issue|problem|not working|broken|fail)\b/.test(lowerMessage)) {
            return "I'm sorry you're experiencing technical issues. Let me help:\n\n1. Try refreshing the page\n2. Clear your browser cache\n3. Check your internet connection\n\nIf the issue persists, I can escalate this to our technical team. Would you like me to create a support ticket?";
        }

        // Escalation requests
        if (/\b(human|agent|person|support|help|talk|speak|representative)\b/.test(lowerMessage)) {
            return "I understand you'd like to speak with a human agent. Let me connect you. In the meantime, please describe your issue in detail so our team can assist you better.";
        }

        // Thank you responses
        if (/\b(thank|thanks|appreciate)\b/.test(lowerMessage)) {
            return "You're welcome! Is there anything else I can help you with today?";
        }

        // Goodbye
        if (/\b(bye|goodbye|see you|later|exit)\b/.test(lowerMessage)) {
            return "Thank you for chatting with us! Have a wonderful day, and thank you for supporting our cause!";
        }

        // Default response
        return "Thank you for your message. I'm not sure I understand completely. Could you provide more details? Or if you prefer, I can connect you with a human support agent who can assist you better.";
    }

    // ============================================
    // TICKET METHODS
    // ============================================

    async createTicket(userId: number, ticketData: Partial<SupportTicket>) {
        const ticket = this.ticketRepository.create({
            ...ticketData,
            userId,
            status: TicketStatus.OPEN,
        });
        return this.ticketRepository.save(ticket);
    }

    async getTickets(userId: number) {
        return this.ticketRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getTicketById(ticketId: number, userId: number) {
        return this.ticketRepository.findOne({
            where: { id: ticketId, userId },
        });
    }

    async updateTicketStatus(ticketId: number, status: TicketStatus) {
        await this.ticketRepository.update(ticketId, { status });
        return this.ticketRepository.findOne({ where: { id: ticketId } });
    }

    // ============================================
    // ADMIN METHODS
    // ============================================

    async getAllTickets(status?: TicketStatus) {
        const where: any = {};
        if (status) {
            where.status = status;
        }
        return this.ticketRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async getAllChatSessions() {
        // Simple query without complex conditions for debugging
        const sessions = await this.chatRepository.find({
            where: { source: MessageSource.AUTHENTICATED },
            order: { createdAt: 'DESC' },
            take: 100,
        });
        
        // Group by userId manually
        const grouped = sessions.reduce((acc: any, msg: any) => {
            if (!acc[msg.userId]) {
                acc[msg.userId] = {
                    userId: msg.userId,
                    messageCount: 0,
                    lastMessageAt: msg.createdAt,
                };
            }
            acc[msg.userId].messageCount++;
            if (new Date(msg.createdAt) > new Date(acc[msg.userId].lastMessageAt)) {
                acc[msg.userId].lastMessageAt = msg.createdAt;
            }
            return acc;
        }, {});
        
        return Object.values(grouped).sort((a: any, b: any) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
    }

    async getUnreadMessages() {
        return this.chatRepository.find({
            where: { isRead: false, sender: MessageSender.USER },
            order: { createdAt: 'ASC' },
            take: 100,
        });
    }

    async getMessagesByUserId(userId: number) {
        return this.chatRepository.find({
            where: { userId, source: MessageSource.AUTHENTICATED },
            order: { createdAt: 'ASC' },
        });
    }

    async assignTicket(ticketId: number, adminId: number) {
        await this.ticketRepository.update(ticketId, {
            assignedTo: adminId,
            status: TicketStatus.IN_PROGRESS
        });
        return this.ticketRepository.findOne({ where: { id: ticketId } });
    }

    async addTicketNote(ticketId: number, notes: string) {
        await this.ticketRepository.update(ticketId, { notes });
        return this.ticketRepository.findOne({ where: { id: ticketId } });
    }

    async getTicketStats() {
        const [open, inProgress, resolved, total] = await Promise.all([
            this.ticketRepository.count({ where: { status: TicketStatus.OPEN } }),
            this.ticketRepository.count({ where: { status: TicketStatus.IN_PROGRESS } }),
            this.ticketRepository.count({ where: { status: TicketStatus.RESOLVED } }),
            this.ticketRepository.count(),
        ]);

        const unreadMessages = await this.chatRepository.count({
            where: { isRead: false, sender: MessageSender.USER }
        });

        return {
            open,
            inProgress,
            resolved,
            total,
            unreadMessages,
        };
    }

    // Ticket Reply Methods
    async addTicketReply(ticketId: number, message: string, senderId: number, senderType: 'user' | 'admin' = 'admin') {
        // Create the reply
        const reply = this.ticketReplyRepository.create({
            ticketId,
            message,
            sender: senderType,
            [senderType === 'admin' ? 'adminId' : 'userId']: senderId,
        });
        await this.ticketReplyRepository.save(reply);

        // Update ticket status to in_progress if it was open
        const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
        if (ticket && ticket.status === TicketStatus.OPEN) {
            await this.ticketRepository.update(ticketId, {
                status: TicketStatus.IN_PROGRESS,
            });
            // Only assign if admin is replying
            if (senderType === 'admin') {
                await this.ticketRepository.update(ticketId, { assignedTo: senderId });
            }
        }

        // Return the reply with sender info
        const savedReply = await this.ticketReplyRepository.findOne({
            where: { id: reply.id },
            relations: senderType === 'admin' ? ['admin'] : ['user']
        });
        
        if (!savedReply) {
            throw new Error('Failed to save reply');
        }
        
        // Format the response to match frontend expectations
        const senderName = senderType === 'admin' 
            ? (savedReply.admin ? `${savedReply.admin.firstName || ''} ${savedReply.admin.lastName || ''}`.trim() || 'Support Team' : 'Support Team')
            : (savedReply.user ? `${savedReply.user.firstName || ''} ${savedReply.user.lastName || ''}`.trim() || 'You' : 'You');
        
        return {
            id: savedReply.id,
            ticketId: savedReply.ticketId,
            message: savedReply.message,
            sender: senderType,
            senderName: senderName,
            createdAt: savedReply.createdAt,
        };
    }

    async getTicketReplies(ticketId: number) {
        return this.ticketReplyRepository.find({
            where: { ticketId },
            order: { createdAt: 'ASC' },
        });
    }
}