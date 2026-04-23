import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsArray } from 'class-validator';

export class CreateProgramDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    shortDescription?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsArray()
    gallery?: string[];

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    beneficiaries?: string;

    @IsOptional()
    @IsString()
    impact?: string;

    @IsOptional()
    @IsString()
    metric?: string;

    @IsOptional()
    @IsArray()
    milestones?: { title: string; date: string; status: string }[];

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsOptional()
    @IsString()
    videoType?: string;

    @IsOptional()
    @IsArray()
    contentBlocks?: any[];

    @IsOptional()
    @IsString()
    metaTitle?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;

    @IsOptional()
    @IsString()
    metaKeywords?: string;

    @IsOptional()
    @IsEnum(['active', 'completed', 'pending', 'on-hold', 'draft'])
    status?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsNumber()
    order?: number;
}

export class UpdateProgramDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    shortDescription?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsArray()
    gallery?: string[];

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    beneficiaries?: string;

    @IsOptional()
    @IsString()
    impact?: string;

    @IsOptional()
    @IsString()
    metric?: string;

    @IsOptional()
    @IsArray()
    milestones?: { title: string; date: string; status: string }[];

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsOptional()
    @IsString()
    videoType?: string;

    @IsOptional()
    @IsArray()
    contentBlocks?: any[];

    @IsOptional()
    @IsString()
    metaTitle?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;

    @IsOptional()
    @IsString()
    metaKeywords?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsNumber()
    order?: number;
}

export class ProgramQueryDto {
    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(['title', 'order', 'createdAt', 'views'])
    sortBy?: string;

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}

export class BulkProgramStatusDto {
    @IsArray()
    ids: number[];

    @IsString()
    status: string;
}

export class ReorderProgramsDto {
    @IsArray()
    orders: { id: number; order: number }[];
}