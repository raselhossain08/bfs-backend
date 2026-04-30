import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'super_admin')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { entityType: string },
    @Body('userId') userId: number,
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.entityType) {
      throw new BadRequestException('Entity type is required');
    }

    const validTypes = ['donations', 'users', 'causes', 'events', 'volunteers'];
    if (!validTypes.includes(body.entityType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid entity type. Valid types: ${validTypes.join(', ')}`,
      );
    }

    return this.importService.importFromCSV(
      body.entityType,
      file.buffer,
      userId,
    );
  }

  @Post('json')
  @UseInterceptors(FileInterceptor('file'))
  async importJSON(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { entityType: string },
    @Body('userId') userId: number,
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.entityType) {
      throw new BadRequestException('Entity type is required');
    }

    const validTypes = ['donations', 'users', 'causes', 'events', 'volunteers'];
    if (!validTypes.includes(body.entityType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid entity type. Valid types: ${validTypes.join(', ')}`,
      );
    }

    return this.importService.importFromJSON(
      body.entityType,
      file.buffer,
      userId,
    );
  }
}
