import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Cause } from './entities/cause.entity';
import { CauseCategory } from './entities/cause-category.entity';
import { Donation } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { ReferralService } from '../referral/referral.service';
import {
    CreateCauseDto,
    UpdateCauseDto,
    CauseQueryDto,
    BulkCauseStatusDto,
    CreateCauseCategoryDto,
    UpdateCauseCategoryDto,
    CauseCategoryQueryDto,
    CreateDonationDto,
    UpdateDonationDto,
    DonationQueryDto,
    BulkDonationStatusDto,
    ReorderCausesDto,
    ReorderCauseCategoriesDto,
} from './dto/causes.dto';

@Injectable()
export class CausesService {
    private readonly logger = new Logger(CausesService.name);

    constructor(
        @InjectRepository(Cause)
        private causeRepository: Repository<Cause>,
        @InjectRepository(CauseCategory)
        private categoryRepository: Repository<CauseCategory>,
        @InjectRepository(Donation)
        private donationRepository: Repository<Donation>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
        @Inject(forwardRef(() => ReferralService))
        private referralService: ReferralService,
    ) {}

    // ============ CAUSE CATEGORIES ============

    async createCategory(dto: CreateCauseCategoryDto): Promise<CauseCategory> {
        const slug = dto.slug || this.generateSlug(dto.name);

        const existing = await this.categoryRepository.findOne({
            where: { slug },
        });

        if (existing) {
            throw new BadRequestException(`Category with slug '${slug}' already exists`);
        }

        const category = this.categoryRepository.create({
            ...dto,
            slug,
            status: dto.status || 'active',
            order: dto.order || 0,
        });

        const saved = await this.categoryRepository.save(category);
        this.logger.log(`Cause category created: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    async findAllCategories(query: CauseCategoryQueryDto) {
        const { page = 1, limit = 10, status, search, sortBy = 'order', sortOrder = 'ASC' } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.categoryRepository.createQueryBuilder('category');

        if (status && status !== 'all') {
            queryBuilder.andWhere('category.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(category.name ILIKE :search OR category.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
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

    async findActiveCategories(): Promise<CauseCategory[]> {
        return this.categoryRepository.find({
            where: { status: 'active' },
            order: { order: 'ASC' },
        });
    }

    async findOneCategory(id: number): Promise<CauseCategory> {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }

        return category;
    }

    async updateCategory(id: number, dto: UpdateCauseCategoryDto): Promise<CauseCategory> {
        const category = await this.findOneCategory(id);

        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.categoryRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Category with slug '${dto.slug}' already exists`);
            }
        }

        Object.assign(category, dto);
        const saved = await this.categoryRepository.save(category);
        this.logger.log(`Category updated: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    async removeCategory(id: number): Promise<{ success: boolean }> {
        const category = await this.findOneCategory(id);

        // Check if any causes are using this category
        const causesCount = await this.causeRepository.count({
            where: { categoryId: id },
        });

        if (causesCount > 0) {
            throw new BadRequestException(
                `Cannot delete category. ${causesCount} causes are using this category.`
            );
        }

        await this.categoryRepository.remove(category);
        this.logger.log(`Category deleted: ${category.name} (id: ${id})`);

        return { success: true };
    }

    async reorderCategories(dto: ReorderCauseCategoriesDto): Promise<{ success: boolean }> {
        for (const item of dto.orders) {
            await this.categoryRepository.update(item.id, { order: item.order });
        }
        this.logger.log(`Categories reordered`);
        return { success: true };
    }

    // ============ CAUSES ============

    async createCause(dto: CreateCauseDto): Promise<Cause> {
        const slug = dto.slug || this.generateSlug(dto.title);

        const existingSlug = await this.causeRepository.findOne({
            where: { slug },
        });

        if (existingSlug) {
            throw new BadRequestException(`Cause with slug '${slug}' already exists`);
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

        const cause = this.causeRepository.create({
            ...dto,
            slug,
            status: dto.status || 'active',
            order: dto.order || 0,
            isFeatured: dto.isFeatured || false,
            isUrgent: dto.isUrgent || false,
            currency: dto.currency || 'USD',
            views: 0,
            donors: 0,
            raised: 0,
            progress: 0,
        });

        const saved = await this.causeRepository.save(cause);
        this.logger.log(`Cause created: ${saved.title} (id: ${saved.id})`);

        return this.findOneCause(saved.id);
    }

    async findAllCauses(query: CauseQueryDto) {
        const {
            page = 1,
            limit = 10,
            status,
            categoryId,
            isFeatured,
            search,
            sortBy = 'order',
            sortOrder = 'ASC',
        } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.causeRepository
            .createQueryBuilder('cause')
            .leftJoinAndSelect('cause.category', 'category');

        // Apply filters
        if (status && status !== 'all') {
            queryBuilder.andWhere('cause.status = :status', { status });
        }

        if (categoryId) {
            queryBuilder.andWhere('cause.categoryId = :categoryId', { categoryId });
        }

        if (isFeatured !== undefined) {
            queryBuilder.andWhere('cause.isFeatured = :isFeatured', { isFeatured });
        }

        if (search) {
            queryBuilder.andWhere(
                '(cause.title ILIKE :search OR cause.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Apply sorting
        queryBuilder.orderBy(`cause.${sortBy}`, sortOrder);

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

    async findPublicCauses(query: { limit?: number; categoryId?: number; isFeatured?: boolean }) {
        const { limit = 10, categoryId, isFeatured } = query;

        const queryBuilder = this.causeRepository
            .createQueryBuilder('cause')
            .leftJoinAndSelect('cause.category', 'category')
            .where('cause.status = :status', { status: 'active' });

        if (categoryId) {
            queryBuilder.andWhere('cause.categoryId = :categoryId', { categoryId });
        }

        if (isFeatured) {
            queryBuilder.andWhere('cause.isFeatured = :isFeatured', { isFeatured: true });
        }

        queryBuilder.orderBy('cause.order', 'ASC').take(limit);

        return queryBuilder.getMany();
    }

    async findOneCause(id: number): Promise<Cause> {
        const cause = await this.causeRepository.findOne({
            where: { id },
            relations: ['category'],
        });

        if (!cause) {
            throw new NotFoundException(`Cause with id ${id} not found`);
        }

        return cause;
    }

    async findBySlug(slug: string): Promise<Cause> {
        const cause = await this.causeRepository.findOne({
            where: { slug },
            relations: ['category'],
        });

        if (!cause) {
            throw new NotFoundException(`Cause with slug '${slug}' not found`);
        }

        // Increment views
        await this.causeRepository.increment({ id: cause.id }, 'views', 1);

        return cause;
    }

    async updateCause(id: number, dto: UpdateCauseDto): Promise<Cause> {
        const cause = await this.findOneCause(id);

        // Check for duplicate slug if being changed
        if (dto.slug && dto.slug !== cause.slug) {
            const existing = await this.causeRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Cause with slug '${dto.slug}' already exists`);
            }
        }

        // Validate category if being changed
        if (dto.categoryId !== undefined && dto.categoryId !== null) {
            const category = await this.categoryRepository.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
            }
        }

        Object.assign(cause, dto);

        const saved = await this.causeRepository.save(cause);
        this.logger.log(`Cause updated: ${saved.title} (id: ${saved.id})`);

        return this.findOneCause(saved.id);
    }

    async removeCause(id: number): Promise<{ success: boolean }> {
        const cause = await this.findOneCause(id);
        await this.causeRepository.remove(cause);
        this.logger.log(`Cause deleted: ${cause.title} (id: ${id})`);

        return { success: true };
    }

    async bulkUpdateStatus(dto: BulkCauseStatusDto): Promise<{ success: boolean; count: number }> {
        const result = await this.causeRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        this.logger.log(`Bulk status update: ${result.affected} causes set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async reorderCauses(dto: ReorderCausesDto): Promise<{ success: boolean }> {
        for (const item of dto.orders) {
            await this.causeRepository.update(item.id, { order: item.order });
        }
        this.logger.log(`Causes reordered`);
        return { success: true };
    }

    async getCauseStats(): Promise<{
        total: number;
        active: number;
        paused: number;
        completed: number;
        archived: number;
        draft: number;
        featured: number;
        totalDonations: number;
        totalRaised: number;
        totalViews: number;
    }> {
        const [total, active, paused, completed, archived, draft, featured, donationsCount, raisedSum, viewsSum] = await Promise.all([
            this.causeRepository.count(),
            this.causeRepository.count({ where: { status: 'active' } }),
            this.causeRepository.count({ where: { status: 'paused' } }),
            this.causeRepository.count({ where: { status: 'completed' } }),
            this.causeRepository.count({ where: { status: 'archived' } }),
            this.causeRepository.count({ where: { status: 'draft' } }),
            this.causeRepository.count({ where: { isFeatured: true } }),
            this.donationRepository.count(),
            this.donationRepository
                .createQueryBuilder('donation')
                .select('SUM(donation.amount)', 'total')
                .where('donation.status = :status', { status: 'completed' })
                .getRawOne(),
            this.causeRepository
                .createQueryBuilder('cause')
                .select('SUM(cause.views)', 'total')
                .getRawOne(),
        ]);

        return {
            total,
            active,
            paused,
            completed,
            archived,
            draft,
            featured,
            totalDonations: donationsCount,
            totalRaised: parseFloat(raisedSum?.total || '0'),
            totalViews: parseInt(viewsSum?.total || '0', 10),
        };
    }

    async exportCauses(format: 'csv' | 'json', query: CauseQueryDto) {
        const { data } = await this.findAllCauses({ ...query, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID',
            'Title',
            'Slug',
            'Status',
            'Category',
            'Featured',
            'Goal',
            'Raised',
            'Donors',
            'Progress',
            'Views',
            'Created At',
        ];

        const rows = data.map((cause) => [
            cause.id,
            `"${(cause.title || '').replace(/"/g, '""')}"`,
            cause.slug,
            cause.status,
            cause.category?.name || '',
            cause.isFeatured ? 'Yes' : 'No',
            cause.goal || 0,
            cause.raised || 0,
            cause.donors || 0,
            cause.progress || 0,
            cause.views || 0,
            cause.createdAt?.toISOString() || '',
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map((row) => row.join(',')),
        };
    }

    // ============ DONATIONS ============

    async createDonation(dto: CreateDonationDto): Promise<Donation> {
        // Start transaction for data consistency
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            // Validate cause if provided
            let causeName = dto.causeName;
            if (dto.causeId) {
                const cause = await transactionalEntityManager.findOne(Cause, {
                    where: { id: dto.causeId },
                });
                if (!cause) {
                    throw new NotFoundException(`Cause with id ${dto.causeId} not found`);
                }
                causeName = cause.title;
            }

            const donation = transactionalEntityManager.create(Donation, {
                ...dto,
                causeName,
                status: dto.status || 'completed',
            });

            const saved = await transactionalEntityManager.save(Donation, donation);

            // Update cause stats if linked to a cause
            if (dto.causeId && dto.status === 'completed') {
                await this.updateCauseStats(dto.causeId);
            }

            this.logger.log(`Donation created: $${saved.amount} for cause ${dto.causeId || 'General'}`);

            // Track referral if user was referred (outside transaction to avoid deadlock)
            if (dto.donorId && dto.status === 'completed') {
                this.referralService.recordDonation(dto.donorId, dto.amount).catch(error => {
                    this.logger.warn(`Failed to track referral for donation: ${error.message}`);
                });
            }

            return saved;
        });
    }

    async findAllDonations(query: DonationQueryDto) {
        const {
            page = 1,
            limit = 10,
            causeId,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.donationRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.cause', 'cause');

        if (causeId) {
            queryBuilder.andWhere('donation.causeId = :causeId', { causeId });
        }

        if (status && status !== 'all') {
            queryBuilder.andWhere('donation.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(donation.name ILIKE :search OR donation.email ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        queryBuilder.orderBy(`donation.${sortBy}`, sortOrder);
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

    async findOneDonation(id: number): Promise<Donation> {
        const donation = await this.donationRepository.findOne({
            where: { id },
            relations: ['cause', 'donor'],
        });

        if (!donation) {
            throw new NotFoundException(`Donation with id ${id} not found`);
        }

        return donation;
    }

    async updateDonation(id: number, dto: UpdateDonationDto): Promise<Donation> {
        const donation = await this.findOneDonation(id);
        const oldStatus = donation.status;

        Object.assign(donation, dto);
        const saved = await this.donationRepository.save(donation);

        // Update cause stats if status changed
        if (dto.status && dto.status !== oldStatus && donation.causeId) {
            await this.updateCauseStats(donation.causeId);
        }

        this.logger.log(`Donation updated: ${saved.id}`);
        return saved;
    }

    async bulkUpdateDonationStatus(dto: BulkDonationStatusDto): Promise<{ success: boolean; count: number }> {
        // Get affected causes before update
        const donations = await this.donationRepository.find({
            where: { id: In(dto.ids) },
            select: ['id', 'causeId', 'status'],
        });

        const affectedCauseIds = [...new Set(donations.filter(d => d.causeId).map(d => d.causeId))];

        const result = await this.donationRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        // Update stats for affected causes
        for (const causeId of affectedCauseIds) {
            await this.updateCauseStats(causeId as number);
        }

        this.logger.log(`Bulk donation status update: ${result.affected} donations set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async getDonationStats(): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        totalAmount: number;
        thisMonth: number;
        thisMonthAmount: number;
    }> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, completed, pending, failed, totalSum, monthSum] = await Promise.all([
            this.donationRepository.count(),
            this.donationRepository.count({ where: { status: 'completed' } }),
            this.donationRepository.count({ where: { status: 'pending' } }),
            this.donationRepository.count({ where: { status: 'failed' } }),
            this.donationRepository
                .createQueryBuilder('donation')
                .select('SUM(donation.amount)', 'total')
                .where('donation.status = :status', { status: 'completed' })
                .getRawOne(),
            this.donationRepository
                .createQueryBuilder('donation')
                .select('SUM(donation.amount)', 'total')
                .where('donation.status = :status', { status: 'completed' })
                .andWhere('donation.createdAt >= :startOfMonth', { startOfMonth })
                .getRawOne(),
        ]);

        return {
            total,
            completed,
            pending,
            failed,
            totalAmount: parseFloat(totalSum?.total || '0'),
            thisMonth: 0, // Would need to count with date filter
            thisMonthAmount: parseFloat(monthSum?.total || '0'),
        };
    }

    async exportDonations(causeId: number | undefined, format: 'csv' | 'json') {
        const { data } = await this.findAllDonations({ causeId, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID',
            'Transaction ID',
            'Amount',
            'Currency',
            'Cause',
            'Status',
            'Donor Name',
            'Donor Email',
            'Payment Method',
            'Created At',
        ];

        const rows = data.map((donation) => [
            donation.id,
            donation.transactionId,
            donation.amount,
            donation.currency,
            `"${(donation.causeName || '').replace(/"/g, '""')}"`,
            donation.status,
            `"${(donation.name || '').replace(/"/g, '""')}"`,
            donation.email || '',
            donation.paymentMethod,
            donation.createdAt?.toISOString() || '',
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map((row) => row.join(',')),
        };
    }

    // ============ HELPERS ============

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private async updateCauseStats(causeId: number): Promise<void> {
        // Calculate total raised and donor count
        const result = await this.donationRepository
            .createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'totalRaised')
            .addSelect('COUNT(DISTINCT donation.email)', 'uniqueDonors')
            .where('donation.causeId = :causeId', { causeId })
            .andWhere('donation.status = :status', { status: 'completed' })
            .getRawOne();

        const totalRaised = parseFloat(result?.totalRaised || '0');
        const uniqueDonors = parseInt(result?.uniqueDonors || '0', 10);

        // Get cause to calculate progress
        const cause = await this.causeRepository.findOne({ where: { id: causeId } });
        const goal = parseFloat(cause?.goal?.toString() || '0');
        const progress = goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

        // Update cause
        await this.causeRepository.update(causeId, {
            raised: totalRaised,
            donors: uniqueDonors,
            progress,
        });

        this.logger.log(`Updated stats for cause ${causeId}: raised=$${totalRaised}, donors=${uniqueDonors}, progress=${progress}%`);
    }

    // ============ USER IMPACT ============

    async getUserImpact(userId: number): Promise<{
        totalDonated: number;
        campaignsSupported: number;
        donationCount: number;
        averageDonation: number;
        firstDonation: Date | null;
        lastDonation: Date | null;
        monthlyGrowth: number;
        yearlyTotal: number;
        categoriesSupported: string[];
        milestones: string[];
        donations: any[];
    }> {
        // Get all completed donations for the user
        const donations = await this.donationRepository.find({
            where: { donorId: userId, status: 'completed' },
            order: { createdAt: 'DESC' },
            relations: ['cause'],
        });

        if (donations.length === 0) {
            return {
                totalDonated: 0,
                campaignsSupported: 0,
                donationCount: 0,
                averageDonation: 0,
                firstDonation: null,
                lastDonation: null,
                monthlyGrowth: 0,
                yearlyTotal: 0,
                categoriesSupported: [],
                milestones: [],
                donations: [],
            };
        }

        // Calculate basic stats
        const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
        
        // Count unique campaigns (by causeId OR causeName for cases where causeId is null)
        const uniqueCampaigns = new Set();
        for (const d of donations) {
            const key = d.causeId ? `id:${d.causeId}` : d.causeName ? `name:${d.causeName}` : null;
            if (key) uniqueCampaigns.add(key);
        }
        const campaignsSupported = uniqueCampaigns.size;
        const donationCount = donations.length;
        const averageDonation = totalDonated / donationCount;

        // Date range
        const sortedByDate = [...donations].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const firstDonation = sortedByDate[0]?.createdAt || null;
        const lastDonation = sortedByDate[sortedByDate.length - 1]?.createdAt || null;

        // Calculate yearly total and monthly growth
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const yearlyDonations = donations.filter(
            d => new Date(d.createdAt) >= oneYearAgo
        );
        const yearlyTotal = yearlyDonations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

        const lastMonthDonations = donations.filter(
            d => new Date(d.createdAt) >= oneMonthAgo
        );
        const lastMonthTotal = lastMonthDonations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

        const previousMonthDonations = donations.filter(d => {
            const date = new Date(d.createdAt);
            return date >= new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()) &&
                   date < oneMonthAgo;
        });
        const previousMonthTotal = previousMonthDonations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

        const monthlyGrowth = previousMonthTotal > 0
            ? Math.round(((lastMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
            : lastMonthTotal > 0 ? 100 : 0;

        // Categories supported - also check causeName when cause is null
        const categories = new Set<string>();
        for (const donation of donations) {
            if (donation.cause?.category?.name) {
                categories.add(donation.cause.category.name);
            }
            // Also try to get category from causeName
            if (donation.causeName) {
                // If causeName exists, count it as a category too
                categories.add(donation.causeName);
            }
        }

        // Calculate milestones
        const milestones: string[] = [];
        if (donationCount >= 1) milestones.push('first-donation');
        if (totalDonated >= 100) milestones.push('centurion');
        if (totalDonated >= 500) milestones.push('generous-spirit');
        if (totalDonated >= 1000) milestones.push('impact-champion');
        if (totalDonated >= 5000) milestones.push('philanthropist');
        if (campaignsSupported >= 3) milestones.push('global-citizen');
        if (campaignsSupported >= 5) milestones.push('cause-champion');
        if (campaignsSupported >= 10) milestones.push('humanitarian');
        if (donationCount >= 10) milestones.push('consistent-giver');
        if (donationCount >= 25) milestones.push('dedicated-supporter');
        if (donationCount >= 50) milestones.push('lifesaver');

        // Format donations for response
        const formattedDonations = donations.slice(0, 20).map(d => ({
            id: d.id,
            amount: parseFloat(d.amount.toString()),
            currency: d.currency,
            causeId: d.causeId,
            causeName: d.causeName || d.cause?.title,
            causeCategory: d.cause?.category,
            status: d.status,
            paymentMethod: d.paymentMethod,
            createdAt: d.createdAt,
        }));

        return {
            totalDonated,
            campaignsSupported,
            donationCount,
            averageDonation,
            firstDonation,
            lastDonation,
            monthlyGrowth,
            yearlyTotal,
            categoriesSupported: Array.from(categories),
            milestones,
            donations: formattedDonations,
        };
    }

    async getUserDonations(userId: number, query: { 
        page?: number; 
        limit?: number; 
        status?: string;
        search?: string;
        causeId?: string;
        startDate?: string;
        endDate?: string;
        sort?: string;
    } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        // Build query conditions
        const where: any = { donorId: userId };

        // Filter by status
        if (query.status && query.status !== 'all') {
            where.status = query.status;
        }

        // Filter by causeId
        if (query.causeId && query.causeId !== 'all') {
            where.causeId = parseInt(query.causeId, 10);
        }

        // Filter by date range
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                const endDate = new Date(query.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = endDate;
            }
        }

        // Build order based on sort parameter
        let order: any = { createdAt: 'DESC' };
        if (query.sort) {
            switch (query.sort) {
                case 'date-asc':
                    order = { createdAt: 'ASC' };
                    break;
                case 'amount-desc':
                    order = { amount: 'DESC' };
                    break;
                case 'amount-asc':
                    order = { amount: 'ASC' };
                    break;
                case 'date-desc':
                default:
                    order = { createdAt: 'DESC' };
                    break;
            }
        }

        // Use query builder for more complex queries with search
        const queryBuilder = this.donationRepository.createQueryBuilder('donation')
            .leftJoinAndSelect('donation.cause', 'cause')
            .where('donation.donorId = :donorId', { donorId: userId });

        // Apply filters
        if (query.status && query.status !== 'all') {
            queryBuilder.andWhere('donation.status = :status', { status: query.status });
        }

        if (query.causeId && query.causeId !== 'all') {
            queryBuilder.andWhere('donation.causeId = :causeId', { causeId: parseInt(query.causeId, 10) });
        }

        if (query.startDate) {
            queryBuilder.andWhere('donation.createdAt >= :startDate', { startDate: new Date(query.startDate) });
        }

        if (query.endDate) {
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            queryBuilder.andWhere('donation.createdAt <= :endDate', { endDate });
        }

        if (query.search) {
            queryBuilder.andWhere(
                '(donation.causeName ILIKE :search OR donation.transactionId ILIKE :search)',
                { search: `%${query.search}%` }
            );
        }

        // Apply ordering
        if (query.sort === 'amount-asc') {
            queryBuilder.orderBy('donation.amount', 'ASC');
        } else if (query.sort === 'amount-desc') {
            queryBuilder.orderBy('donation.amount', 'DESC');
        } else if (query.sort === 'date-asc') {
            queryBuilder.orderBy('donation.createdAt', 'ASC');
        } else {
            queryBuilder.orderBy('donation.createdAt', 'DESC');
        }

        // Get total count before pagination
        const total = await queryBuilder.getCount();

        // Apply pagination
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const donations = await queryBuilder.getMany();

        const formattedDonations = donations.map(d => ({
            id: d.id,
            transactionId: d.transactionId,
            amount: parseFloat(d.amount.toString()),
            currency: d.currency,
            causeId: d.causeId,
            causeName: d.causeName || d.cause?.title,
            causeImage: d.cause?.image,
            causeCategory: d.cause?.category?.name,
            status: d.status,
            paymentMethod: d.paymentMethod,
            createdAt: d.createdAt,
            isAnonymous: d.isAnonymous,
            motivation: d.motivation,
        }));

        return {
            data: formattedDonations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllDonors(query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        // Get all donations with donor info
        const donations = await this.donationRepository.find({
            where: query.status ? { status: query.status } : {},
            order: { createdAt: 'DESC' },
            relations: ['donor', 'cause'],
        });

        // Group by donor
        const donorMap = new Map();

        donations.forEach((d: any) => {
            const donorId = d.donorId;
            if (!donorId) return;

            if (!donorMap.has(donorId)) {
                donorMap.set(donorId, {
                    id: donorId,
                    name: d.name || d.donor?.firstName + ' ' + d.donor?.lastName || 'Anonymous',
                    email: d.email || d.donor?.email,
                    phone: d.donor?.phone,
                    totalLifetimeValue: 0,
                    joinDate: d.createdAt,
                    lastDonationDate: d.createdAt,
                    status: 'Active',
                    type: 'Individual',
                    tags: [],
                    donationCount: 0,
                });
            }

            const donor = donorMap.get(donorId);
            donor.totalLifetimeValue += Number(d.amount || 0);
            donor.donationCount += 1;
            if (new Date(d.createdAt) > new Date(donor.lastDonationDate)) {
                donor.lastDonationDate = d.createdAt;
            }
        });

        let donors = Array.from(donorMap.values());

        // Apply search filter
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            donors = donors.filter(d => 
                d.name?.toLowerCase().includes(searchLower) ||
                d.email?.toLowerCase().includes(searchLower) ||
                d.phone?.toLowerCase().includes(searchLower)
            );
        }

        const total = donors.length;
        const paginatedDonors = donors.slice(skip, skip + limit);

        return {
            data: paginatedDonors,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getDonorById(donorId: number) {
        // Get user info
        const user = await this.userRepository.findOne({
            where: { id: donorId },
        });

        // Get all donations for this donor
        const donations = await this.donationRepository.find({
            where: { donorId },
            order: { createdAt: 'DESC' },
            relations: ['cause'],
        });

        if (donations.length === 0 && !user) {
            return null;
        }

        const firstDonation = donations[donations.length - 1];
        const lastDonation = donations[0];

        const totalLifetimeValue = donations.reduce(
            (sum: number, d: any) => sum + Number(d.amount || 0),
            0
        );

        return {
            id: donorId,
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] : 
                  firstDonation?.name || 'Anonymous',
            email: user?.email || firstDonation?.email,
            phone: user?.phone,
            totalLifetimeValue,
            joinDate: firstDonation?.createdAt || user?.createdAt,
            lastDonationDate: lastDonation?.createdAt,
            status: 'Active',
            type: 'Individual',
            tags: [],
            donationCount: donations.length,
            donations: donations.map(d => ({
                id: d.id,
                amount: parseFloat(d.amount.toString()),
                currency: d.currency,
                causeName: d.causeName || d.cause?.title,
                causeId: d.causeId,
                status: d.status,
                createdAt: d.createdAt,
            })),
        };
    }

    // ============ RECEIPT METHODS ============

    async generateReceipt(donationId: number, userId: number): Promise<Buffer> {
        // Get donation with verification
        const donation = await this.donationRepository.findOne({
            where: { id: donationId },
            relations: ['cause'],
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        // Verify ownership
        if (donation.donorId !== userId) {
            throw new NotFoundException('Donation not found');
        }

        // Generate simple PDF receipt
        // In production, you'd use a proper PDF library like PDFKit
        const receiptContent = this.generateReceiptHtml(donation);

        // For now, return a simple buffer (in production, generate actual PDF)
        return Buffer.from(receiptContent, 'utf-8');
    }

    private generateReceiptHtml(donation: Donation): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Donation Receipt - ${donation.causeName || 'General Donation'}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
        .receipt-id { color: #64748b; font-size: 14px; }
        .amount { font-size: 36px; font-weight: bold; color: #14b8a6; margin: 20px 0; }
        .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BIRDSFLY</h1>
        <p class="receipt-id">Official Donation Receipt</p>
    </div>
    <div style="text-align: center;">
        <p>Thank you for your donation to</p>
        <h2>${donation.causeName || 'General Donation'}</h2>
        <div class="amount">$${parseFloat(donation.amount.toString()).toFixed(2)}</div>
    </div>
    <div class="details">
        <div class="row"><span>Transaction ID</span><span>${donation.transactionId}</span></div>
        <div class="row"><span>Date</span><span>${new Date(donation.createdAt).toLocaleDateString()}</span></div>
        <div class="row"><span>Payment Method</span><span>${donation.paymentMethod || 'Card'}</span></div>
        <div class="row"><span>Status</span><span>${donation.status}</span></div>
    </div>
    <div class="footer">
        <p>This receipt serves as proof of your donation.</p>
        <p>Tax ID: [Your Organization Tax ID]</p>
    </div>
</body>
</html>`;
    }

    async emailReceipt(donationId: number, userId: number): Promise<void> {
        // Get donation with verification
        const donation = await this.donationRepository.findOne({
            where: { id: donationId },
            relations: ['cause', 'donor'],
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        // Verify ownership
        if (donation.donorId !== userId) {
            throw new NotFoundException('Donation not found');
        }

        // In production, you'd integrate with an email service
        // For now, just log the action
        this.logger.log(`Email receipt requested for donation ${donationId} by user ${userId}`);

        // TODO: Integrate with email service
        // await this.emailService.sendReceiptEmail(donation.donor.email, donation);
    }

    async generateAnnualSummary(year: number, userId: number): Promise<Buffer> {
        // Get all donations for the user in the specified year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const donations = await this.donationRepository.find({
            where: {
                donorId: userId,
                status: 'completed',
                createdAt: { $gte: startDate, $lte: endDate } as any,
            },
            relations: ['cause'],
            order: { createdAt: 'ASC' },
        });

        // Calculate totals
        const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
        const taxDeductibleAmount = totalAmount; // Assuming all donations are tax deductible

        // Generate HTML content
        const donationRows = donations.map(d => `
            <tr>
                <td>${new Date(d.createdAt).toLocaleDateString()}</td>
                <td>${d.causeName || 'General Donation'}</td>
                <td>$${parseFloat(d.amount.toString()).toFixed(2)}</td>
                <td>${d.transactionId}</td>
            </tr>
        `).join('');

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Annual Tax Summary ${year}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #0d9488; margin-bottom: 10px; }
        .org-info { font-size: 14px; color: #666; margin-bottom: 20px; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .tax-year { font-size: 18px; color: #0d9488; font-weight: bold; }
        .total-box { background: #0d9488; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
        .total-amount { font-size: 36px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f0fdfa; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #0d9488; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">BFS Foundation</div>
        <div class="org-info">
            123 Charity Lane, New York, NY 10001<br>
            EIN: XX-XXXXXXX
        </div>
        <h1>Annual Tax Summary</h1>
        <div class="tax-year">Tax Year ${year}</div>
    </div>

    <div class="total-box">
        <div class="total-amount">$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div>Total Tax-Deductible Contributions</div>
    </div>

    <h2>Donation Details (${donations.length} donations)</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Campaign/Project</th>
                <th>Amount</th>
                <th>Transaction ID</th>
            </tr>
        </thead>
        <tbody>
            ${donationRows || '<tr><td colspan="4" style="text-align: center;">No donations recorded for this year</td></tr>'}
        </tbody>
    </table>

    <div class="footer">
        <p>This document serves as an official receipt for tax purposes.</p>
        <p>No goods or services were provided in exchange for these donations.</p>
        <p>BFS Foundation is a registered 501(c)(3) nonprofit organization.</p>
    </div>
</body>
</html>`;

        // Return as buffer (in production, use PDF library)
        return Buffer.from(htmlContent, 'utf-8');
    }
}