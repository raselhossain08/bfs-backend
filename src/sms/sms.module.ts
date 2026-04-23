import { Module, forwardRef } from '@nestjs/common';
import { SmsService } from './sms.service';
import { CmsModule } from '../cms/cms.module';

@Module({
    imports: [forwardRef(() => CmsModule)],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}