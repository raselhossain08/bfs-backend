import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [CmsModule],
  controllers: [GalleryController],
})
export class GalleryModule {}
