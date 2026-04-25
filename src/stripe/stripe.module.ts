import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeController } from './stripe.controller';
import { StripeSessionController } from './stripe-session.controller';
import { StripeService } from './stripe.service';
import { CmsModule } from '../cms/cms.module';
import { EmailModule } from '../email/email.module';
import { CmsItem } from '../cms/entities/cms-item.entity';
import { Cause } from '../causes/entities/cause.entity';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CmsItem, Cause, Donation, User]),
    CmsModule,
    EmailModule,
  ],
  controllers: [StripeController, StripeSessionController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
