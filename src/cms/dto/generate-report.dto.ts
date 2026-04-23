import { IsEnum, IsString, IsOptional, IsArray } from 'class-validator';

export enum ReportType {
    DONATIONS = 'donations',
    VOLUNTEERS = 'volunteers',
    EVENTS = 'events',
    SUBSCRIBERS = 'subscribers',
    CONTACTS = 'contacts',
    CAMPAIGNS = 'campaigns',
}

export class GenerateReportDto {
    @IsEnum(ReportType)
    type: ReportType;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    fields?: string[];

    @IsOptional()
    startDate?: Date;

    @IsOptional()
    endDate?: Date;
}

export class ReportResponseDto {
    id: string;
    title: string;
    description: string;
    type: string;
    date: string;
    size: string;
    color: string;
    status: 'completed' | 'processing' | 'failed';
    recordCount?: number;
    downloadUrl?: string;
}