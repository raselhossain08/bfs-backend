import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateRecurringDonationDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @IsEnum(['weekly', 'monthly', 'quarterly', 'yearly'])
  @IsOptional()
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @IsNumber()
  @IsOptional()
  paymentMethodId?: number;
}
