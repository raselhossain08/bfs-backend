import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Page } from './entities/page.entity';
import { Section } from './entities/section.entity';
import {
  CreatePageDto,
  UpdatePageDto,
  PageQueryDto,
  BulkPageStatusDto,
  ReorderPagesDto,
  CreateSectionDto,
  UpdateSectionDto,
  ReorderSectionsDto,
} from './pages.dto';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  // ============ PAGE METHODS ============

  async createPage(dto: CreatePageDto): Promise<Page> {
    // Check for duplicate slug
    const existing = await this.pageRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Page with slug '${dto.slug}' already exists`,
      );
    }

    const page = this.pageRepository.create({
      ...dto,
      status: dto.status || 'published',
      order: dto.order || 0,
    });

    const saved = await this.pageRepository.save(page);
    this.logger.log(`Page created: ${saved.title} (id: ${saved.id})`);

    return this.findOnePage(saved.id);
  }

  async findAllPages(query: PageQueryDto) {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      type = 'all',
      search,
      sortBy = 'order',
      sortOrder = 'ASC',
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.sections', 'section');

    // Apply filters
    if (status !== 'all') {
      queryBuilder.andWhere('page.status = :status', { status });
    }

    if (type !== 'all') {
      queryBuilder.andWhere('page.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(page.title ILIKE :search OR page.description ILIKE :search OR page.slug ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`page.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicPages(): Promise<Page[]> {
    return this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.sections', 'section')
      .where('page.status = :status', { status: 'published' })
      .orderBy('page.order', 'ASC')
      .addOrderBy('section.order', 'ASC')
      .getMany();
  }

  async findOnePage(id: number): Promise<Page> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['sections'],
    });

    if (!page) {
      throw new NotFoundException(`Page with id ${id} not found`);
    }

    // Sort sections by order
    page.sections = page.sections.sort((a, b) => a.order - b.order);

    return page;
  }

  async findPageBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.sections', 'section')
      .where('page.slug = :slug', { slug })
      .andWhere('page.status = :status', { status: 'published' })
      .orderBy('section.order', 'ASC')
      .getOne();

    if (!page) {
      throw new NotFoundException(`Page with slug '${slug}' not found`);
    }

    return page;
  }

  async updatePage(id: number, dto: UpdatePageDto): Promise<Page> {
    const page = await this.findOnePage(id);

    // Check for duplicate slug if slug is being changed
    if (dto.slug && dto.slug !== page.slug) {
      const existing = await this.pageRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          `Page with slug '${dto.slug}' already exists`,
        );
      }
    }

    Object.assign(page, dto);
    const saved = await this.pageRepository.save(page);
    this.logger.log(`Page updated: ${saved.title} (id: ${saved.id})`);

    return this.findOnePage(saved.id);
  }

  async removePage(id: number): Promise<{ success: boolean }> {
    const page = await this.findOnePage(id);
    await this.pageRepository.remove(page);
    this.logger.log(`Page deleted: ${page.title} (id: ${id})`);

    return { success: true };
  }

  async bulkUpdatePageStatus(
    dto: BulkPageStatusDto,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.pageRepository.update(
      { id: In(dto.ids) },
      { status: dto.status },
    );

    this.logger.log(
      `Bulk status update: ${result.affected} pages set to ${dto.status}`,
    );

    return { success: true, count: result.affected || 0 };
  }

  async reorderPages(dto: ReorderPagesDto): Promise<{ success: boolean }> {
    for (let i = 0; i < dto.ids.length; i++) {
      await this.pageRepository.update(dto.ids[i], { order: i });
    }

    this.logger.log(`Pages reordered: ${dto.ids.length} pages`);
    return { success: true };
  }

  async getPageStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    static: number;
    dynamic: number;
  }> {
    const [total, published, draft, staticPages, dynamicPages] =
      await Promise.all([
        this.pageRepository.count(),
        this.pageRepository.count({ where: { status: 'published' } }),
        this.pageRepository.count({ where: { status: 'draft' } }),
        this.pageRepository.count({ where: { type: 'static' } }),
        this.pageRepository.count({ where: { type: 'dynamic' } }),
      ]);

    return {
      total,
      published,
      draft,
      static: staticPages,
      dynamic: dynamicPages,
    };
  }

  // ============ SECTION METHODS ============

  async createSection(pageId: number, dto: CreateSectionDto): Promise<Section> {
    // Verify page exists
    const page = await this.findOnePage(pageId);

    const section = this.sectionRepository.create({
      ...dto,
      pageId,
      status: dto.status || 'published',
      order: dto.order || 0,
    });

    const saved = await this.sectionRepository.save(section);
    this.logger.log(
      `Section created: ${saved.name} for page ${page.title} (id: ${saved.id})`,
    );

    return saved;
  }

  async findSectionsByPageId(pageId: number): Promise<Section[]> {
    return this.sectionRepository.find({
      where: { pageId },
      order: { order: 'ASC' },
    });
  }

  async findOneSection(id: number): Promise<Section> {
    const section = await this.sectionRepository.findOne({
      where: { id },
      relations: ['page'],
    });

    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }

    return section;
  }

  async updateSection(id: number, dto: UpdateSectionDto): Promise<Section> {
    const section = await this.findOneSection(id);
    Object.assign(section, dto);
    const saved = await this.sectionRepository.save(section);
    this.logger.log(`Section updated: ${saved.name} (id: ${saved.id})`);

    return saved;
  }

  async removeSection(id: number): Promise<{ success: boolean }> {
    const section = await this.findOneSection(id);
    await this.sectionRepository.remove(section);
    this.logger.log(`Section deleted: ${section.name} (id: ${id})`);

    return { success: true };
  }

  async bulkUpdateSectionStatus(
    ids: number[],
    status: string,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.sectionRepository.update(
      { id: In(ids) },
      { status },
    );

    return { success: true, count: result.affected || 0 };
  }

  async reorderSections(
    dto: ReorderSectionsDto,
  ): Promise<{ success: boolean }> {
    for (let i = 0; i < dto.ids.length; i++) {
      await this.sectionRepository.update(dto.ids[i], { order: i });
    }

    this.logger.log(`Sections reordered: ${dto.ids.length} sections`);
    return { success: true };
  }
}
