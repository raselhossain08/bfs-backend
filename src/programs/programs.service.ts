import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import {
    CreateProgramDto,
    UpdateProgramDto,
    ProgramQueryDto,
    BulkProgramStatusDto,
    ReorderProgramsDto,
} from './dto/programs.dto';

@Injectable()
export class ProgramsService {
    constructor(
        @InjectRepository(Program)
        private programRepository: Repository<Program>,
    ) {}

    transformProgram(program: Program) {
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
                metaDescription: program.metaDescription || program.shortDescription || program.description,
                keywords: program.metaKeywords ? program.metaKeywords.split(',').map(k => k.trim()) : [],
            },
            createdAt: program.createdAt,
            updatedAt: program.updatedAt,
        };
    }

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
            qb.andWhere('program.category ILIKE :category', { category: `%${category}%` });
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
            data: data.map(p => this.transformProgram(p)),
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
            qb.andWhere('program.category ILIKE :category', { category: `%${category}%` });
        }

        qb.orderBy('program.order', 'ASC').take(limit);
        const data = await qb.getMany();
        return data.map(p => this.transformProgram(p));
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
            throw new BadRequestException(`Program with slug '${slug}' already exists`);
        }

        const program = this.programRepository.create({
            ...dto,
            slug,
            status: dto.status || 'active',
        });
        return this.programRepository.save(program);
    }

    async update(id: number, dto: UpdateProgramDto): Promise<Program> {
        const program = await this.findOne(id);

        if (dto.slug && dto.slug !== program.slug) {
            const existing = await this.programRepository.findOne({ where: { slug: dto.slug } });
            if (existing) {
                throw new BadRequestException(`Program with slug '${dto.slug}' already exists`);
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

    async getStats() {
        const total = await this.programRepository.count();
        const active = await this.programRepository.count({ where: { status: 'active' } });
        const completed = await this.programRepository.count({ where: { status: 'completed' } });
        const pending = await this.programRepository.count({ where: { status: 'pending' } });
        const onHold = await this.programRepository.count({ where: { status: 'on-hold' } });
        const featured = await this.programRepository.count({ where: { isFeatured: true } });
        const totalViews = await this.programRepository
            .createQueryBuilder('program')
            .select('SUM(program.views)', 'sum')
            .getRawOne();

        return {
            total,
            active,
            completed,
            pending,
            onHold,
            featured,
            totalViews: parseInt(totalViews?.sum || '0'),
        };
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}