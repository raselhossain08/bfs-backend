import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { Cause } from '../causes/entities/cause.entity';
import { Event } from '../events/entities/event.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation, User, Cause, Event, Volunteer]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
