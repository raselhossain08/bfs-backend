import { IsString, IsOptional, IsEmail, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(10)
    timezone?: string;

    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(5)
    language?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    avatar?: string;
}
