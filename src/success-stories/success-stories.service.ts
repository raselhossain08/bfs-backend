import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SuccessStory } from './entities/success-story.entity';
import {
  CreateSuccessStoryDto,
  UpdateSuccessStoryDto,
  SuccessStoryQueryDto,
  BulkSuccessStoryStatusDto,
  ReorderSuccessStoriesDto,
} from './dto/success-story.dto';

@Injectable()
export class SuccessStoriesService {
  private readonly logger = new Logger(SuccessStoriesService.name);

  constructor(
    @InjectRepository(SuccessStory)
    private successStoryRepository: Repository<SuccessStory>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateSuccessStoryDto): Promise<SuccessStory> {
    const slug = dto.slug || this.generateSlug(dto.title);

    // Check for duplicate slug
    const existing = await this.successStoryRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new BadRequestException(`Story with slug '${slug}' already exists`);
    }

    // Get max order
    const maxOrder = await this.successStoryRepository
      .createQueryBuilder()
      .select('MAX(order)', 'max')
      .getRawOne();

    const story = this.successStoryRepository.create({
      ...dto,
      slug,
      order: dto.order ?? (maxOrder?.max ? parseInt(maxOrder.max) + 1 : 1),
      status: dto.status || 'draft',
    });

    const saved = await this.successStoryRepository.save(story);
    this.logger.log(`Success story created: ${saved.title} (id: ${saved.id})`);
    return saved;
  }

  async findAll(query: SuccessStoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      category,
      sortBy = 'order',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [data, total] = await this.successStoryRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
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

  async findPublic() {
    return this.successStoryRepository.find({
      where: { status: 'published' },
      order: { order: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<SuccessStory> {
    const story = await this.successStoryRepository.findOne({
      where: { slug },
    });
    if (!story) {
      throw new NotFoundException(
        `Success story with slug '${slug}' not found`,
      );
    }
    return story;
  }

  async findById(id: number): Promise<SuccessStory> {
    const story = await this.successStoryRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Success story with id ${id} not found`);
    }
    return story;
  }

  async update(id: number, dto: UpdateSuccessStoryDto): Promise<SuccessStory> {
    const story = await this.findById(id);

    // If slug is being updated, check for duplicates
    if (dto.slug && dto.slug !== story.slug) {
      const existing = await this.successStoryRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Story with slug '${dto.slug}' already exists`,
        );
      }
    }

    Object.assign(story, dto);
    const saved = await this.successStoryRepository.save(story);
    this.logger.log(`Success story updated: ${saved.title} (id: ${saved.id})`);
    return saved;
  }

  async delete(id: number): Promise<void> {
    const story = await this.findById(id);
    await this.successStoryRepository.remove(story);
    this.logger.log(`Success story deleted: ${id}`);
  }

  async bulkUpdateStatus(dto: BulkSuccessStoryStatusDto) {
    const { ids, status } = dto;
    await this.successStoryRepository.update(ids, { status });
    this.logger.log(`Bulk status update: ${ids.length} stories to ${status}`);
    return { success: true, count: ids.length };
  }

  async bulkDelete(ids: number[]) {
    await this.successStoryRepository.delete(ids);
    this.logger.log(`Bulk delete: ${ids.length} stories`);
    return { success: true, count: ids.length };
  }

  async reorder(dto: ReorderSuccessStoriesDto) {
    const { orders } = dto;
    for (const item of orders) {
      await this.successStoryRepository.update(item.id, { order: item.order });
    }
    this.logger.log(`Reordered ${orders.length} stories`);
    return { success: true, count: orders.length };
  }

  async incrementViews(id: number) {
    await this.successStoryRepository.increment({ id }, 'views', 1);
  }

  async getStats() {
    const [total, published, draft] = await Promise.all([
      this.successStoryRepository.count(),
      this.successStoryRepository.count({ where: { status: 'published' } }),
      this.successStoryRepository.count({ where: { status: 'draft' } }),
    ]);

    return { total, published, draft };
  }

  async getCategories() {
    const stories = await this.successStoryRepository
      .createQueryBuilder('story')
      .select('DISTINCT story.category', 'category')
      .getRawMany();
    return stories.map((s) => s.category);
  }
}
