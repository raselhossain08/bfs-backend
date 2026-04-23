import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Article } from './entities/article.entity';
import { Category } from '../categories/entities/category.entity';
import {
    CreateArticleDto,
    UpdateArticleDto,
    ArticleQueryDto,
    BulkArticleStatusDto,
    PublicArticleQueryDto,
} from './articles.dto';

@Injectable()
export class ArticlesService {
    private readonly logger = new Logger(ArticlesService.name);

    constructor(
        @InjectRepository(Article)
        private articleRepository: Repository<Article>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) {}

    async create(dto: CreateArticleDto): Promise<Article> {
        // Check for duplicate slug
        const existingSlug = await this.articleRepository.findOne({
            where: { slug: dto.slug },
        });

        if (existingSlug) {
            throw new BadRequestException(`Article with slug '${dto.slug}' already exists`);
        }

        // Validate category if provided
        if (dto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
            }
        }

        const article = this.articleRepository.create({
            ...dto,
            status: dto.status || 'draft',
            views: 0,
            likes: 0,
        });

        // Set publishedAt if status is published
        if (dto.status === 'published' && !dto.publishedAt) {
            article.publishedAt = new Date();
        }

        const saved = await this.articleRepository.save(article);
        this.logger.log(`Article created: ${saved.title} (id: ${saved.id})`);

