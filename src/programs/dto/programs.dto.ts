import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProgramDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  beneficiaries?: number;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  metric?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  goal?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  raised?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  milestones?: { title: string; date: string; status: string }[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
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
  @Type(() => Number)
  @IsNumber()
  beneficiaries?: number;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  metric?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  goal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  raised?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

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
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
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

// Category DTOs
export class CreateProgramCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

export class UpdateProgramCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ProgramCategoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ReorderProgramCategoriesDto {
  @IsArray()
  orders: { id: number; order: number }[];
}

// Section Config DTO
export class UpdateProgramsSectionDto {
  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleHighlight?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}
