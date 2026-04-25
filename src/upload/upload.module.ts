import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { R2UploadService } from './r2-upload.service';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [R2UploadService],
  exports: [R2UploadService],
})
export class UploadModule {}
