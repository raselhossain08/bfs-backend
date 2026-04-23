import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Donation } from '../causes/entities/donation.entity';
import { Cause } from '../causes/entities/cause.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Article } from '../articles/entities/article.entity';
import { Program } from '../programs/entities/program.entity';
import { SuccessStory } from '../success-stories/entities/success-story.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Donation,
      Cause,
      Volunteer,
      User,
      Event,
      Article,
      Program,
      SuccessStory,
      Category,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
