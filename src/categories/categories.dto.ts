import { IsString, IsOptional, IsNumber, IsEnum, IsArray, MinLength, MaxLength, IsHexColor, IsUrl } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    slug: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsUrl()
    image?: string;

    @IsOptional()
    @IsHexColor()
    color?: string;

    @IsOptional()
    @IsHexColor()
    iconColor?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: string;

    @IsOptional()
    @IsNumber()
    parentId?: number;

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
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsUrl()
    image?: string;

    @IsOptional()
    @IsHexColor()
    color?: string;

    @IsOptional()
    @IsHexColor()
    iconColor?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: string;

    @IsOptional()
    @IsNumber()
    parentId?: number;

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
}

export class CategoryQueryDto {
    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsEnum(['active', 'inactive', 'all'])
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsNumber()
    parentId?: number;

    @IsOptional()
    @IsEnum(['name', 'order', 'createdAt'])
    sortBy?: string;

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}

export class ReorderCategoriesDto {
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    orders: number[];
}

export class BulkStatusDto {
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];

    @IsEnum(['active', 'inactive'])
    status: string;
}