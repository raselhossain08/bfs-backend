import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertTemplate } from './entities/alert-template.entity';
import { AlertBroadcast } from './entities/alert-broadcast.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlertTemplate, AlertBroadcast])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
