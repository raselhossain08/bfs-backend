import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEmail } from 'class-validator';

// Service Category DTOs
export class CreateServiceCategoryDto {
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

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    status?: string;
}

export class UpdateServiceCategoryDto {
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

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    status?: string;
}

export class ServiceCategoryQueryDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
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

// Service DTOs
export class CreateServiceDto {
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

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsArray()
    @IsOptional()
    gallery?: string[];

    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @IsString()
    @IsOptional()
    missionTitle?: string;

    @IsString()
    @IsOptional()
    missionSubtitle?: string;

    @IsString()
    @IsOptional()
    missionDescription?: string;

    @IsArray()
    @IsOptional()
    directives?: { title: string; details: string }[];

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

    @IsNumber()
    @IsOptional()
    order?: number;
}

export class UpdateServiceDto {
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

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsArray()
    @IsOptional()
    gallery?: string[];

    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @IsString()
    @IsOptional()
    missionTitle?: string;

    @IsString()
    @IsOptional()
    missionSubtitle?: string;

    @IsString()
    @IsOptional()
    missionDescription?: string;

    @IsArray()
    @IsOptional()
    directives?: { title: string; details: string }[];

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

    @IsNumber()
    @IsOptional()
    order?: number;
}

export class ServiceQueryDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 10;

    @IsOptional()
    status?: string;

    @IsOptional()
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

export class BulkServiceStatusDto {
    ids: number[];

    @IsString()
    status: string;
}

// Service Inquiry DTOs
export class CreateServiceInquiryDto {
    @IsNumber()
    serviceId: number;

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
    message?: string;
}

export class UpdateServiceInquiryDto {
    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    assignedTo?: number;
}

export class ServiceInquiryQueryDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 10;

    @IsOptional()
    serviceId?: number;

    @IsOptional()
    status?: string;

    @IsOptional()
    search?: string;

    @IsOptional()
    sortBy?: string = 'createdAt';

    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkInquiryStatusDto {
    ids: number[];

    @IsString()
    status: string;
}

export class ReorderServicesDto {
    @IsArray()
    orders: { id: number; order: number }[];
}

export class ReorderCategoriesDto {
    @IsArray()
    orders: { id: number; order: number }[];
}