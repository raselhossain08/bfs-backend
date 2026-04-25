import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationSectionController } from './donation-section.controller';
import { DonationSectionService } from './donation-section.service';
import { DonationSection } from './entities/donation-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DonationSection])],
  controllers: [DonationSectionController],
  providers: [DonationSectionService],
  exports: [DonationSectionService],
})
export class DonationsModule {}
