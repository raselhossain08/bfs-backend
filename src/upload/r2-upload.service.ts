import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';

@Injectable()
export class R2UploadService {
  private readonly logger = new Logger(R2UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Configure R2 client (S3-compatible)
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const region = this.configService.get<string>('AWS_REGION') || 'auto';
    const usePathStyle =
      this.configService.get<string>('AWS_USE_PATH_STYLE_ENDPOINT') === 'true';

    this.bucketName =
      this.configService.get<string>('AWS_BUCKET') || 'birdsfly';

    // Construct public URL from endpoint
    if (endpoint) {
      this.publicUrl = `${endpoint}/${this.bucketName}`;
    } else {
      this.publicUrl = '';
    }

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      forcePathStyle: usePathStyle,
    });

    this.logger.log('R2 Upload Service initialized');
  }

  /**
   * Upload a file buffer to R2 and return the public URL
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<{ url: string; key: string; size: number; mimeType: string }> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const extension = extname(originalName).toLowerCase();
      const sanitizedName = originalName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100);
      const key = `${folder}/${timestamp}-${random}-${sanitizedName}`;

      // Determine content type
      const contentType = mimeType || this.getContentType(extension);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
      });

      await this.s3Client.send(command);

      // Construct public URL
      const url = this.getPublicUrl(key);

      this.logger.log(`File uploaded to R2: ${key}`);

      return {
        url,
        key,
        size: buffer.length,
        mimeType: contentType,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to R2:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Upload a file from Express multer file object
   */
  async uploadMulterFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; key: string; size: number; mimeType: string }> {
    return this.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from R2: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file from R2: ${key}`, error);
      return false;
    }
  }

  /**
   * Delete multiple files from R2
   */
  async deleteFiles(
    keys: string[],
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // R2 supports batch delete, but let's do one at a time for better error handling
    for (const key of keys) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        await this.s3Client.send(command);
        success.push(key);
        this.logger.log(`File deleted from R2: ${key}`);
      } catch (error) {
        this.logger.error(`Failed to delete file from R2: ${key}`, error);
        failed.push(key);
      }
    }

    return { success, failed };
  }

  /**
   * Get a pre-signed URL for temporary file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for: ${key}`, error);
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Fallback: construct URL from config
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    return `${endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * Extract key from a public URL
   */
  extractKeyFromUrl(url: string): string | null {
    const publicUrl = this.publicUrl;
    if (url.startsWith(publicUrl)) {
      return url.replace(`${publicUrl}/`, '');
    }
    return null;
  }

  /**
   * Determine content type from file extension
   */
  private getContentType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate file type
   */
  isAllowedFileType(originalName: string): boolean {
    const allowed =
      /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mp3|wav|pdf|doc|docx|xls|xlsx|txt)$/i;
    return allowed.test(extname(originalName));
  }
}
