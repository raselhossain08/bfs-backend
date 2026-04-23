import { IsString, IsOptional, IsNumber, IsEmail, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    text: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    articleId?: number;

    @IsString()
    @IsOptional()
    articleSlug?: string;

    @IsString()
    @IsOptional()
    articleTitle?: string;
}

export class UpdateCommentDto {
    @IsString()
    @IsOptional()
    text?: string;

    @IsIn(['pending', 'approved', 'rejected'])
    @IsOptional()
    status?: 'pending' | 'approved' | 'rejected';

    @IsString()
    @IsOptional()
    replyText?: string;
}

export class ReplyCommentDto {
    @IsString()
    replyText: string;
}

export class BulkCommentStatusDto {
    ids: number[];

    @IsIn(['pending', 'approved', 'rejected'])
    status: 'pending' | 'approved' | 'rejected';
}

export class CommentQueryDto {
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
    sortBy?: string = 'createdAt';

    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
