import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsEmail,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// Event Types DTOs
export class CreateEventTypeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateEventTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class EventTypeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  status?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  sortBy?: string = 'order';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

// Events DTOs
export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  locationType?: string;

  @IsString()
  @IsOptional()
  virtualUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoType?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @IsString()
  @IsOptional()
  eventTypeName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAttendees?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  requiresRegistration?: boolean;

  @IsDateString()
  @IsOptional()
  registrationDeadline?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  organizerName?: string;

  @IsString()
  @IsOptional()
  organizerEmail?: string;

  @IsString()
  @IsOptional()
  organizerPhone?: string;

  @IsArray()
  @IsOptional()
  contentBlocks?: any[];

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  locationType?: string;

  @IsString()
  @IsOptional()
  virtualUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoType?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @IsString()
  @IsOptional()
  eventTypeName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAttendees?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  requiresRegistration?: boolean;

  @IsDateString()
  @IsOptional()
  registrationDeadline?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  organizerName?: string;

  @IsString()
  @IsOptional()
  organizerEmail?: string;

  @IsString()
  @IsOptional()
  organizerPhone?: string;

  @IsArray()
  @IsOptional()
  contentBlocks?: any[];

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class EventQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  eventTypeId?: number;

  @IsOptional()
  eventTypeName?: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requiresRegistration?: boolean;

  @IsOptional()
  sortBy?: string = 'startDate';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class BulkEventStatusDto {
  @IsArray()
  ids: number[];

  @IsString()
  status: string;
}

// Event Registrations DTOs
export class CreateEventRegistrationDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventId?: number;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfAttendees?: number = 1;
}

export class UpdateEventRegistrationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfAttendees?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class EventRegistrationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  eventId?: number;

  @IsOptional()
  status?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkRegistrationStatusDto {
  @IsArray()
  ids: number[];

  @IsString()
  status: string;
}

// Section Config DTOs
export class UpdateEventsSectionDto {
  @IsString()
  @IsOptional()
  badgeText?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  titleHighlight?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;
}
