import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { R2UploadService } from './r2-upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly r2UploadService: R2UploadService) {}

  /**
   * Upload a file to R2 (protected endpoint)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        const isAllowed = file.originalname.match(
          /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mp3|wav|pdf|doc|docx|xls|xlsx|txt)$/i,
        );
        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new Error('File type not allowed'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    try {
      const result = await this.r2UploadService.uploadMulterFile(
        file,
        (folder || 'uploads').replace(/[^a-zA-Z0-9\-_./]/g, ''),
      );

      return {
        success: true,
        data: {
          id: Date.now().toString(),
          url: result.url,
          key: result.key,
          filename: file.originalname,
          size: result.size,
          mimeType: result.mimeType,
        },
      };
    } catch (error) {
      this.logger.error('Upload failed:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Delete a file from R2 (protected endpoint)
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('file/:key')
  async deleteFile(@Param('key') key: string) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // Security: validate key format (should be alphanumeric with dashes, slashes, dots)
    const validKey = key.replace(/[^a-zA-Z0-9\-_./]/g, '');
    if (validKey !== key) {
      throw new BadRequestException('Invalid file key');
    }

    const success = await this.r2UploadService.deleteFile(validKey);

    if (success) {
      this.logger.log(`File deleted: ${validKey}`);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } else {
      return {
        success: true,
        message: 'File already deleted or not found',
      };
    }
  }

  /**
   * Delete a file from R2 using query param (supports keys with slashes)
   * Example: DELETE /upload/file?key=uploads%2F123-test.png
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('file')
  async deleteFileByQuery(@Query('key') key?: string) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    const validKey = key.replace(/[^a-zA-Z0-9\-_./]/g, '');
    if (validKey !== key) {
      throw new BadRequestException('Invalid file key');
    }

    const success = await this.r2UploadService.deleteFile(validKey);

    if (success) {
      this.logger.log(`File deleted: ${validKey}`);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } else {
      return {
        success: true,
        message: 'File already deleted or not found',
      };
    }
  }

  /**
   * Delete multiple files from R2 (protected endpoint)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('delete-batch')
  async deleteBatch(@Body() body: { keys: string[] }) {
    const { keys } = body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return {
        success: true,
        message: 'No files to delete',
      };
    }

    // Security: validate all keys
    const validKeys = keys
      .map((key) => {
        const sanitized = key.replace(/[^a-zA-Z0-9\-_./]/g, '');
        return sanitized === key ? key : null;
      })
      .filter((key): key is string => key !== null);

    const results = await this.r2UploadService.deleteFiles(validKeys);

    return {
      success: true,
      message: `Deleted ${results.success.length}/${validKeys.length} files`,
      results: {
        deleted: results.success,
        failed: results.failed,
      },
    };
  }
}
