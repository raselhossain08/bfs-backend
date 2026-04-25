import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsItem } from './entities/cms-item.entity';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([CmsItem]), forwardRef(() => SmsModule)],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
