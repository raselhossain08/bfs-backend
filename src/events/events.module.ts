import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventType } from './entities/event-type.entity';
import { EventRegistration } from './entities/event-registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventType, EventRegistration])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
