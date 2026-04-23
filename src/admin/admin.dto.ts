import { IsEmail, IsString, IsOptional, IsEnum, MinLength, IsArray, IsIn } from 'class-validator';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    EDITOR = 'editor',
    MANAGER = 'manager',
    USER = 'user',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

export class CreateAdminDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsString()
    avatar?: string;
}

export class UpdateAdminDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    avatar?: string;
}

export class UpdateRoleDto {
    @IsEnum(UserRole)
    role: UserRole;
}

export class UpdateStatusDto {
    @IsEnum(UserStatus)
    status: UserStatus;
}

export class AdminListQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    status?: string;
}

export class BulkUpdateDto {
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];

    @IsString()
    value: string; // status or role value
}

export class BulkDeleteDto {
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
}

function IsNumber(arg0: {}, arg1: { each: boolean }) {
    return function (target: any, propertyKey: string) {
        // Validation logic
    };
}