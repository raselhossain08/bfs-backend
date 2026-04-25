import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedCampaign } from './entities/saved-campaign.entity';
import { Cause } from '../causes/entities/cause.entity';

interface SaveCampaignDto {
  causeId: number;
  notifyOnGoal?: boolean;
  notifyOnUpdate?: boolean;
  notes?: string;
  folder?: string;
}

interface UpdateSavedCampaignDto {
  notifyOnGoal?: boolean;
  notifyOnUpdate?: boolean;
  notes?: string;
  folder?: string;
}

@Injectable()
export class SavedCampaignsService {
  private readonly logger = new Logger(SavedCampaignsService.name);

  constructor(
    @InjectRepository(SavedCampaign)
    private savedCampaignRepository: Repository<SavedCampaign>,
    @InjectRepository(Cause)
    private causeRepository: Repository<Cause>,
  ) {}

  async saveCampaign(
    userId: number,
    dto: SaveCampaignDto,
  ): Promise<SavedCampaign> {
    // Check if cause exists
    const cause = await this.causeRepository.findOne({
      where: { id: dto.causeId },
    });
    if (!cause) {
      throw new NotFoundException('Cause not found');
    }

    // Check if already saved
    const existing = await this.savedCampaignRepository.findOne({
      where: { userId, causeId: dto.causeId },
    });

    if (existing) {
      throw new ConflictException('Campaign already saved');
    }

    const savedCampaign = this.savedCampaignRepository.create({
      userId,
      causeId: dto.causeId,
      notifyOnGoal: dto.notifyOnGoal ?? false,
      notifyOnUpdate: dto.notifyOnUpdate ?? false,
      notes: dto.notes,
      folder: dto.folder,
    });

    const result = await this.savedCampaignRepository.save(savedCampaign);
    this.logger.log(`User ${userId} saved campaign ${dto.causeId}`);
    return result;
  }

  async getUserSavedCampaigns(
    userId: number,
    options?: { folder?: string },
  ): Promise<SavedCampaign[]> {
    const query = this.savedCampaignRepository
      .createQueryBuilder('saved')
      .leftJoinAndSelect('saved.cause', 'cause')
      .where('saved.userId = :userId', { userId });

    if (options?.folder) {
      query.andWhere('saved.folder = :folder', { folder: options.folder });
    }

    query.orderBy('saved.savedAt', 'DESC');

    return query.getMany();
  }

  async updateSavedCampaign(
    userId: number,
    causeId: number,
    dto: UpdateSavedCampaignDto,
  ): Promise<SavedCampaign> {
    const savedCampaign = await this.savedCampaignRepository.findOne({
      where: { userId, causeId },
    });

    if (!savedCampaign) {
      throw new NotFoundException('Saved campaign not found');
    }

    Object.assign(savedCampaign, dto);
    return this.savedCampaignRepository.save(savedCampaign);
  }

  async removeSavedCampaign(
    userId: number,
    causeId: number,
  ): Promise<{ success: boolean }> {
    const result = await this.savedCampaignRepository.delete({
      userId,
      causeId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Saved campaign not found');
    }

    this.logger.log(`User ${userId} removed campaign ${causeId} from saved`);
    return { success: true };
  }

  async bulkRemove(
    userId: number,
    causeIds: number[],
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.savedCampaignRepository
      .createQueryBuilder()
      .delete()
      .from(SavedCampaign)
      .where('userId = :userId', { userId })
      .andWhere('causeId IN (:...causeIds)', { causeIds })
      .execute();

    return { success: true, count: result.affected || 0 };
  }

  async getSavedCampaignsCount(userId: number): Promise<number> {
    return this.savedCampaignRepository.count({ where: { userId } });
  }

  async getFolders(userId: number): Promise<string[]> {
    const results = await this.savedCampaignRepository
      .createQueryBuilder('saved')
      .select('DISTINCT saved.folder', 'folder')
      .where('saved.userId = :userId', { userId })
      .andWhere('saved.folder IS NOT NULL')
      .getRawMany();

    return results.map((r) => r.folder).filter(Boolean);
  }

  async getCampaignsNearGoal(
    userId: number,
    threshold: number = 80,
  ): Promise<SavedCampaign[]> {
    // Get saved campaigns where cause progress is near goal
    const savedCampaigns = await this.savedCampaignRepository
      .createQueryBuilder('saved')
      .leftJoinAndSelect('saved.cause', 'cause')
      .where('saved.userId = :userId', { userId })
      .getMany();

    return savedCampaigns.filter((sc) => {
      if (!sc.cause) return false;
      const progress =
        sc.cause.goal > 0 ? (sc.cause.raised / sc.cause.goal) * 100 : 0;
      return progress >= threshold && progress < 100;
    });
  }

  async checkIfSaved(userId: number, causeId: number): Promise<boolean> {
    const count = await this.savedCampaignRepository.count({
      where: { userId, causeId },
    });
    return count > 0;
  }
}
