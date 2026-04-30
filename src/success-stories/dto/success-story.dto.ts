import { IsString, IsOptional, IsNumber, IsIn, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateSuccessStoryDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  story?: string;

  @IsString()
  @IsOptional()
  fullStory?: string;

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
  impact?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ? String(value) : undefined)
  year?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value ? [value] : []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoType?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  contentBlocks?: any[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsIn(['published', 'draft'])
  @IsOptional()
  status?: 'published' | 'draft';

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value ? [value] : []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  metaKeywords?: string[];
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
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  story?: string;

  @IsString()
  @IsOptional()
  fullStory?: string;

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
  impact?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ? String(value) : undefined)
  year?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value ? [value] : []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoType?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  contentBlocks?: any[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsIn(['published', 'draft'])
  @IsOptional()
  status?: 'published' | 'draft';

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value ? [value] : []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  metaKeywords?: string[];
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

// Bulk import DTO
export class BulkCreateSuccessStoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSuccessStoryDto)
  items: CreateSuccessStoryDto[];
}
