import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Program } from './entities/program.entity';
import { ProgramCategory } from './entities/program-category.entity';
import {
  CreateProgramDto,
  UpdateProgramDto,
  ProgramQueryDto,
  BulkProgramStatusDto,
  ReorderProgramsDto,
  CreateProgramCategoryDto,
  UpdateProgramCategoryDto,
  ProgramCategoryQueryDto,
  ReorderProgramCategoriesDto,
  UpdateProgramsSectionDto,
} from './dto/programs.dto';

// In-memory section config (will be persisted)
let sectionConfig = {
  badgeText: 'OUR PROGRAMS',
  title: 'Our Programs',
  titleHighlight: 'Making A Difference',
  subtitle: 'Discover our programs creating positive change in communities.',
};

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(ProgramCategory)
    private categoryRepository: Repository<ProgramCategory>,
  ) {}

  // ============ TRANSFORMATION ============

  transformProgram(program: Program) {
    const progress = this.calculateProgress(program.raised, program.goal);

    return {
      id: program.id,
      title: program.title,
      slug: program.slug,
      shortDescription: program.shortDescription || '',
      description: program.description || '',
      content: program.content || '',
      image: program.image || '',
      gallery: program.gallery || [],
      icon: program.icon || '',
      color: program.color || '',
      category: program.category || '',
      location: program.location || '',
      beneficiaries: program.beneficiaries || '',
      impact: program.impact || '',
      metric: program.metric || '',
      goal: program.goal || 0,
      raised: program.raised || 0,
      progress,
      startDate: program.startDate,
      endDate: program.endDate,
      milestones: program.milestones || [],
      videoUrl: program.videoUrl || '',
      videoType: program.videoType || '',
      contentBlocks: program.contentBlocks || [],
      status: program.status,
      isFeatured: program.isFeatured || false,
      order: program.order || 0,
      views: program.views || 0,
      metaTitle: program.metaTitle || '',
      metaDescription: program.metaDescription || '',
      metaKeywords: program.metaKeywords || '',
      seo: {
        metaTitle: program.metaTitle || program.title,
        metaDescription:
          program.metaDescription ||
          program.shortDescription ||
          program.description,
        keywords: (() => {
          if (Array.isArray(program.metaKeywords)) return program.metaKeywords;
          if (
            typeof program.metaKeywords === 'string' &&
            program.metaKeywords
          ) {
            return (program.metaKeywords as string)
              .split(',')
              .map((k: string) => k.trim());
          }
          return [];
        })(),
      },
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  private calculateProgress(raised: number, goal: number): number {
    if (!raised || !goal || goal === 0) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }

  // ============ PROGRAM CRUD ============

  async findAll(query: ProgramQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = 'order',
      sortOrder = 'ASC',
    } = query;

    const skip = (page - 1) * limit;
    const qb = this.programRepository.createQueryBuilder('program');

    if (status && status !== 'all') {
      qb.andWhere('program.status = :status', { status });
    }
    if (category) {
      qb.andWhere('program.category ILIKE :category', {
        category: `%${category}%`,
      });
    }
    if (search) {
      qb.andWhere(
        '(program.title ILIKE :search OR program.description ILIKE :search OR program.category ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`program.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((p) => this.transformProgram(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(query: { limit?: number; category?: string }) {
    const { limit = 50, category } = query;
    const qb = this.programRepository
      .createQueryBuilder('program')
      .where('program.status = :status', { status: 'active' });

    if (category) {
      qb.andWhere('program.category ILIKE :category', {
        category: `%${category}%`,
      });
    }

    qb.orderBy('program.order', 'ASC').take(limit);
    const data = await qb.getMany();
    return data.map((p) => this.transformProgram(p));
  }

  async findBySlug(slug: string) {
    const program = await this.programRepository.findOne({ where: { slug } });
    if (!program) {
      throw new NotFoundException(`Program with slug '${slug}' not found`);
    }
    await this.programRepository.increment({ id: program.id }, 'views', 1);
    program.views += 1;
    return this.transformProgram(program);
  }

  async findOne(id: number): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }
    return program;
  }

  async create(dto: CreateProgramDto): Promise<Program> {
    const slug = dto.slug || this.generateSlug(dto.title);

    const existing = await this.programRepository.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `Program with slug '${slug}' already exists`,
      );
    }

    const program = this.programRepository.create({
      ...dto,
      slug,
      status: dto.status || 'active',
      raised: dto.raised || 0,
      goal: dto.goal || 0,
    });
    return this.programRepository.save(program);
  }

  async update(id: number, dto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOne(id);

    if (dto.slug && dto.slug !== program.slug) {
      const existing = await this.programRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          `Program with slug '${dto.slug}' already exists`,
        );
      }
    }

    Object.assign(program, dto);
    return this.programRepository.save(program);
  }

  async remove(id: number): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);
  }

  async bulkStatus(dto: BulkProgramStatusDto) {
    await this.programRepository
      .createQueryBuilder()
      .update(Program)
      .set({ status: dto.status })
      .where('id IN (:...ids)', { ids: dto.ids })
      .execute();
    return { updated: dto.ids.length };
  }

  async reorder(dto: ReorderProgramsDto) {
    for (const item of dto.orders) {
      await this.programRepository.update(item.id, { order: item.order });
    }
    return { reordered: dto.orders.length };
  }

  // ============ CATEGORY MANAGEMENT ============

  async createCategory(
    dto: CreateProgramCategoryDto,
  ): Promise<ProgramCategory> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `Category with slug '${slug}' already exists`,
      );
    }

    const category = this.categoryRepository.create({
      ...dto,
      slug,
      status: dto.status || 'active',
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(query: ProgramCategoryQueryDto) {
    const { page = 1, limit = 50, status, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.categoryRepository.createQueryBuilder('category');

    if (status && status !== 'all') {
      qb.andWhere('category.status = :status', { status });
    }
    if (search) {
      qb.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('category.order', 'ASC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveCategories(): Promise<ProgramCategory[]> {
    return this.categoryRepository.find({
      where: { status: 'active' },
      order: { order: 'ASC' },
    });
  }

  async findOneCategory(id: number): Promise<ProgramCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async updateCategory(
    id: number,
    dto: UpdateProgramCategoryDto,
  ): Promise<ProgramCategory> {
    const category = await this.findOneCategory(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          `Category with slug '${dto.slug}' already exists`,
        );
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.findOneCategory(id);

    // Check if any programs are using this category
    const programsCount = await this.programRepository.count({
      where: { category: category.name },
    });

    if (programsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. ${programsCount} programs are using this category.`,
      );
    }

    await this.categoryRepository.remove(category);
  }

  async reorderCategories(dto: ReorderProgramCategoriesDto) {
    for (const item of dto.orders) {
      await this.categoryRepository.update(item.id, { order: item.order });
    }
    return { reordered: dto.orders.length };
  }

  // ============ STATS ============

  async getStats() {
    const total = await this.programRepository.count();
    const active = await this.programRepository.count({
      where: { status: 'active' },
    });
    const completed = await this.programRepository.count({
      where: { status: 'completed' },
    });
    const pending = await this.programRepository.count({
      where: { status: 'pending' },
    });
    const onHold = await this.programRepository.count({
      where: { status: 'on-hold' },
    });
    const draft = await this.programRepository.count({
      where: { status: 'draft' },
    });
    const featured = await this.programRepository.count({
      where: { isFeatured: true },
    });
    const totalViews = await this.programRepository
      .createQueryBuilder('program')
      .select('SUM(program.views)', 'sum')
      .getRawOne();

    const totalRaised = await this.programRepository
      .createQueryBuilder('program')
      .select('SUM(program.raised)', 'sum')
      .getRawOne();

    const totalGoal = await this.programRepository
      .createQueryBuilder('program')
      .select('SUM(program.goal)', 'sum')
      .getRawOne();

    return {
      total,
      active,
      completed,
      pending,
      onHold,
      draft,
      featured,
      totalViews: parseInt(totalViews?.sum || '0'),
      totalRaised: parseFloat(totalRaised?.sum || '0'),
      totalGoal: parseFloat(totalGoal?.sum || '0'),
      overallProgress: this.calculateProgress(
        parseFloat(totalRaised?.sum || '0'),
        parseFloat(totalGoal?.sum || '0'),
      ),
    };
  }

  // ============ SECTION CONFIG ============

  getSectionConfig() {
    return sectionConfig;
  }

  updateSectionConfig(dto: UpdateProgramsSectionDto) {
    sectionConfig = {
      ...sectionConfig,
      ...dto,
    };
    return sectionConfig;
  }

  // ============ HELPERS ============

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
