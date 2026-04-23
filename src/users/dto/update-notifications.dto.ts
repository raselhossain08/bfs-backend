import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
    @IsBoolean()
    @IsOptional()
    emailReceipts?: boolean;

    @IsBoolean()
    @IsOptional()
    emailUpdates?: boolean;

    @IsBoolean()
    @IsOptional()
    emailMarketing?: boolean;

    @IsBoolean()
    @IsOptional()
    smsAlerts?: boolean;

    @IsBoolean()
    @IsOptional()
    loginAlerts?: boolean;

    @IsBoolean()
    @IsOptional()
    securityAlerts?: boolean;
}
