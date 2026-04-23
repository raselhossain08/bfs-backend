import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDonationSectionDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    badgeText?: string;

    @IsString()
    @IsOptional()
    heroImage?: string;

    @IsString()
    @IsOptional()
    primaryColor?: string;

    @IsArray()
    @IsOptional()
    impactStats?: any[];

    @IsArray()
    @IsOptional()
    impactItems?: any[];

    @IsArray()
    @IsOptional()
    amountPresets?: any[];

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    donorCount?: number;

    @IsBoolean()
    @IsOptional()
    enableRecurring?: boolean;

    @IsBoolean()
    @IsOptional()
    enableCustomAmount?: boolean;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    minAmount?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxAmount?: number;

    @IsArray()
    @IsOptional()
    securityBadges?: any[];

    @IsString()
    @IsOptional()
    thankYouMessage?: string;

    @IsBoolean()
    @IsOptional()
    receiptEnabled?: boolean;
}

export class UpdateDonationSectionDto extends CreateDonationSectionDto {}
