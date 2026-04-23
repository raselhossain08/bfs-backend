import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { VolunteerApplication, ApplicationStatus } from './entities/volunteer-application.entity';
import { Volunteer } from './entities/volunteer.entity';
import { User } from '../users/entities/user.entity';
import {
    CreateApplicationDto,
    UpdateApplicationStatusDto,
    BulkStatusUpdateDto,
    AddNoteDto,
    ApplicationQueryDto,
    CreateVolunteerDto,
    UpdateVolunteerDto,
    VolunteerQueryDto,
    BulkVolunteerStatusDto,
    CreateVolunteerFromApplicationDto,
} from './volunteers.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class VolunteersService {
    private readonly logger = new Logger(VolunteersService.name);

    constructor(
        @InjectRepository(VolunteerApplication)
        private applicationRepository: Repository<VolunteerApplication>,
        @InjectRepository(Volunteer)
        private volunteerRepository: Repository<Volunteer>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly emailService: EmailService,
    ) {}

    // ============ APPLICATION METHODS ============

    async createApplication(dto: CreateApplicationDto): Promise<VolunteerApplication> {
        // Check for existing application with same email
        const existing = await this.applicationRepository.findOne({
            where: { email: dto.email.toLowerCase() },
        });

        if (existing) {
            if (existing.status === ApplicationStatus.PENDING) {
                throw new BadRequestException('You already have a pending application. Please wait for review.');
            }
            if (existing.status === ApplicationStatus.APPROVED) {
                throw new BadRequestException('You are already an approved volunteer.');
            }
            // If rejected, allow reapplication after 30 days
            const rejectedDate = existing.reviewedAt;
            if (rejectedDate) {
                const daysSinceRejection = Math.floor((Date.now() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceRejection < 30) {
                    throw new BadRequestException(`Your previous application was rejected. Please wait ${30 - daysSinceRejection} days before reapplying.`);
                }
            }
        }

        const application = this.applicationRepository.create({
            ...dto,
            email: dto.email.toLowerCase(),
            status: ApplicationStatus.PENDING,
            submittedAt: new Date(),
        });

        const saved = await this.applicationRepository.save(application);
        this.logger.log(`New volunteer application created: ${saved.email}`);

        return saved;
    }

    async getApplications(query: ApplicationQueryDto) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            causeId,
            experience,
            startDate,
            endDate,
            sortBy = 'submittedAt',
            sortOrder = 'DESC',
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.applicationRepository
            .createQueryBuilder('application')
            .leftJoinAndSelect('application.reviewer', 'reviewer');

        // Apply filters
        if (status && status !== 'all') {
            queryBuilder.andWhere('application.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(application.name ILIKE :search OR application.email ILIKE :search OR application.location ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (causeId) {
            queryBuilder.andWhere('application.causeId = :causeId', { causeId });
        }

        if (experience) {
            queryBuilder.andWhere('application.experience = :experience', { experience });
        }

        if (startDate) {
            queryBuilder.andWhere('application.submittedAt >= :startDate', { startDate: new Date(startDate) });
        }

        if (endDate) {
            queryBuilder.andWhere('application.submittedAt <= :endDate', { endDate: new Date(endDate) });
        }

        // Apply sorting
        queryBuilder.orderBy(`application.${sortBy}`, sortOrder);

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

    async getApplicationById(id: number): Promise<VolunteerApplication> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: ['reviewer', 'volunteerProfile'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return application;
    }

    async updateApplicationStatus(
        id: number,
        dto: UpdateApplicationStatusDto,
        reviewerId: number
    ): Promise<VolunteerApplication> {
        const application = await this.getApplicationById(id);

        if (application.status !== ApplicationStatus.PENDING && dto.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException('Only pending applications can be approved or rejected');
        }

        application.status = dto.status;
        application.reviewedBy = reviewerId;
        application.reviewedAt = new Date();
        if (dto.notes) {
            application.notes = dto.notes;
        }

        // If approved, create volunteer profile
        if (dto.status === ApplicationStatus.APPROVED) {
            const volunteer = await this.createVolunteerFromApplication(application);
            application.volunteerProfileId = volunteer.id;
        }

        const saved = await this.applicationRepository.save(application);
        this.logger.log(`Application ${id} ${dto.status} by user ${reviewerId}`);

        // Send email notification
        if (dto.status === ApplicationStatus.APPROVED) {
            await this.emailService.sendVolunteerApprovalEmail(application.email, {
                name: application.name,
                causeTitle: application.causeTitle || 'General',
            });
        } else if (dto.status === ApplicationStatus.REJECTED) {
            await this.emailService.sendVolunteerRejectionEmail(application.email, {
                name: application.name,
                notes: dto.notes,
            });
        }

        return saved;
    }

    async bulkUpdateStatus(dto: BulkStatusUpdateDto, reviewerId: number): Promise<{ success: boolean; count: number }> {
        const applications = await this.applicationRepository.find({
            where: { id: In(dto.ids) },
        });

        if (applications.length === 0) {
            throw new NotFoundException('No applications found');
        }

        const updatePromises = applications.map(async (app) => {
            app.status = dto.status;
            app.reviewedBy = reviewerId;
            app.reviewedAt = new Date();
            if (dto.notes) {
                app.notes = dto.notes;
            }

            if (dto.status === ApplicationStatus.APPROVED) {
                const volunteer = await this.createVolunteerFromApplication(app);
                app.volunteerProfileId = volunteer.id;
            }

            return app;
        });

        const updatedApps = await Promise.all(updatePromises);
        await this.applicationRepository.save(updatedApps);

        this.logger.log(`Bulk ${dto.status} for ${applications.length} applications by user ${reviewerId}`);

        return { success: true, count: applications.length };
    }

    async addNote(id: number, dto: AddNoteDto, reviewerId: number): Promise<VolunteerApplication> {
        const application = await this.getApplicationById(id);

        const timestamp = new Date().toISOString();
        const newNote = `[${timestamp}] ${dto.notes}`;
        application.notes = application.notes ? `${application.notes}\n${newNote}` : newNote;
        application.reviewedBy = reviewerId;

        return this.applicationRepository.save(application);
    }

    async deleteApplication(id: number): Promise<{ success: boolean }> {
        const application = await this.getApplicationById(id);

        if (application.volunteerProfileId) {
            await this.volunteerRepository.delete(application.volunteerProfileId);
        }

        await this.applicationRepository.delete(id);
        this.logger.log(`Application ${id} deleted`);

        return { success: true };
    }

    async getApplicationStats() {
        const [total, pending, approved, rejected] = await Promise.all([
            this.applicationRepository.count(),
            this.applicationRepository.count({ where: { status: ApplicationStatus.PENDING } }),
            this.applicationRepository.count({ where: { status: ApplicationStatus.APPROVED } }),
            this.applicationRepository.count({ where: { status: ApplicationStatus.REJECTED } }),
        ]);

        return { total, pending, approved, rejected };
    }

    async exportApplications(format: 'csv' | 'json', query: ApplicationQueryDto) {
        const { data } = await this.getApplications({ ...query, limit: 10000 }); // Export up to 10k

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID', 'Name', 'Email', 'Phone', 'Location', 'Cause', 'Interest',
            'Skills', 'Experience', 'Availability', 'Languages', 'Status',
            'Submitted At', 'Reviewed At', 'Notes'
        ];

        const rows = data.map(app => [
            app.id,
            `"${app.name}"`,
            app.email,
            app.phone,
            `"${app.location}"`,
            app.causeTitle || 'General',
            app.interest,
            `"${app.skills || ''}"`,
            app.experience || '',
            `"${(app.availability || []).join('; ')}"`,
            `"${(app.languages || []).join('; ')}"`,
            app.status,
            app.submittedAt?.toISOString() || '',
            app.reviewedAt?.toISOString() || '',
            `"${(app.notes || '').replace(/"/g, '""')}"`,
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map(row => row.join(',')),
        };
    }

    // ============ VOLUNTEER METHODS ============

    private async createVolunteerFromApplication(application: VolunteerApplication): Promise<Volunteer> {
        const slug = this.generateSlug(application.name);

        const volunteer = this.volunteerRepository.create({
            name: application.name,
            email: application.email.toLowerCase(),
            phone: application.phone,
            location: application.location,
            role: 'Volunteer',
            bio: application.message || '',
            skills: application.skills,
            languages: application.languages,
            applicationId: application.id,
            status: 'active',
            slug,
        });

        return this.volunteerRepository.save(volunteer);
    }

    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${baseSlug}-${randomSuffix}`;
    }

    async getVolunteers(query: VolunteerQueryDto) {
        const { page = 1, limit = 10, status, search, role, skill, sortBy = 'order', sortOrder = 'ASC' } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.volunteerRepository
            .createQueryBuilder('volunteer')
            .leftJoinAndSelect('volunteer.creator', 'creator');

        // Apply filters
        if (status && status !== 'all') {
            queryBuilder.andWhere('volunteer.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(volunteer.name ILIKE :search OR volunteer.email ILIKE :search OR volunteer.location ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (role) {
            queryBuilder.andWhere('volunteer.role = :role', { role });
        }

        if (skill) {
            queryBuilder.andWhere('volunteer.skills ILIKE :skill', { skill: `%${skill}%` });
        }

        // Apply sorting
        queryBuilder.orderBy(`volunteer.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getVolunteerBySlug(slug: string): Promise<Volunteer> {
        const volunteer = await this.volunteerRepository.findOne({
            where: { slug, status: 'active' },
        });

        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        return volunteer;
    }

    async getVolunteerById(id: number): Promise<Volunteer> {
        const volunteer = await this.volunteerRepository.findOne({
            where: { id },
            relations: ['creator', 'updater', 'application'],
        });

        if (!volunteer) {
            throw new NotFoundException('Volunteer not found');
        }

        return volunteer;
    }

    async createVolunteer(dto: CreateVolunteerDto, userId?: number): Promise<Volunteer> {
        const existing = await this.volunteerRepository.findOne({
            where: { email: dto.email.toLowerCase() },
        });

        if (existing) {
            throw new BadRequestException('A volunteer with this email already exists');
        }

        const volunteer = this.volunteerRepository.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            location: dto.location,
            slug: dto.slug || this.generateSlug(dto.name),
            role: dto.role,
            title: dto.title,
            bio: dto.bio,
            impact: dto.impact,
            avatar: dto.avatar,
            skills: dto.skills,
            languages: dto.languages,
            experienceTitle: dto.experienceTitle,
            experienceSubtitle: dto.experienceSubtitle,
            experienceDescription: dto.experienceDescription,
            fundingPhases: dto.fundingPhases,
            blocks: dto.blocks as any,
            socialLinks: dto.socialLinks,
            seo: dto.seo,
            programs: dto.programs,
            order: dto.order,
            status: dto.status || 'active',
            applicationId: dto.applicationId,
            createdBy: userId,
        } as unknown as Volunteer);

        return this.volunteerRepository.save(volunteer);
    }

    async updateVolunteer(id: number, dto: UpdateVolunteerDto, userId?: number): Promise<Volunteer> {
        const volunteer = await this.getVolunteerById(id);

        Object.assign(volunteer, dto, { updatedBy: userId });

        if (dto.name && dto.name !== volunteer.name) {
            volunteer.slug = this.generateSlug(dto.name);
        }

        return this.volunteerRepository.save(volunteer);
    }

    async deleteVolunteer(id: number): Promise<{ success: boolean }> {
        await this.getVolunteerById(id);
        await this.volunteerRepository.delete(id);

        return { success: true };
    }

    async bulkUpdateVolunteerStatus(dto: BulkVolunteerStatusDto, userId?: number): Promise<{ success: boolean; count: number }> {
        const result = await this.volunteerRepository.update(
            { id: In(dto.ids) },
            { status: dto.status, updatedBy: userId }
        );

        return { success: true, count: result.affected || 0 };
    }

    async getVolunteerStats() {
        const [total, active, inactive] = await Promise.all([
            this.volunteerRepository.count(),
            this.volunteerRepository.count({ where: { status: 'active' } }),
            this.volunteerRepository.count({ where: { status: 'inactive' } }),
        ]);

        // Get role distribution
        const roleStats = await this.volunteerRepository
            .createQueryBuilder('volunteer')
            .select('volunteer.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('volunteer.role')
            .getRawMany();

        return { total, active, inactive, roleStats };
    }

    async exportVolunteers(format: 'csv' | 'json', query: VolunteerQueryDto) {
        const { data } = await this.getVolunteers({ ...query, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID', 'Name', 'Email', 'Phone', 'Location', 'Role', 'Title', 'Status',
            'Skills', 'Languages', 'Bio', 'Slug', 'Created At', 'Updated At'
        ];

        const rows = data.map((v: Volunteer) => [
            v.id,
            `"${v.name}"`,
            v.email,
            v.phone || '',
            `"${v.location || ''}"`,
            v.role || '',
            v.title || '',
            v.status,
            `"${v.skills || ''}"`,
            `"${(v.languages || []).join('; ')}"`,
            `"${(v.bio || '').replace(/"/g, '""')}"`,
            v.slug || '',
            v.createdAt?.toISOString() || '',
            v.updatedAt?.toISOString() || '',
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map(row => row.join(',')),
        };
    }

    async createVolunteerFromApplicationDto(dto: CreateVolunteerFromApplicationDto, userId?: number): Promise<Volunteer> {
        const application = await this.getApplicationById(dto.applicationId);

        if (application.status !== ApplicationStatus.APPROVED) {
            throw new BadRequestException('Can only create volunteer from approved application');
        }

        // Check if volunteer already exists for this application
        const existing = await this.volunteerRepository.findOne({
            where: { applicationId: dto.applicationId },
        });

        if (existing) {
            throw new BadRequestException('Volunteer profile already exists for this application');
        }

        const volunteer = this.volunteerRepository.create({
            name: application.name,
            email: application.email.toLowerCase(),
            phone: application.phone,
            location: application.location,
            role: dto.role || 'Volunteer',
            title: dto.title,
            bio: dto.bio || application.message,
            impact: dto.impact,
            skills: application.skills,
            languages: application.languages,
            applicationId: application.id,
            status: 'active',
            slug: this.generateSlug(application.name),
            createdBy: userId,
        });

        const saved = await this.volunteerRepository.save(volunteer);

        // Link volunteer profile to application
        application.volunteerProfileId = saved.id;
        await this.applicationRepository.save(application);

        return saved;
    }

    async getVolunteerRoles(): Promise<string[]> {
        const result = await this.volunteerRepository
            .createQueryBuilder('volunteer')
            .select('DISTINCT volunteer.role', 'role')
            .where('volunteer.role IS NOT NULL')
            .getRawMany();

        return result.map(r => r.role).filter(Boolean);
    }
}