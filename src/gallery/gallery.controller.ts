import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CmsService } from '../cms/cms.service';

interface GalleryImage {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  location: string;
  photographer: string;
  captureDate: string;
  order: number;
}

@Controller('gallery')
export class GalleryController {
  private readonly logger = new Logger(GalleryController.name);

  constructor(private readonly cmsService: CmsService) {}

  @Get('images')
  async getGalleryImages() {
    const data = await this.cmsService.getData('galleryImages');
    const images = data || [];

    // Transform old format to new format if needed
    const transformedImages = images.map((img: any) => ({
      id: img.id?.toString() || `img-${Date.now()}-${Math.random()}`,
      title: img.title || img.alt || 'Untitled',
      category: img.category || 'General',
      description: img.description || '',
      image: img.image || img.src || '',
      location: img.location || '',
      photographer: img.photographer || '',
      captureDate: img.captureDate || new Date().toISOString().split('T')[0],
      order: img.order || 0,
    }));

    return { data: transformedImages };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('images')
  async updateGalleryImages(@Body() images: GalleryImage[]) {
    // Ensure all images have proper format
    const formattedImages = images.map((img, index) => ({
      ...img,
      id: img.id?.toString() || `img-${Date.now()}-${index}`,
      order: img.order || index,
    }));

    await this.cmsService.updateData('galleryImages', formattedImages);
    return { data: formattedImages, message: 'Gallery updated successfully' };
  }

  @Get('images/:id')
  async getGalleryImage(@Param('id') id: string) {
    const data = await this.cmsService.getData('galleryImages');
    const images = data || [];
    const image = images.find((img: any) => img.id?.toString() === id);

    if (!image) {
      return { data: null, message: 'Image not found' };
    }

    // Transform to new format
    const transformedImage = {
      id: image.id?.toString(),
      title: image.title || image.alt || 'Untitled',
      category: image.category || 'General',
      description: image.description || '',
      image: image.image || image.src || '',
      location: image.location || '',
      photographer: image.photographer || '',
      captureDate: image.captureDate || new Date().toISOString().split('T')[0],
      order: image.order || 0,
    };

    return { data: transformedImage };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('images/:id')
  async deleteGalleryImage(@Param('id') id: string) {
    const data = await this.cmsService.getData('galleryImages');
    const images = data || [];
    const filteredImages = images.filter(
      (img: any) => img.id?.toString() !== id,
    );

    await this.cmsService.updateData('galleryImages', filteredImages);
    return { success: true, message: 'Image deleted successfully' };
  }
}
