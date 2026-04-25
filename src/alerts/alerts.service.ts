import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { AlertTemplate } from './entities/alert-template.entity';
import { AlertBroadcast } from './entities/alert-broadcast.entity';
import {
  CreateAlertTemplateDto,
  UpdateAlertTemplateDto,
  BroadcastAlertDto,
  AlertTemplateQueryDto,
  AlertBroadcastQueryDto,
} from './dto/alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertTemplate)
    private alertTemplateRepository: Repository<AlertTemplate>,
    @InjectRepository(AlertBroadcast)
    private alertBroadcastRepository: Repository<AlertBroadcast>,
  ) {}

  // Template methods
  async createTemplate(dto: CreateAlertTemplateDto): Promise<AlertTemplate> {
    const template = this.alertTemplateRepository.create(dto);
    const saved = await this.alertTemplateRepository.save(template);
    this.logger.log(`Alert template created: ${saved.title} (id: ${saved.id})`);
    return saved;
  }

  async findAllTemplates(query: AlertTemplateQueryDto) {
    const where: any = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.title = Like(`%${query.search}%`);
    }

    return this.alertTemplateRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findTemplateById(id: number): Promise<AlertTemplate> {
    const template = await this.alertTemplateRepository.findOne({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Alert template with id ${id} not found`);
    }
    return template;
  }

  async updateTemplate(
    id: number,
    dto: UpdateAlertTemplateDto,
  ): Promise<AlertTemplate> {
    const template = await this.findTemplateById(id);
    Object.assign(template, dto);
    const saved = await this.alertTemplateRepository.save(template);
    this.logger.log(`Alert template updated: ${saved.title} (id: ${saved.id})`);
    return saved;
  }

  async deleteTemplate(id: number): Promise<void> {
    const template = await this.findTemplateById(id);
    await this.alertTemplateRepository.remove(template);
    this.logger.log(`Alert template deleted: ${id}`);
  }

  // Broadcast methods
  async createBroadcast(
    dto: BroadcastAlertDto,
    userId: string,
  ): Promise<AlertBroadcast> {
    const broadcast = this.alertBroadcastRepository.create({
      ...dto,
      audience: dto.audience || ['volunteers'],
      sentBy: userId,
      sentAt: new Date(),
    });
    const saved = await this.alertBroadcastRepository.save(broadcast);
    this.logger.log(`Alert broadcast created: ${saved.id}`);
    return saved;
  }

  async findAllBroadcasts(query: AlertBroadcastQueryDto) {
    const { page = 1, limit = 10, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.message = Like(`%${search}%`);
    }

    if (startDate && endDate) {
      where.sentAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.alertBroadcastRepository.findAndCount({
      where,
      order: { sentAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [
      totalBroadcasts,
      totalRecipients,
      volunteerCount,
      donorCount,
      lastBroadcast,
    ] = await Promise.all([
      this.alertBroadcastRepository.count(),
      this.alertBroadcastRepository
        .createQueryBuilder('broadcast')
        .select('SUM(broadcast.sentCount)', 'total')
        .getRawOne(),
      this.alertBroadcastRepository
        .createQueryBuilder('broadcast')
        .where(':audience = ANY(broadcast.audience)', {
          audience: 'volunteers',
        })
        .getCount(),
      this.alertBroadcastRepository
        .createQueryBuilder('broadcast')
        .where(':audience = ANY(broadcast.audience)', { audience: 'donors' })
        .getCount(),
      this.alertBroadcastRepository.findOne({
        where: {},
        order: { sentAt: 'DESC' },
      }),
    ]);

    return {
      totalBroadcasts,
      totalRecipients: parseInt(totalRecipients?.total || '0', 10),
      volunteerRecipients: volunteerCount,
      donorRecipients: donorCount,
      lastBroadcast,
    };
  }

  async updateBroadcastStats(
    id: number,
    sentCount: number,
    failedCount: number,
  ): Promise<void> {
    await this.alertBroadcastRepository.update(id, {
      sentCount,
      failedCount,
    });
  }

  async exportBroadcasts(
    format: 'csv' | 'json',
    query: AlertBroadcastQueryDto,
  ) {
    const { data } = await this.findAllBroadcasts({ ...query, limit: 10000 });

    if (format === 'json') {
      return data;
    }

    // CSV format
    const headers = [
      'ID',
      'Message',
      'Audience',
      'Recipients',
      'Sent',
      'Failed',
      'Sent At',
      'Sent By',
    ];
    const rows = data.map((b) => [
      b.id,
      `"${b.message?.substring(0, 100).replace(/"/g, '""')}"`,
      `"${(b.audience || []).join(', ')}"`,
      b.recipientCount,
      b.sentCount,
      b.failedCount,
      b.sentAt?.toISOString() || '',
      b.sentBy || '',
    ]);

    return { headers: headers.join(','), rows: rows.map((r) => r.join(',')) };
  }
}
