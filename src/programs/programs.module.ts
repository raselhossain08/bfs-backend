import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { ProgramCategory } from './entities/program-category.entity';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Program, ProgramCategory])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
