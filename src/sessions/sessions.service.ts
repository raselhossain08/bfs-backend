import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { randomBytes, createHash } from 'crypto';

interface CreateSessionParams {
    userId: number;
    accessToken: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
}

interface ParsedUserAgent {
    browser: string;
    os: string;
    deviceName: string;
}

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectRepository(Session)
        private sessionRepository: Repository<Session>,
    ) {}

    private parseUserAgent(userAgent: string): ParsedUserAgent {
        const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s]?(\d+)?/i);
        const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)[\/\s]?(\d+\.?\d*)?/i);
        const mobileMatch = userAgent.match(/Mobile|iPhone|iPad|Android/i);

        return {
            browser: browserMatch ? `${browserMatch[1]} ${browserMatch[2] || ''}`.trim() : 'Unknown Browser',
            os: osMatch ? `${osMatch[1]} ${osMatch[2] || ''}`.trim() : 'Unknown OS',
            deviceName: mobileMatch ? 'Mobile Device' : 'Desktop',
        };
    }

    async createSession(params: CreateSessionParams): Promise<Session> {
        const { userId, accessToken, refreshToken, ipAddress, userAgent } = params;

        const parsedUA = this.parseUserAgent(userAgent || '');

        const session = this.sessionRepository.create({
            userId,
            token: createHash('sha256').update(accessToken).digest('hex'),
            refreshToken: createHash('sha256').update(refreshToken).digest('hex'),
            ipAddress,
            userAgent,
            browser: parsedUA.browser,
            os: parsedUA.os,
            deviceName: parsedUA.deviceName,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        const saved = await this.sessionRepository.save(session);
        this.logger.log(`Session created for user ${userId} from ${ipAddress}`);

        return saved;
    }

    async getActiveSessions(userId: number): Promise<Session[]> {
        return this.sessionRepository.find({
            where: { userId, isRevoked: false },
            order: { createdAt: 'DESC' },
        });
    }

    async getAllSessions(options: { page?: number; limit?: number } = {}): Promise<{ data: Session[]; total: number }> {
        const { page = 1, limit = 50 } = options;

        const [data, total] = await this.sessionRepository.findAndCount({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async revokeSession(sessionId: number, userId: number): Promise<{ success: boolean; message: string }> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });

        if (!session) {
            return { success: false, message: 'Session not found' };
        }

        if (session.userId !== userId) {
            return { success: false, message: 'Not authorized to revoke this session' };
        }

        session.isRevoked = true;
        session.revokedAt = new Date();

        await this.sessionRepository.save(session);
        this.logger.log(`Session ${sessionId} revoked for user ${userId}`);

        return { success: true, message: 'Session revoked successfully' };
    }

    async revokeAllOtherSessions(userId: number, currentToken: string): Promise<{ success: boolean; count: number }> {
        const hashedToken = createHash('sha256').update(currentToken).digest('hex');

        const result = await this.sessionRepository.update(
            { userId, isRevoked: false, token: { $ne: hashedToken } as any },
            { isRevoked: true, revokedAt: new Date() }
        );

        this.logger.log(`All other sessions revoked for user ${userId}`);

        return { success: true, count: result.affected || 0 };
    }

    async cleanupExpiredSessions(): Promise<number> {
        const result = await this.sessionRepository
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now: new Date() })
            .orWhere('isRevoked = :revoked AND revokedAt < :expiredDate', {
                revoked: true,
                expiredDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            })
            .execute();

        this.logger.log(`Cleaned up ${result.affected} expired sessions`);

        return result.affected || 0;
    }
}