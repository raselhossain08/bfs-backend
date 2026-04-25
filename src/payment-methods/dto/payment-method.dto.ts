import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string; // Stripe PaymentMethod ID (pm_xxx)

  @IsString()
  @IsOptional()
  cardholderName?: string;
}

export class UpdatePaymentMethodDto {
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  cardholderName?: string;
}

export class SetDefaultDto {
  @IsBoolean()
  isDefault: boolean;
}
