import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    Logger,
    Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { EventsService } from './events.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES, FULL_ADMIN_ROLES, EDITOR_ROLES } from '../common/decorators/roles.decorator';
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

/**
 * Events Controller
 * Handles events, event types, and registrations
 * Base path: /api/events
 */
@Controller('events')
export class EventsController {
    private readonly logger = new Logger(EventsController.name);

    constructor(private readonly eventsService: EventsService) {}

    // ============ PUBLIC ENDPOINTS - EVENT TYPES ============

    @Get('types')
    async getPublicEventTypes() {
        const types = await this.eventsService.findActiveEventTypes();
        return { data: types };
    }

    @Get('event-types')
    async getPublicEventTypesLegacy() {
        return this.getPublicEventTypes();
    }

    // ============ PUBLIC ENDPOINTS - EVENTS ============

    @Get()
    async getPublicEvents(
        @Query('limit') limit?: string,
        @Query('eventTypeId') eventTypeId?: string,
        @Query('isFeatured') isFeatured?: string
    ) {
        const events = await this.eventsService.findPublicEvents({
            limit: limit ? parseInt(limit, 10) : 10,
            eventTypeId: eventTypeId ? parseInt(eventTypeId, 10) : undefined,
            isFeatured: isFeatured === 'true' ? true : undefined,
        });
        return { data: events };
    }

    @Get('events')
    async getPublicEventsLegacy(
        @Query('limit') limit?: string,
        @Query('eventTypeId') eventTypeId?: string,
        @Query('isFeatured') isFeatured?: string
    ) {
        return this.getPublicEvents(limit, eventTypeId, isFeatured);
    }

