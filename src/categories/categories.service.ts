import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { Article } from '../articles/entities/article.entity';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryQueryDto,
    ReorderCategoriesDto,
    BulkStatusDto,
} from './categories.dto';

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Article)
        private articleRepository: Repository<Article>,
    ) {}

    async create(dto: CreateCategoryDto): Promise<Category> {
        // Check for duplicate slug
        const existingSlug = await this.categoryRepository.findOne({
            where: { slug: dto.slug },
        });

        if (existingSlug) {
            throw new BadRequestException(`Category with slug '${dto.slug}' already exists`);
        }

        // Check for duplicate name
        const existingName = await this.categoryRepository.findOne({
            where: { name: dto.name },
        });

        if (existingName) {
            throw new BadRequestException(`Category with name '${dto.name}' already exists`);
        }

        // Validate parent exists if parentId is provided
        if (dto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new NotFoundException(`Parent category with id ${dto.parentId} not found`);
            }
        }

        // Auto-generate SEO tags if not provided
        const categoryData = {
            ...dto,
            metaTitle: dto.metaTitle || this.generateMetaTitle(dto.name, dto.parentId),
            metaDescription: dto.metaDescription || this.generateMetaDescription(dto.description, dto.name),
            keywords: dto.keywords || this.generateKeywords(dto.name, dto.description),
            status: dto.status || 'active',
            order: dto.order ?? 0,
        };

        const category = this.categoryRepository.create(categoryData);

        const saved = await this.categoryRepository.save(category);
        this.logger.log(`Category created: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    private generateMetaTitle(name: string, parentId?: number): string {
        const baseTitle = `${name} - BFS Category`;
        return baseTitle.length > 60 ? baseTitle.substring(0, 57) + '...' : baseTitle;
    }

    private generateMetaDescription(description: string | undefined, name: string): string {
        if (description && description.length > 50) {
            return description.length > 160 ? description.substring(0, 157) + '...' : description;
        }
        return `Explore ${name} category on BFS. Discover articles, insights, and resources related to ${name.toLowerCase()}.`;
    }

    private generateKeywords(name: string, description?: string): string[] {
        const baseKeywords = [name.toLowerCase(), 'bfs', 'category', name.toLowerCase().replace(/\s+/g, '-')];
        
        // Extract additional keywords from description
        if (description) {
            const words = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            const uniqueWords = [...new Set(words)].slice(0, 5);
            baseKeywords.push(...uniqueWords);
        }
        
        return [...new Set(baseKeywords)].slice(0, 10);
    }

    async findAll(query: CategoryQueryDto) {
        const {
            page = 1,
            limit = 50,
            status = 'all',
            search,
            parentId,
            sortBy = 'order',
            sortOrder = 'ASC',
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.categoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.parent', 'parent')
            .leftJoinAndSelect('category.children', 'children');

        // Apply filters
        if (status !== 'all') {
            queryBuilder.andWhere('category.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(category.name ILIKE :search OR category.slug ILIKE :search OR category.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (parentId !== undefined) {
            if (parentId === null || parentId === 0) {
                queryBuilder.andWhere('category.parentId IS NULL');
            } else {
                queryBuilder.andWhere('category.parentId = :parentId', { parentId });
            }
        }

        // Apply sorting
        queryBuilder.orderBy(`category.${sortBy}`, sortOrder);

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

    async findActive(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { status: 'active' },
            relations: ['parent', 'children'],
            order: { order: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['parent', 'children'],
        });

        if (!category) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }

        return category;
    }

    async findBySlug(slug: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { slug, status: 'active' },
            relations: ['parent', 'children'],
        });

        if (!category) {
            throw new NotFoundException(`Category with slug '${slug}' not found`);
        }

        return category;
    }

    async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        // Check for duplicate slug if slug is being changed
        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.categoryRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Category with slug '${dto.slug}' already exists`);
            }
        }

        // Check for duplicate name if name is being changed
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoryRepository.findOne({
                where: { name: dto.name },
            });
            if (existing) {
                throw new BadRequestException(`Category with name '${dto.name}' already exists`);
            }
        }

        // Validate parent exists if parentId is being changed
        if (dto.parentId !== undefined && dto.parentId !== null) {
            if (dto.parentId === id) {
                throw new BadRequestException('Category cannot be its own parent');
            }
            const parent = await this.categoryRepository.findOne({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new NotFoundException(`Parent category with id ${dto.parentId} not found`);
            }
        }

        Object.assign(category, dto);
        const saved = await this.categoryRepository.save(category);
        this.logger.log(`Category updated: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    async remove(id: number): Promise<{ success: boolean }> {
        const category = await this.findOne(id);

        // Check if category has children
        if (category.children && category.children.length > 0) {
            throw new BadRequestException(
                `Cannot delete category '${category.name}' because it has ${category.children.length} subcategories. Please delete or reassign subcategories first.`
            );
        }

        await this.categoryRepository.remove(category);
        this.logger.log(`Category deleted: ${category.name} (id: ${id})`);

        return { success: true };
    }

    async reorder(dto: ReorderCategoriesDto): Promise<{ success: boolean }> {
        if (dto.ids.length !== dto.orders.length) {
            throw new BadRequestException('ids and orders arrays must have the same length');
        }

        const updatePromises = dto.ids.map(async (id, index) => {
            const category = await this.categoryRepository.findOne({ where: { id } });
            if (category) {
                category.order = dto.orders[index];
                return this.categoryRepository.save(category);
            }
            return null;
        });

        await Promise.all(updatePromises);
        this.logger.log(`Categories reordered`);

        return { success: true };
    }

    async bulkUpdateStatus(dto: BulkStatusDto): Promise<{ success: boolean; count: number }> {
        const result = await this.categoryRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        this.logger.log(`Bulk status update: ${result.affected} categories set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async getStats(): Promise<{ total: number; active: number; inactive: number; withArticles: number }> {
        const [total, active, inactive] = await Promise.all([
            this.categoryRepository.count(),
            this.categoryRepository.count({ where: { status: 'active' } }),
            this.categoryRepository.count({ where: { status: 'inactive' } }),
        ]);

        // Count categories that have at least one article
        const categoriesWithArticles = await this.categoryRepository
            .createQueryBuilder('category')
            .innerJoin('category.articles', 'article')
            .getCount();

        return { total, active, inactive, withArticles: categoriesWithArticles };
    }

    async getTree(): Promise<Category[]> {
        // Get all categories
        const categories = await this.categoryRepository.find({
            relations: ['parent', 'children'],
            order: { order: 'ASC' },
        });

        // Return only root categories (with children nested)
        return categories.filter(c => !c.parentId);
    }
}