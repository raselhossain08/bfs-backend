import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

// Cause Category DTOs
export class CreateCauseCategoryDto {
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
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    status?: string;
}

export class UpdateCauseCategoryDto {
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
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    status?: string;
}

export class CauseCategoryQueryDto {
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
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

// Cause DTOs
export class CreateCauseDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    shortDescription?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsArray()
    @IsOptional()
    gallery?: string[];

    @IsArray()
    @IsOptional()
    videos?: { url: string; type: string; caption?: string }[];

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @IsString()
    @IsOptional()
    tag?: string;

    @IsString()
    @IsOptional()
    tagColor?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    goal?: number;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    impact?: string;

    @IsString()
    @IsOptional()
    metric?: string;

    @IsString()
    @IsOptional()
    gradient?: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    glow?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    @IsOptional()
    videoType?: string;

    @IsArray()
    @IsOptional()
    contentBlocks?: any[];

    @IsString()
    @IsOptional()
    metaTitle?: string;

    @IsString()
    @IsOptional()
    metaDescription?: string;

    @IsString()
    @IsOptional()
    metaKeywords?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsBoolean()
    @IsOptional()
    isUrgent?: boolean;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    order?: number;

    @IsOptional()
    endDate?: Date;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    beneficiaries?: number;

    @IsString()
    @IsOptional()
    currency?: string;
}

export class UpdateCauseDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    shortDescription?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsArray()
    @IsOptional()
    gallery?: string[];

    @IsArray()
    @IsOptional()
    videos?: { url: string; type: string; caption?: string }[];

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @IsString()
    @IsOptional()
    tag?: string;

    @IsString()
    @IsOptional()
    tagColor?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    goal?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    raised?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    donors?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    progress?: number;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    impact?: string;

    @IsString()
    @IsOptional()
    metric?: string;

    @IsString()
    @IsOptional()
    gradient?: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    glow?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    @IsOptional()
    videoType?: string;

    @IsArray()
    @IsOptional()
    contentBlocks?: any[];

    @IsString()
    @IsOptional()
    metaTitle?: string;

    @IsString()
    @IsOptional()
    metaDescription?: string;

    @IsString()
    @IsOptional()
    metaKeywords?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsBoolean()
    @IsOptional()
    isUrgent?: boolean;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    order?: number;

    @IsOptional()
    endDate?: Date;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    beneficiaries?: number;

    @IsString()
    @IsOptional()
    currency?: string;
}

export class CauseQueryDto {
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    status?: string;

    @IsOptional()
    @Type(() => Number)
    categoryId?: number;

    @IsOptional()
    isFeatured?: boolean;

    @IsOptional()
    search?: string;

    @IsOptional()
    sortBy?: string = 'order';

    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class BulkCauseStatusDto {
    ids: number[];

    @IsString()
    status: string;
}

export class ReorderCausesDto {
    @IsArray()
    orders: { id: number; order: number }[];
}

export class ReorderCauseCategoriesDto {
    @IsArray()
    orders: { id: number; order: number }[];
}

// Donation DTOs
export class CreateDonationDto {
    @IsString()
    transactionId: string;

    @IsNumber()
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    @IsOptional()
    causeId?: number;

    @IsString()
    @IsOptional()
    causeName?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsNumber()
    @IsOptional()
    donorId?: number;

    @IsString()
    name: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    motivation?: string;

    @IsBoolean()
    @IsOptional()
    isAnonymous?: boolean;
}

export class UpdateDonationDto {
    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    motivation?: string;
}

export class DonationQueryDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 10;

    @IsOptional()
    causeId?: number;

    @IsOptional()
    status?: string;

    @IsOptional()
    search?: string;

    @IsOptional()
    sortBy?: string = 'createdAt';

    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkDonationStatusDto {
    ids: number[];

    @IsString()
    status: string;
}
