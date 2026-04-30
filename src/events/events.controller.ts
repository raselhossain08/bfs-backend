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
import {
  Roles,
  ADMIN_ROLES,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
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
  UpdateEventsSectionDto,
  BulkCreateEventsDto,
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

  // ============ PUBLIC ENDPOINTS - SECTION CONFIG ============

  @Get('section-config')
  async getSectionConfig() {
    return this.eventsService.getSectionConfig();
  }

  // ============ ADMIN ENDPOINTS - SECTION CONFIG ============

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/section-config')
  async getAdminSectionConfig() {
    return this.eventsService.getSectionConfig();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/section-config')
  async updateSectionConfig(@Body() dto: UpdateEventsSectionDto) {
    const config = this.eventsService.updateSectionConfig(dto);
    return { data: config };
  }

  // ============ PUBLIC ENDPOINTS - EVENT TYPES ============

  @Get('types')
  async getPublicEventTypes() {
    const types = await this.eventsService.findActiveEventTypes();
    return { data: types };
  }

  // ============ ADMIN ENDPOINTS - EVENT TYPES ============

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/types')
  async getAdminEventTypes(@Query() query: EventTypeQueryDto) {
    return this.eventsService.findAllEventTypes(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/types/:id')
  async getEventType(@Param('id') id: string) {
    const eventType = await this.eventsService.findOneEventType(
      parseInt(id, 10),
    );
    return { data: eventType };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/types')
  async createEventType(@Body() dto: CreateEventTypeDto) {
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
    const eventType = await this.eventsService.updateEventType(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: eventType };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Delete('admin/types/:id')
  async deleteEventType(@Param('id') id: string) {
    await this.eventsService.removeEventType(parseInt(id, 10));
    return { success: true, message: 'Event type deleted' };
  }

  // ============ PUBLIC ENDPOINTS - EVENTS ============

  @Get()
  async getPublicEvents(
    @Query('limit') limit?: string,
    @Query('eventTypeId') eventTypeId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const events = await this.eventsService.findPublicEvents({
      limit: limit ? parseInt(limit, 10) : 10,
      eventTypeId: eventTypeId ? parseInt(eventTypeId, 10) : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    });
    return { data: events };
  }

  @Get('featured')
  async getFeaturedEvents(
    @Query('limit') limit?: string,
  ) {
    const events = await this.eventsService.findPublicEvents({
      limit: limit ? parseInt(limit, 10) : 5,
      isFeatured: true,
    });
    return { data: events };
  }

  // ============ ADMIN ENDPOINTS - EVENTS ============

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAdminEvents(@Query() query: EventQueryDto) {
    return this.eventsService.findAllEvents(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getEventStats() {
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

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="events-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:id')
  async getEvent(@Param('id') id: string) {
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

  /**
   * Bulk create events (admin)
   * POST /api/events/admin/bulk
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Post('admin/bulk')
  async bulkCreateEvents(@Body() dto: BulkCreateEventsDto) {
    const result = await this.eventsService.bulkCreateEvents(dto);
    return {
      success: true,
      count: result.count,
      failed: result.failed || 0,
      errors: result.errors || [],
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...EDITOR_ROLES)
  @Patch('admin/:id')
  async updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto) {
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
    const registration = await this.eventsService.findOneRegistration(
      parseInt(id, 10),
    );
    return { data: registration };
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
    const registration = await this.eventsService.updateRegistration(
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: registration };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  @Post('admin/registrations/bulk-status')
  async bulkUpdateRegistrationStatus(@Body() dto: BulkRegistrationStatusDto) {
    const result = await this.eventsService.bulkUpdateRegistrationStatus(dto);
    return {
      success: result.success,
      message: `${result.count} registrations updated`,
      count: result.count,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/:eventId/registrations/export')
  async exportRegistrations(
    @Param('eventId') eventId: string,
    @Query('format') format: 'csv' | 'json',
    @Res() res: Response,
  ) {
    const result = this.eventsService.exportRegistrations(
      parseInt(eventId, 10),
      format || 'csv',
    );

    if (format === 'json') {
      return res.json({ data: result });
    }

    const csvResult = (await result) as { headers: string; rows: string[] };
    const csvContent = `${csvResult.headers}\n${csvResult.rows.join('\n')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="registrations-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csvContent);
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

  // ============ PUBLIC ENDPOINTS - SLUG (MUST BE LAST) ============

  @Get(':slug')
  async getPublicEvent(@Param('slug') slug: string) {
    const event = await this.eventsService.findBySlug(slug);
    return { data: event };
  }
}
