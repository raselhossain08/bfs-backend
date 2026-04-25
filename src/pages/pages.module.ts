import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { Page } from './entities/page.entity';
import { Section } from './entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Section])],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
