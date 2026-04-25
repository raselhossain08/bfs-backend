import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class SendInvitesDto {
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];

  @IsOptional()
  @IsString()
  message?: string;
}

export class GenerateReferralCodeDto {
  @IsOptional()
  @IsString()
  prefix?: string;
}

export class ReferralStatsDto {
  totalReferrals: number;
  joinedReferrals: number;
  donatedReferrals: number;
  totalReferredDonations: number;
  referralCode: string;
  badges: string[];
}

export class ReferralDto {
  id: number;
  email: string;
  name: string;
  status: 'pending' | 'joined' | 'donated';
  joinedAt?: string;
  totalDonated: number;
  donationCount: number;
}
