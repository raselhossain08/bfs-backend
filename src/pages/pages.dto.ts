import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// Page DTOs
export class CreatePageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(['static', 'dynamic'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsEnum(['published', 'draft'])
  status?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(['static', 'dynamic'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsEnum(['published', 'draft'])
  status?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(['published', 'draft', 'all'])
  status?: string;

  @IsOptional()
  @IsEnum(['static', 'dynamic', 'all'])
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['title', 'order', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class BulkPageStatusDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @IsEnum(['published', 'draft'])
  status: string;
}

export class ReorderPagesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

// Section DTOs
export class CreateSectionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cmsEndpoint?: string;

  @IsOptional()
  @IsEnum(['published', 'draft'])
  status?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cmsEndpoint?: string;

  @IsOptional()
  @IsEnum(['published', 'draft'])
  status?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class ReorderSectionsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