        return this.findOne(saved.id);
    }

    private transformArticle(article: Article) {
        const parsedTags = typeof article.tags === 'string'
            ? (() => { try { return JSON.parse(article.tags); } catch { return []; } })()
            : Array.isArray(article.tags) ? article.tags : [];

        const parsedImages = typeof article.images === 'string'
            ? (() => { try { return JSON.parse(article.images); } catch { return []; } })()
            : Array.isArray(article.images) ? article.images : [];

        const parsedContentBlocks = typeof article.contentBlocks === 'string'
            ? (() => { try { return JSON.parse(article.contentBlocks); } catch { return []; } })()
            : Array.isArray(article.contentBlocks) ? article.contentBlocks : [];

        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            description: article.description || '',
            content: article.content || '',
            image: article.image || '',
            images: parsedImages,
            author: article.author ? {
                name: article.author,
                image: article.authorImage || null,
                bio: article.authorBio || null,
            } : null,
            category: article.category ? { name: article.category.name } : (article.categoryName ? { name: article.categoryName } : {}),
            categoryName: article.categoryName || article.category?.name || '',
            tags: parsedTags,
            status: article.status,
            featured: article.featured || false,
            views: article.views || 0,
            likes: article.likes || 0,
            date: article.publishedAt || article.createdAt,
            publishedAt: article.publishedAt,
            seoTitle: article.metaTitle || '',
            seoDescription: article.metaDescription || '',
            seoKeywords: Array.isArray(article.keywords) ? article.keywords.join(',') : '',
            videoUrl: article.videoUrl || '',
            contentBlocks: parsedContentBlocks,
            commentsCount: 0,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
        };
    }

    async findAll(query: ArticleQueryDto) {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            categoryId,
            search,
            author,
            featured,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.category', 'category');

        // Apply filters
        if (status !== 'all') {
            queryBuilder.andWhere('article.status = :status', { status });
        }

        if (categoryId) {
            queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
        }

        if (search) {
            queryBuilder.andWhere(
                '(article.title ILIKE :search OR article.description ILIKE :search OR article.content ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (author) {
            queryBuilder.andWhere('article.author ILIKE :author', { author: `%${author}%` });
        }

        if (featured !== undefined) {
            queryBuilder.andWhere('article.featured = :featured', { featured });
        }

        // Apply sorting
        queryBuilder.orderBy(`article.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data: data.map(a => this.transformArticle(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findPublic(query: PublicArticleQueryDto) {
        const {
            page = 1,
            limit = 10,
            categoryId,
            search,
            sortBy = 'publishedAt',
            sortOrder = 'DESC',
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.category', 'category')
            .where('article.status = :status', { status: 'published' });

        if (categoryId) {
            queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
        }

        if (search) {
            queryBuilder.andWhere(
                '(article.title ILIKE :search OR article.description ILIKE :search OR article.content ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        queryBuilder
            .orderBy(`article.${sortBy}`, sortOrder)
            .skip(skip)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data: data.map(a => this.transformArticle(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Article> {
        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ['category'],
        });

        if (!article) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }

        return article;
    }

    async findBySlug(slug: string) {
        const article = await this.articleRepository.findOne({
            where: { slug, status: 'published' },
            relations: ['category'],
        });

        if (!article) {
            throw new NotFoundException(`Article with slug '${slug}' not found`);
        }

        await this.articleRepository.increment({ id: article.id }, 'views', 1);
        article.views += 1;

        return this.transformArticle(article);
    }

    async update(id: number, dto: UpdateArticleDto): Promise<Article> {
        const article = await this.findOne(id);

        // Check for duplicate slug if slug is being changed
        if (dto.slug && dto.slug !== article.slug) {
            const existing = await this.articleRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Article with slug '${dto.slug}' already exists`);
            }
        }

        // Validate category if being changed
        if (dto.categoryId !== undefined) {
            if (dto.categoryId !== null) {
                const category = await this.categoryRepository.findOne({
                    where: { id: dto.categoryId },
                });
                if (!category) {
                    throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
                }
            }
        }

        // Set publishedAt if status is changing to published
        if (dto.status === 'published' && article.status !== 'published' && !article.publishedAt) {
            dto['publishedAt'] = new Date() as any;
        }

        Object.assign(article, dto);
        const saved = await this.articleRepository.save(article);
        this.logger.log(`Article updated: ${saved.title} (id: ${saved.id})`);

        return this.findOne(saved.id);
    }

    async remove(id: number): Promise<{ success: boolean }> {
        const article = await this.findOne(id);
        await this.articleRepository.remove(article);
        this.logger.log(`Article deleted: ${article.title} (id: ${id})`);

        return { success: true };
    }

    async bulkUpdateStatus(dto: BulkArticleStatusDto): Promise<{ success: boolean; count: number }> {
        const result = await this.articleRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        this.logger.log(`Bulk status update: ${result.affected} articles set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async getStats(): Promise<{ total: number; published: number; draft: number; archived: number; totalViews: number; totalLikes: number }> {
        const [total, published, draft, archived, viewsResult, likesResult] = await Promise.all([
            this.articleRepository.count(),
            this.articleRepository.count({ where: { status: 'published' } }),
            this.articleRepository.count({ where: { status: 'draft' } }),
            this.articleRepository.count({ where: { status: 'archived' } }),
            this.articleRepository
                .createQueryBuilder('article')
                .select('SUM(article.views)', 'total')
                .getRawOne(),
            this.articleRepository
                .createQueryBuilder('article')
                .select('SUM(article.likes)', 'total')
                .getRawOne(),
        ]);

        return {
            total,
            published,
            draft,
            archived,
            totalViews: parseInt(viewsResult?.total || '0', 10),
            totalLikes: parseInt(likesResult?.total || '0', 10),
        };
    }

    async getArticlesByCategory(categoryId: number, limit?: number) {
        const queryBuilder = this.articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.category', 'category')
            .where('article.categoryId = :categoryId', { categoryId })
            .andWhere('article.status = :status', { status: 'published' })
            .orderBy('article.publishedAt', 'DESC');

        if (limit) {
            queryBuilder.take(limit);
        }

        const articles = await queryBuilder.getMany();
        return articles.map(a => this.transformArticle(a));
    }

    async incrementLikes(id: number): Promise<Article> {
        await this.articleRepository.increment({ id }, 'likes', 1);
        return this.findOne(id);
    }

    async export(format: 'csv' | 'json', query: ArticleQueryDto) {
        const { data } = await this.findAll({ ...query, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID', 'Title', 'Slug', 'Category', 'Author', 'Status',
            'Views', 'Likes', 'Featured', 'Published At', 'Created At'
        ];

        const rows = data.map((article) => [
            article.id,
            `"${(article.title || '').replace(/"/g, '""')}"`,
            article.slug,
            article.category?.name || article.categoryName || '',
            article.author || '',
            article.status,
            article.views,
            article.likes,
            article.featured ? 'Yes' : 'No',
            article.publishedAt?.toISOString() || '',
            article.createdAt?.toISOString() || '',
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map(row => row.join(',')),
        };
    }
}