    // ============ ADMIN ENDPOINTS - EVENT TYPES ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/types')
    async getAdminEventTypes(@Query() query: EventTypeQueryDto) {
        return this.eventsService.findAllEventTypes(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/event-types')
    async getAdminEventTypesLegacy(@Query() query: EventTypeQueryDto, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.eventsService.findAllEventTypes(query);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/types/:id')
    async getEventType(@Param('id') id: string) {
        const eventType = await this.eventsService.findOneEventType(parseInt(id, 10));
        return { data: eventType };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/event-types/:id')
    async getEventTypeLegacy(@Param('id') id: string, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: null, message: 'Access denied' };
        }
        const eventType = await this.eventsService.findOneEventType(parseInt(id, 10));
        return { data: eventType };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/types')
    async createEventType(@Body() dto: CreateEventTypeDto) {
        const eventType = await this.eventsService.createEventType(dto);
        return { success: true, data: eventType };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('admin/event-types')
    async createEventTypeLegacy(@Body() dto: CreateEventTypeDto, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can create event types' };
        }
        const eventType = await this.eventsService.createEventType(dto);
        return { success: true, data: eventType };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/types/:id')
    async updateEventType(
        @Param('id') id: string,
        @Body() dto: UpdateEventTypeDto,
    ) {
        const eventType = await this.eventsService.updateEventType(parseInt(id, 10), dto);
        return { success: true, data: eventType };
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('admin/event-types/:id')
    async updateEventTypeLegacy(
        @Param('id') id: string,
        @Body() dto: UpdateEventTypeDto,
        @Request() req: any,
    ) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        const eventType = await this.eventsService.updateEventType(parseInt(id, 10), dto);
        return { success: true, data: eventType };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Delete('admin/types/:id')
    async deleteEventType(@Param('id') id: string) {
        await this.eventsService.removeEventType(parseInt(id, 10));
        return { success: true, message: 'Event type deleted' };
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/event-types/:id')
    async deleteEventTypeLegacy(@Param('id') id: string, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can delete event types' };
        }
        await this.eventsService.removeEventType(parseInt(id, 10));
        return { success: true, message: 'Event type deleted' };
    }

    // ============ ADMIN ENDPOINTS - EVENTS ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin')
    async getAdminEvents(@Query() query: EventQueryDto) {
        return this.eventsService.findAllEvents(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/events')
    async getAdminEventsLegacy(@Query() query: EventQueryDto, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.eventsService.findAllEvents(query);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/stats')
    async getEventStats() {
        const stats = await this.eventsService.getEventStats();
        return { data: stats };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/events/stats')
    async getEventStatsLegacy(@Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, totalRegistrations: 0, totalViews: 0 } };
        }
        const stats = await this.eventsService.getEventStats();
        return { data: stats };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/export')
    async exportEvents(
        @Query('format') format: 'csv' | 'json',
        @Query() query: EventQueryDto,
        @Res() res: Response,
    ) {
        const result = this.eventsService.exportEvents(format || 'csv', query);

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="events-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/events/export')
    async exportEventsLegacy(
        @Query('format') format: 'csv' | 'json',
        @Query() query: EventQueryDto,
        @Request() req: any,
        @Res() res: Response,
    ) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const result = this.eventsService.exportEvents(format || 'csv', query);

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="events-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    // ============ ADMIN ENDPOINTS - REGISTRATIONS ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/registrations')
    async getAdminRegistrations(@Query() query: EventRegistrationQueryDto) {
        return this.eventsService.findAllRegistrations(query);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/registrations/:id')
    async getRegistration(@Param('id') id: string) {
        const registration = await this.eventsService.findOneRegistration(parseInt(id, 10));
        return { data: registration };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/events/:eventId/registrations')
    async getEventRegistrationsLegacy(
        @Param('eventId') eventId: string,
        @Query() query: EventRegistrationQueryDto,
        @Request() req: any,
    ) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: [], total: 0, message: 'Access denied' };
        }
        return this.eventsService.findAllRegistrations({
            ...query,
            eventId: parseInt(eventId, 10),
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('admin/registrations')
    async createRegistration(@Body() dto: CreateEventRegistrationDto) {
        const registration = await this.eventsService.createRegistration(dto);
        return { success: true, data: registration };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/registrations/:id')
    async updateRegistration(
        @Param('id') id: string,
        @Body() dto: UpdateEventRegistrationDto,
    ) {
        const registration = await this.eventsService.updateRegistration(parseInt(id, 10), dto);
        return { success: true, data: registration };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/registrations/bulk-status')
    async bulkUpdateRegistrationStatus(
        @Body() dto: BulkRegistrationStatusDto,
    ) {
        const result = await this.eventsService.bulkUpdateRegistrationStatus(dto);
        return {
            success: result.success,
            message: `${result.count} registrations updated`,
            count: result.count,
        };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/:eventId/registrations')
    async getEventRegistrations(
        @Param('eventId') eventId: string,
        @Query() query: EventRegistrationQueryDto,
    ) {
        return this.eventsService.findAllRegistrations({
            ...query,
            eventId: parseInt(eventId, 10),
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/:eventId/registrations/export')
    async exportRegistrations(
        @Param('eventId') eventId: string,
        @Query('format') format: 'csv' | 'json',
        @Res() res: Response,
    ) {
        const result = this.eventsService.exportRegistrations(parseInt(eventId, 10), format || 'csv');

        if (format === 'json') {
            return res.json({ data: result });
        }

        const csvResult = await result as { headers: string; rows: string[] };
        const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="registrations-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`
        );
        return res.send(csvContent);
    }

    // ============ DYNAMIC ADMIN ROUTES (AFTER all specific admin paths) ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin/:id')
    async getEvent(@Param('id') id: string) {
        const event = await this.eventsService.findOneEvent(parseInt(id, 10));
        return { data: event };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/events/:id')
    async getEventLegacy(@Param('id') id: string, @Request() req: any) {
        if (!ADMIN_ROLES.includes(req.user?.role)) {
            return { data: null, message: 'Access denied' };
        }
        const event = await this.eventsService.findOneEvent(parseInt(id, 10));
        return { data: event };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Post('admin')
    async createEvent(@Body() dto: CreateEventDto) {
        const event = await this.eventsService.createEvent(dto);
        return { success: true, data: event };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('admin/events')
    async createEventLegacy(@Body() dto: CreateEventDto, @Request() req: any) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins and editors can create events' };
        }
        const event = await this.eventsService.createEvent(dto);
        return { success: true, data: event };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin/:id')
    async updateEvent(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
    ) {
        const event = await this.eventsService.updateEvent(parseInt(id, 10), dto);
        return { success: true, data: event };
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('admin/events/:id')
    async updateEventLegacy(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
        @Request() req: any,
    ) {
        if (!EDITOR_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Access denied' };
        }
        const event = await this.eventsService.updateEvent(parseInt(id, 10), dto);
        return { success: true, data: event };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Delete('admin/:id')
    async deleteEvent(@Param('id') id: string) {
        await this.eventsService.removeEvent(parseInt(id, 10));
        return { success: true, message: 'Event deleted' };
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/events/:id')
    async deleteEventLegacy(@Param('id') id: string, @Request() req: any) {
        if (!FULL_ADMIN_ROLES.includes(req.user?.role)) {
            return { success: false, message: 'Only admins can delete events' };
        }
        await this.eventsService.removeEvent(parseInt(id, 10));
        return { success: true, message: 'Event deleted' };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/bulk-status')
    async bulkUpdateStatus(@Body() dto: BulkEventStatusDto) {
        const result = await this.eventsService.bulkUpdateStatus(dto);
        return {
            success: result.success,
            message: `${result.count} events updated`,
            count: result.count,
        };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...FULL_ADMIN_ROLES)
    @Post('admin/bulk-delete')
    async bulkDelete(@Body('ids') ids: number[]) {
        const result = await this.eventsService.bulkDelete(ids);
        return {
            success: result.success,
            message: `${result.count} events deleted`,
            count: result.count,
        };
    }

    // ============ PUBLIC ENDPOINTS - SLUG (MUST BE LAST) ============

    @Get(':slug')
    async getPublicEvent(@Param('slug') slug: string) {
        const event = await this.eventsService.findBySlug(slug);
        return { data: event };
    }

    @Get('events/:slug')
    async getPublicEventLegacy(@Param('slug') slug: string) {
        return this.getPublicEvent(slug);
    }

    // ============ PUBLIC ENDPOINTS - REGISTRATIONS ============

    @Post(':eventId/register')
    async registerForEvent(
        @Param('eventId') eventId: string,
        @Body() dto: CreateEventRegistrationDto,
    ) {
        const registration = await this.eventsService.createRegistration({
            ...dto,
            eventId: parseInt(eventId, 10),
        });
        return { success: true, data: registration };
    }

    @Post('events/:eventId/register')
    async registerForEventLegacy(
        @Param('eventId') eventId: string,
        @Body() dto: CreateEventRegistrationDto,
    ) {
        return this.registerForEvent(eventId, dto);
    }
}