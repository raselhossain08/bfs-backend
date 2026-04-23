import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSuccessStoryDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    name: string;

    @IsString()
    category: string;

    @IsString()
    color: string;

    @IsString()
    region: string;

    @IsString()
    story: string;

    @IsString()
    @IsOptional()
    fullStory?: string;

    @IsString()
    impact: string;

    @IsString()
    year: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    @IsOptional()
    videoType?: string;

    @IsArray()
    @IsOptional()
    contentBlocks?: any[];

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    order?: number;

    @IsIn(['published', 'draft'])
    @IsOptional()
    status?: 'published' | 'draft';
}

export class UpdateSuccessStoryDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    region?: string;

    @IsString()
    @IsOptional()
    story?: string;

    @IsString()
    @IsOptional()
    fullStory?: string;

    @IsString()
    @IsOptional()
    impact?: string;

    @IsString()
    @IsOptional()
    year?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    @IsOptional()
    videoType?: string;

    @IsArray()
    @IsOptional()
    contentBlocks?: any[];

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    order?: number;

    @IsIn(['published', 'draft'])
    @IsOptional()
    status?: 'published' | 'draft';
}

export class SuccessStoryQueryDto {
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsOptional()
    limit?: number = 10;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    sortBy?: string = 'order';

    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class BulkSuccessStoryStatusDto {
    ids: number[];

    @IsIn(['published', 'draft'])
    status: 'published' | 'draft';
}

export class ReorderSuccessStoriesDto {
    @IsArray()
    orders: { id: number; order: number }[];
}
