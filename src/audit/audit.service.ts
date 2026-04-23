import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog, AuditAction } from './audit-log.entity';

interface CreateAuditLogParams {
    action: AuditAction | string;
    entityType: string;
    entityId: number;
    actorId?: number;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
    request?: Request;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) {}

    async log(params: CreateAuditLogParams): Promise<AuditLog> {
        const { action, entityType, entityId, actorId, oldValues, newValues, description, request } = params;

        const auditLog = this.auditLogRepository.create({
            action,
            entityType,
            entityId,
            actorId,
            oldValues,
            newValues,
            description,
            ipAddress: request?.ip || request?.connection?.remoteAddress,
            userAgent: request?.headers?.['user-agent'],
        });

        const saved = await this.auditLogRepository.save(auditLog);
        this.logger.log(`Audit: ${action} on ${entityType}:${entityId} by user ${actorId || 'system'}`);

        return saved;
    }

    async getLogs(options: {
        page?: number;
        limit?: number;
        action?: string;
        entityType?: string;
        entityId?: number;
        actorId?: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { page = 1, limit = 50, action, entityType, entityId, actorId, startDate, endDate } = options;

        const query = this.auditLogRepository.createQueryBuilder('audit')
            .leftJoinAndSelect('audit.actor', 'actor')
            .orderBy('audit.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (action) {
            query.andWhere('audit.action = :action', { action });
        }

        if (entityType) {
            query.andWhere('audit.entityType = :entityType', { entityType });
        }

        if (entityId) {
            query.andWhere('audit.entityId = :entityId', { entityId });
        }

        if (actorId) {
            query.andWhere('audit.actorId = :actorId', { actorId });
        }

        if (startDate) {
            query.andWhere('audit.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
            query.andWhere('audit.createdAt <= :endDate', { endDate });
        }

        const [data, total] = await query.getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getRecentActivity(userId: number, limit: number = 10): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { actorId: userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getRecentActivityStats(): Promise<{
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        topActions: { action: string; count: number }[];
        topActors: { actorId: number; actorName: string; count: number }[];
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Get total count
        const total = await this.auditLogRepository.count();

        // Get today's count
        const todayCount = await this.auditLogRepository.count({
            where: { createdAt: { $gte: today } as any },
        });

        // Get this week's count
        const weekCount = await this.auditLogRepository.count({
            where: { createdAt: { $gte: weekAgo } as any },
        });

        // Get this month's count
        const monthCount = await this.auditLogRepository.count({
            where: { createdAt: { $gte: monthAgo } as any },
        });

        // Get top actions
        const actionCounts = await this.auditLogRepository
            .createQueryBuilder('audit')
            .select('audit.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .groupBy('audit.action')
            .orderBy('COUNT(*)', 'DESC')
            .limit(10)
            .getRawMany();

        // Get top actors
        const actorCounts = await this.auditLogRepository
            .createQueryBuilder('audit')
            .leftJoin('audit.actor', 'actor')
            .select('audit.actorId', 'actorId')
            .addSelect('CONCAT(actor.firstName, \' \', actor.lastName)', 'actorName')
            .addSelect('COUNT(*)', 'count')
            .groupBy('audit.actorId')
            .addGroupBy('actor.firstName')
            .addGroupBy('actor.lastName')
            .orderBy('COUNT(*)', 'DESC')
            .limit(10)
            .getRawMany();

        return {
            total,
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount,
            topActions: actionCounts.map((a) => ({
                action: a.action,
                count: parseInt(a.count, 10),
            })),
            topActors: actorCounts.map((a) => ({
                actorId: a.actorId,
                actorName: a.actorName || 'System',
                count: parseInt(a.count, 10),
            })),
        };
    }
}