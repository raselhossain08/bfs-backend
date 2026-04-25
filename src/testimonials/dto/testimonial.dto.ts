import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { TestimonialStatus } from '../entities/testimonial.entity';

export class CreateTestimonialDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  quote: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  donationAmount?: number;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateTestimonialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  quote?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  donationAmount?: number;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  @IsOptional()
  isFeatured?: boolean;
}

export class TestimonialQueryDto {
  @IsOptional()
  status?: string;

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}

export class ReorderTestimonialsDto {
  ids: number[];
}
