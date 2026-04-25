import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class CreateRecurringDonationDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(['weekly', 'monthly', 'quarterly', 'yearly'])
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @IsNumber()
  @IsOptional()
  causeId?: number;

  @IsNumber()
  paymentMethodId: number;
}
