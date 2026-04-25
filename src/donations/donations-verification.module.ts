import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationVerificationController } from './donation-verification.controller';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donation, User])],
  controllers: [DonationVerificationController],
})
export class DonationsVerificationModule {}
