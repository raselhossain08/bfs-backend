import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteersController } from './volunteers.controller';
import { VolunteersService } from './volunteers.service';
import { VolunteerApplication } from './entities/volunteer-application.entity';
import { Volunteer } from './entities/volunteer.entity';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([VolunteerApplication, Volunteer, User]),
        EmailModule,
    ],
    controllers: [VolunteersController],
    providers: [VolunteersService],
    exports: [VolunteersService],
})
export class VolunteersModule {}