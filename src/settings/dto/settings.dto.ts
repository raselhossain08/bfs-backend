import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class GlobalSettingsDto {
  @IsString()
  @IsOptional()
  siteName?: string;

  @IsString()
  @IsOptional()
  siteDescription?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  favicon?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsBoolean()
  @IsOptional()
  enableAnimations?: boolean;

  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;
}

export class ContactSettingsDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsOptional()
  headquarters?: {
    line1: string;
    line2: string;
    mapsUrl: string;
  };

  @IsObject()
  @IsOptional()
  regionalHubs?: Array<{
    name: string;
    address: string;
    phone: string;
    mapsUrl: string;
  }>;

  @IsObject()
  @IsOptional()
  socials?: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };

  @IsObject()
  @IsOptional()
  services?: string[];
}

export class SmsSettingsDto {
  @IsString()
  @IsOptional()
  twilioAccountSid?: string;

  @IsString()
  @IsOptional()
  twilioAuthToken?: string;

  @IsString()
  @IsOptional()
  twilioPhoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;
}

export class EmailSettingsDto {
  @IsString()
  @IsOptional()
  smtpHost?: string;

  @IsString()
  @IsOptional()
  smtpPort?: string;

  @IsString()
  @IsOptional()
  smtpUser?: string;

  @IsString()
  @IsOptional()
  smtpPass?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;
}

export class SeoSettingsDto {
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
  ogImage?: string;

  @IsString()
  @IsOptional()
  twitterCard?: string;

  @IsString()
  @IsOptional()
  googleAnalyticsId?: string;

  @IsBoolean()
  @IsOptional()
  enableSitemap?: boolean;

  @IsBoolean()
  @IsOptional()
  enableRobots?: boolean;
}
