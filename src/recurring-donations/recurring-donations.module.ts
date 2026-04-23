import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringDonationsController } from './recurring-donations.controller';
import { RecurringDonationsService } from './recurring-donations.service';
import { RecurringDonation } from './entities/recurring-donation.entity';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Cause } from '../causes/entities/cause.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RecurringDonation,
            User,
            PaymentMethod,
            Cause,
        ]),
    ],
    controllers: [RecurringDonationsController],
    providers: [RecurringDonationsService],
    exports: [RecurringDonationsService],
})
export class RecurringDonationsModule {}
