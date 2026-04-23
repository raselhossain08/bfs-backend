import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual, Like, IsNull, Not } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventType } from './entities/event-type.entity';
import { EventRegistration } from './entities/event-registration.entity';
import {
    CreateEventDto,
    UpdateEventDto,
    EventQueryDto,
    BulkEventStatusDto,
    CreateEventTypeDto,
    UpdateEventTypeDto,
    EventTypeQueryDto,
    CreateEventRegistrationDto,
    UpdateEventRegistrationDto,
    EventRegistrationQueryDto,
    BulkRegistrationStatusDto,
} from './dto/events.dto';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(EventType)
        private eventTypeRepository: Repository<EventType>,
        @InjectRepository(EventRegistration)
        private registrationRepository: Repository<EventRegistration>,
    ) {}

    // ============ EVENT TYPES ============

    async createEventType(dto: CreateEventTypeDto): Promise<EventType> {
        const slug = dto.slug || this.generateSlug(dto.name);

        const existing = await this.eventTypeRepository.findOne({
            where: { slug },
        });

        if (existing) {
            throw new BadRequestException(`Event type with slug '${slug}' already exists`);
        }

        const eventType = this.eventTypeRepository.create({
            ...dto,
            slug,
            status: dto.status || 'active',
            order: dto.order || 0,
        });

        const saved = await this.eventTypeRepository.save(eventType);
        this.logger.log(`Event type created: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    async findAllEventTypes(query: EventTypeQueryDto) {
        const { page = 1, limit = 10, status, search, sortBy = 'order', sortOrder = 'ASC' } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.eventTypeRepository.createQueryBuilder('eventType');

        if (status && status !== 'all') {
            queryBuilder.andWhere('eventType.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(eventType.name ILIKE :search OR eventType.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        queryBuilder.orderBy(`eventType.${sortBy}`, sortOrder);
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

    async findActiveEventTypes(): Promise<EventType[]> {
        return this.eventTypeRepository.find({
            where: { status: 'active' },
            order: { order: 'ASC' },
        });
    }

    async findOneEventType(id: number): Promise<EventType> {
        const eventType = await this.eventTypeRepository.findOne({
            where: { id },
        });

        if (!eventType) {
            throw new NotFoundException(`Event type with id ${id} not found`);
        }

        return eventType;
    }

    async updateEventType(id: number, dto: UpdateEventTypeDto): Promise<EventType> {
        const eventType = await this.findOneEventType(id);

        if (dto.slug && dto.slug !== eventType.slug) {
            const existing = await this.eventTypeRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Event type with slug '${dto.slug}' already exists`);
            }
        }

        Object.assign(eventType, dto);
        const saved = await this.eventTypeRepository.save(eventType);
        this.logger.log(`Event type updated: ${saved.name} (id: ${saved.id})`);

        return saved;
    }

    async removeEventType(id: number): Promise<{ success: boolean }> {
        const eventType = await this.findOneEventType(id);

        // Check if any events are using this type
        const eventsCount = await this.eventRepository.count({
            where: { eventTypeId: id },
        });

        if (eventsCount > 0) {
            throw new BadRequestException(
                `Cannot delete event type. ${eventsCount} events are using this type.`
            );
        }

        await this.eventTypeRepository.remove(eventType);
        this.logger.log(`Event type deleted: ${eventType.name} (id: ${id})`);

        return { success: true };
    }

    // ============ EVENTS ============

    async createEvent(dto: CreateEventDto): Promise<Event> {
        const slug = dto.slug || this.generateSlug(dto.title);

        const existingSlug = await this.eventRepository.findOne({
            where: { slug },
        });

        if (existingSlug) {
            throw new BadRequestException(`Event with slug '${slug}' already exists`);
        }

        // Validate event type if provided
        if (dto.eventTypeId) {
            const eventType = await this.eventTypeRepository.findOne({
                where: { id: dto.eventTypeId },
            });
            if (!eventType) {
                throw new NotFoundException(`Event type with id ${dto.eventTypeId} not found`);
            }
        }

        const event = this.eventRepository.create({
            ...dto,
            slug,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : undefined,
            status: dto.status || 'Upcoming',
            views: 0,
            likes: 0,
            currentAttendees: 0,
        });

        const saved = await this.eventRepository.save(event);
        this.logger.log(`Event created: ${saved.title} (id: ${saved.id})`);

        return this.findOneEvent(saved.id);
    }

    async findAllEvents(query: EventQueryDto) {
        const {
            page = 1,
            limit = 10,
            status,
            eventTypeId,
            eventTypeName,
            location,
            startDate,
            endDate,
            search,
            isFeatured,
            requiresRegistration,
            sortBy = 'startDate',
            sortOrder = 'ASC',
        } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.eventType', 'eventType');

        // Apply filters
        if (status && status !== 'all') {
            queryBuilder.andWhere('event.status = :status', { status });
        }

        if (eventTypeId) {
            queryBuilder.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId });
        }

        if (eventTypeName) {
            queryBuilder.andWhere('event.eventTypeName ILIKE :eventTypeName', {
                eventTypeName: `%${eventTypeName}%`,
            });
        }

        if (location) {
            queryBuilder.andWhere('event.location ILIKE :location', { location: `%${location}%` });
        }

        if (startDate) {
            queryBuilder.andWhere('event.startDate >= :startDate', { startDate: new Date(startDate) });
        }

        if (endDate) {
            queryBuilder.andWhere('event.endDate <= :endDate', { endDate: new Date(endDate) });
        }

        if (search) {
            queryBuilder.andWhere(
                '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (isFeatured !== undefined) {
            queryBuilder.andWhere('event.isFeatured = :isFeatured', { isFeatured });
        }

        if (requiresRegistration !== undefined) {
            queryBuilder.andWhere('event.requiresRegistration = :requiresRegistration', { requiresRegistration });
        }

        // Apply sorting
        queryBuilder.orderBy(`event.${sortBy}`, sortOrder);

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

    async findPublicEvents(query: { limit?: number; eventTypeId?: number; isFeatured?: boolean }) {
        const { limit = 10, eventTypeId, isFeatured } = query;

        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.eventType', 'eventType')
            .where('event.status IN (:...statuses)', { statuses: ['Upcoming', 'Ongoing'] });

        if (eventTypeId) {
            queryBuilder.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId });
        }

        if (isFeatured) {
            queryBuilder.andWhere('event.isFeatured = :isFeatured', { isFeatured: true });
        }

        queryBuilder.orderBy('event.startDate', 'ASC').take(limit);

        return queryBuilder.getMany();
    }

    async findOneEvent(id: number): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['eventType'],
        });

        if (!event) {
            throw new NotFoundException(`Event with id ${id} not found`);
        }

        return event;
    }

    async findBySlug(slug: string): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { slug },
            relations: ['eventType'],
        });

        if (!event) {
            throw new NotFoundException(`Event with slug '${slug}' not found`);
        }

        // Increment views
        await this.eventRepository.increment({ id: event.id }, 'views', 1);

        return event;
    }

    async updateEvent(id: number, dto: UpdateEventDto): Promise<Event> {
        const event = await this.findOneEvent(id);

        // Check for duplicate slug if being changed
        if (dto.slug && dto.slug !== event.slug) {
            const existing = await this.eventRepository.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new BadRequestException(`Event with slug '${dto.slug}' already exists`);
            }
        }

        // Validate event type if being changed
        if (dto.eventTypeId !== undefined && dto.eventTypeId !== null) {
            const eventType = await this.eventTypeRepository.findOne({
                where: { id: dto.eventTypeId },
            });
            if (!eventType) {
                throw new NotFoundException(`Event type with id ${dto.eventTypeId} not found`);
            }
        }

        Object.assign(event, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : event.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : event.endDate,
            registrationDeadline: dto.registrationDeadline
                ? new Date(dto.registrationDeadline)
                : event.registrationDeadline,
        });

        const saved = await this.eventRepository.save(event);
        this.logger.log(`Event updated: ${saved.title} (id: ${saved.id})`);

        return this.findOneEvent(saved.id);
    }

    async removeEvent(id: number): Promise<{ success: boolean }> {
        const event = await this.findOneEvent(id);
        await this.eventRepository.remove(event);
        this.logger.log(`Event deleted: ${event.title} (id: ${id})`);

        return { success: true };
    }

    async bulkUpdateStatus(dto: BulkEventStatusDto): Promise<{ success: boolean; count: number }> {
        const result = await this.eventRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        this.logger.log(`Bulk status update: ${result.affected} events set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async bulkDelete(ids: number[]): Promise<{ success: boolean; count: number }> {
        const result = await this.eventRepository.delete({ id: In(ids) });
        
        this.logger.log(`Bulk delete: ${result.affected} events deleted`);
        
        return { success: true, count: result.affected || 0 };
    }

    async getEventStats(): Promise<{
        total: number;
        upcoming: number;
        ongoing: number;
        completed: number;
        cancelled: number;
        totalRegistrations: number;
        totalViews: number;
    }> {
        const [total, upcoming, ongoing, completed, cancelled, registrations, views] = await Promise.all([
            this.eventRepository.count(),
            this.eventRepository.count({ where: { status: 'Upcoming' } }),
            this.eventRepository.count({ where: { status: 'Ongoing' } }),
            this.eventRepository.count({ where: { status: 'Completed' } }),
            this.eventRepository.count({ where: { status: 'Cancelled' } }),
            this.registrationRepository.count(),
            this.eventRepository
                .createQueryBuilder('event')
                .select('SUM(event.views)', 'total')
                .getRawOne(),
        ]);

        return {
            total,
            upcoming,
            ongoing,
            completed,
            cancelled,
            totalRegistrations: registrations,
            totalViews: parseInt(views?.total || '0', 10),
        };
    }

    async exportEvents(format: 'csv' | 'json', query: EventQueryDto) {
        const { data } = await this.findAllEvents({ ...query, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID',
            'Title',
            'Slug',
            'Status',
            'Start Date',
            'End Date',
            'Location',
            'Type',
            'Max Attendees',
            'Current Attendees',
            'Views',
            'Created At',
        ];

        const rows = data.map((event) => [
            event.id,
            `"${(event.title || '').replace(/"/g, '""')}"`,
            event.slug,
            event.status,
            event.startDate?.toISOString() || '',
            event.endDate?.toISOString() || '',
            `"${(event.location || '').replace(/"/g, '""')}"`,
            event.eventTypeName || event.eventType?.name || '',
            event.maxAttendees || '',
            event.currentAttendees || '',
            event.views || 0,
            event.createdAt?.toISOString() || '',
        ]);

        return {
            headers: headers.join(','),
            rows: rows.map((row) => row.join(',')),
        };
    }

    // ============ EVENT REGISTRATIONS ============

    async createRegistration(dto: CreateEventRegistrationDto): Promise<EventRegistration> {
        if (!dto.eventId) {
            throw new BadRequestException('Event ID is required');
        }
        const event = await this.findOneEvent(dto.eventId);

        if (event.requiresRegistration && event.maxAttendees) {
            const currentCount = await this.registrationRepository.count({
                where: {
                    eventId: dto.eventId,
                    status: In(['registered', 'confirmed']),
                },
            });

            if (currentCount + (dto.numberOfAttendees ?? 1) > event.maxAttendees) {
                throw new BadRequestException(
                    `Event is at capacity. ${event.maxAttendees - currentCount} spots remaining.`
                );
            }
        }

        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            throw new BadRequestException('Registration deadline has passed');
        }

        const registration = this.registrationRepository.create({
            ...dto,
            status: 'registered',
        });

        const saved = await this.registrationRepository.save(registration);

        // Update current attendees count
        await this.eventRepository.increment(
            { id: dto.eventId },
            'currentAttendees',
            dto.numberOfAttendees || 1
        );

        this.logger.log(`Registration created for event ${dto.eventId}: ${saved.name}`);

        return saved;
    }

    async findAllRegistrations(query: EventRegistrationQueryDto) {
        const {
            page = 1,
            limit = 10,
            eventId,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.registrationRepository
            .createQueryBuilder('registration')
            .leftJoinAndSelect('registration.event', 'event');

        if (eventId) {
            queryBuilder.andWhere('registration.eventId = :eventId', { eventId });
        }

        if (status && status !== 'all') {
            queryBuilder.andWhere('registration.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(registration.name ILIKE :search OR registration.email ILIKE :search OR registration.organization ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        queryBuilder.orderBy(`registration.${sortBy}`, sortOrder);
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

    async findOneRegistration(id: number): Promise<EventRegistration> {
        const registration = await this.registrationRepository.findOne({
            where: { id },
            relations: ['event'],
        });

        if (!registration) {
            throw new NotFoundException(`Registration with id ${id} not found`);
        }

        return registration;
    }

    async updateRegistration(id: number, dto: UpdateEventRegistrationDto): Promise<EventRegistration> {
        const registration = await this.findOneRegistration(id);

        const oldStatus = registration.status;
        Object.assign(registration, dto);

        const saved = await this.registrationRepository.save(registration);

        // Update attendee count if status changed
        if (dto.status && dto.status !== oldStatus) {
            const attendeeDiff =
                dto.status === 'cancelled'
                    ? -registration.numberOfAttendees
                    : oldStatus === 'cancelled'
                    ? registration.numberOfAttendees
                    : 0;

            if (attendeeDiff !== 0) {
                await this.eventRepository.increment(
                    { id: registration.eventId },
                    'currentAttendees',
                    attendeeDiff
                );
            }
        }

        this.logger.log(`Registration updated: ${saved.id}`);

        return saved;
    }

    async bulkUpdateRegistrationStatus(
        dto: BulkRegistrationStatusDto
    ): Promise<{ success: boolean; count: number }> {
        const result = await this.registrationRepository.update(
            { id: In(dto.ids) },
            { status: dto.status }
        );

        this.logger.log(`Bulk registration status update: ${result.affected} registrations set to ${dto.status}`);

        return { success: true, count: result.affected || 0 };
    }

    async exportRegistrations(eventId: number, format: 'csv' | 'json') {
        const { data } = await this.findAllRegistrations({ eventId, limit: 10000 });

        if (format === 'json') {
            return data;
        }

        // CSV format
        const headers = [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Organization',
            'Number of Attendees',
            'Status',
            'Event',
            'Created At',
        ];

        const rows = data.map((reg) => [
            reg.id,
            `"${(reg.name || '').replace(/"/g, '""')}"`,
            reg.email,
            reg.phone || '',
            `"${(reg.organization || '').replace(/"/g, '""')}"`,
            reg.numberOfAttendees,
            reg.status,
            `"${(reg.event?.title || '').replace(/"/g, '""')}"`,
            reg.createdAt?.toISOString() || '',
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
}