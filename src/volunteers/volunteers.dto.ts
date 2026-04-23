import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsArray, MinLength, IsPhoneNumber, IsIn, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ApplicationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum ExperienceLevel {
    NONE = 'none',
    LESS_THAN_1 = 'less-than-1',
    ONE_TO_THREE = '1-3',
    THREE_TO_FIVE = '3-5',
    FIVE_TO_TEN = '5-10',
    TEN_PLUS = '10+',
}

export enum PreferredContact {
    EMAIL = 'email',
    PHONE = 'phone',
    WHATSAPP = 'whatsapp',
}

// ============ APPLICATION DTOs ============

export class CreateApplicationDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsString()
    location: string;

    @IsOptional()
    @IsNumber()
    causeId?: number;

    @IsOptional()
    @IsString()
    causeTitle?: string;

    @IsString()
    interest: string;

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsString()
    experience?: string;

    @IsOptional()
    @IsArray()
    availability?: string[];

    @IsOptional()
    @IsIn(['email', 'phone', 'whatsapp'])
    preferredContact?: string;

    @IsOptional()
    @IsArray()
    languages?: string[];

    @IsOptional()
    @IsBoolean()
    hasVolunteeredBefore?: boolean;

    @IsOptional()
    @IsString()
    previousVolunteerDetails?: string;

    @IsOptional()
    @IsString()
    emergencyContactName?: string;

    @IsOptional()
    @IsString()
    emergencyContactPhone?: string;

    @IsOptional()
    @IsString()
    message?: string;
}

export class UpdateApplicationStatusDto {
    @IsEnum(['pending', 'approved', 'rejected'])
    status: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class BulkStatusUpdateDto {
    @IsArray()
    ids: number[];

    @IsEnum(['pending', 'approved', 'rejected'])
    status: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class AddNoteDto {
    @IsString()
    notes: string;
}

export class ApplicationQueryDto {
    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;

    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'all'])
    status?: string;

    @IsOptional()
    search?: string;

    @IsOptional()
    causeId?: number;

    @IsOptional()
    experience?: string;

    @IsOptional()
    startDate?: string;

    @IsOptional()
    endDate?: string;

    @IsOptional()
    @IsIn(['submittedAt', 'name', 'status'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}

// ============ VOLUNTEER DTOs ============

export class SocialLinksDto {
    @IsOptional()
    @IsString()
    linkedin?: string;

    @IsOptional()
    @IsString()
    twitter?: string;

    @IsOptional()
    @IsString()
    instagram?: string;
}

export class SeoMetadataDto {
    @IsOptional()
    @IsString()
    metaTitle?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;

    @IsOptional()
    @IsString()
    keywords?: string; // Comma-separated
}

export class FundingPhaseDto {
    @IsString()
    title: string;

    @IsString()
    details: string;
}

export type ContentBlockType = 'shared.rich-text' | 'shared.quote' | 'shared.media';

export class ContentBlockDto {
    @IsIn(['shared.rich-text', 'shared.quote', 'shared.media'])
    __component: ContentBlockType;

    @IsOptional()
    @IsString()
    body?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsOptional()
    @IsString()
    caption?: string;
}

export class CreateVolunteerDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    impact?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsArray()
    languages?: string[];

    @IsOptional()
    @IsString()
    experienceTitle?: string;

    @IsOptional()
    @IsString()
    experienceSubtitle?: string;

    @IsOptional()
    @IsString()
    experienceDescription?: string;

    @IsOptional()
    @IsArray()
    @Type(() => FundingPhaseDto)
    fundingPhases?: FundingPhaseDto[];

    @IsOptional()
    @IsArray()
    @Type(() => ContentBlockDto)
    blocks?: ContentBlockDto[];

    @IsOptional()
    @Type(() => SocialLinksDto)
    socialLinks?: SocialLinksDto;

    @IsOptional()
    @Type(() => SeoMetadataDto)
    seo?: SeoMetadataDto;

    @IsOptional()
    @IsArray()
    programs?: string[];

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: string;

    @IsOptional()
    @IsNumber()
    applicationId?: number;
}

export class UpdateVolunteerDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    impact?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsArray()
    languages?: string[];

    @IsOptional()
    @IsString()
    experienceTitle?: string;

    @IsOptional()
    @IsString()
    experienceSubtitle?: string;

    @IsOptional()
    @IsString()
    experienceDescription?: string;

    @IsOptional()
    @IsArray()
    @Type(() => FundingPhaseDto)
    fundingPhases?: FundingPhaseDto[];

    @IsOptional()
    @IsArray()
    @Type(() => ContentBlockDto)
    blocks?: ContentBlockDto[];

    @IsOptional()
    @Type(() => SocialLinksDto)
    socialLinks?: SocialLinksDto;

    @IsOptional()
    @Type(() => SeoMetadataDto)
    seo?: SeoMetadataDto;

    @IsOptional()
    @IsArray()
    programs?: string[];

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: string;
}

export class VolunteerQueryDto {
    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive', 'all'])
    status?: string;

    @IsOptional()
    search?: string;

    @IsOptional()
    role?: string;

    @IsOptional()
    skill?: string;

    @IsOptional()
    program?: string;

    @IsOptional()
    startDate?: string;

    @IsOptional()
    endDate?: string;

    @IsOptional()
    @IsIn(['name', 'createdAt', 'order'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}

export class BulkVolunteerStatusDto {
    @IsArray()
    ids: number[];

    @IsEnum(['active', 'inactive'])
    status: string;
}

export class CreateVolunteerFromApplicationDto {
    @IsNumber()
    applicationId: number;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    impact?: string;
}