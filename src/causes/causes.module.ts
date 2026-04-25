import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CausesController } from './causes.controller';
import { CausesService } from './causes.service';
import { Cause } from './entities/cause.entity';
import { CauseCategory } from './entities/cause-category.entity';
import { Donation } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cause, CauseCategory, Donation, User]),
    forwardRef(() => ReferralModule),
  ],
  controllers: [CausesController],
  providers: [CausesService],
  exports: [CausesService],
})
export class CausesModule {}
