import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateArticleDto {
  @Transform(({ value }) => String(value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @Transform(({ value }) => String(value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @IsOptional()
  @IsUrl()
  authorImage?: string;

  @IsOptional()
  @IsString()
  authorBio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return String(value);
  })
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  contentBlocks?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  images?: string;
}

export class UpdateArticleDto {
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? String(value) : value)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? String(value) : value)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @IsOptional()
  @IsUrl()
  authorImage?: string;

  @IsOptional()
  @IsString()
  authorBio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return String(value);
  })
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  contentBlocks?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  images?: string;
}

export class ArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived', 'all'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(['title', 'createdAt', 'publishedAt', 'views', 'likes'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class PublicArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['title', 'createdAt', 'publishedAt', 'views', 'likes'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class BulkArticleStatusDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @IsEnum(['draft', 'published', 'archived'])
  status: string;
}

export class BulkImportArticlesDto {
  @IsArray()
  data: BulkArticleDto[];
}

export class BulkArticleDto {
  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null ? String(value) : undefined)
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null ? String(value) : undefined)
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsUrl()
  authorImage?: string;

  @IsOptional()
  @IsString()
  authorBio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return String(value);
  })
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  contentBlocks?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return JSON.stringify(value);
    return value;
  })
  @IsString()
  images?: string;
}
