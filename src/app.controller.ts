import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { CmsService } from './cms/cms.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cmsService: CmsService,
  ) {}

  @Get('health')
  getHealth(): string {
    return this.appService.getHello();
  }

  @Get('test')
  async getTest() {
    return { data: 'AppController is working!' };
  }

  @Get('contactSettings')
  async getContactSettings() {
    const data = await this.cmsService.getData('contactSettings');
    return { data: data || {} };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('contactSettings')
  async updateContactSettings(@Body() body: any) {
    const existing = (await this.cmsService.getData('contactSettings')) || {};
    const updated = await this.cmsService.updateData('contactSettings', {
      ...existing,
      ...body,
    });
    return { data: updated };
  }

  @Get('social')
  async getSocial() {
    const data = await this.cmsService.getData('social');
    return { data: data || {} };
  }

  @Get('footerSection')
  async getFooterSection() {
    const data = await this.cmsService.getData('footerSection');
    return { data: data || {} };
  }

  @Get('donationSection')
  async getDonationSection() {
    const data = await this.cmsService.getData('donationSection');
    return { data: data || {} };
  }

  @Get('global')
  async getGlobal() {
    const data = await this.cmsService.getData('global');
    return { data: data || {} };
  }

  @Get('donationStats')
  async getDonationStats() {
    const data = await this.cmsService.getData('donationStats');
    return { data: data || {} };
  }

  @Get('causes')
  async getCauses() {
    const data = await this.cmsService.getData('causes');
    return { data: data || [] };
  }

  @Get('services')
  async getServices() {
    const data = await this.cmsService.getData('services');
    return { data: data || [] };
  }

  @Get('events')
  async getEvents() {
    const data = await this.cmsService.getData('events');
    return { data: data || [] };
  }

  @Get('heroContent')
  async getHeroContent() {
    const data = await this.cmsService.getData('heroContent');
    return { data: data || {} };
  }

  @Get('identitySection')
  async getIdentitySection() {
    const data = await this.cmsService.getData('identitySection');
    return { data: data || {} };
  }

  @Get('impactStats')
  async getImpactStats() {
    const data = await this.cmsService.getData('impactStats');
    return { data: data || {} };
  }

  @Get('statsSection')
  async getStatsSection() {
    const data = await this.cmsService.getData('statsSection');
    return { data: data || {} };
  }

  @Get('volunteersSection')
  async getVolunteersSection() {
    const data = await this.cmsService.getData('volunteersSection');
    return { data: data || {} };
  }

  @Get('testimonials')
  async getTestimonials() {
    const data = await this.cmsService.getData('testimonials');
    return { data: data || [] };
  }

  @Post('testimonials')
  async createTestimonial(@Body() body: any) {
    const testimonials = (await this.cmsService.getData('testimonials')) || [];
    const newTestimonial = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    };
    const updated = await this.cmsService.updateData('testimonials', [
      ...testimonials,
      newTestimonial,
    ]);
    return { data: updated };
  }

  @Put('testimonials/:id')
  async updateTestimonial(@Param('id') id: string, @Body() body: any) {
    const testimonials = (await this.cmsService.getData('testimonials')) || [];
    const updated = testimonials.map((t: any) =>
      t.id === id ? { ...t, ...body } : t,
    );
    await this.cmsService.updateData('testimonials', updated);
    return { data: updated.find((t: any) => t.id === id) };
  }

  @Patch('testimonials/:id')
  async patchTestimonial(@Param('id') id: string, @Body() body: any) {
    const testimonials = (await this.cmsService.getData('testimonials')) || [];
    const updated = testimonials.map((t: any) =>
      t.id === id ? { ...t, ...body } : t,
    );
    await this.cmsService.updateData('testimonials', updated);
    return { data: updated.find((t: any) => t.id === id) };
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(@Param('id') id: string) {
    const testimonials = (await this.cmsService.getData('testimonials')) || [];
    const filtered = testimonials.filter((t: any) => t.id !== id);
    await this.cmsService.updateData('testimonials', filtered);
    return { success: true, message: 'Testimonial deleted' };
  }

  @Get('programs')
  async getPrograms() {
    const data = await this.cmsService.getData('programs');
    return { data: data || [] };
  }

  @Get('newsletter')
  async getNewsletter() {
    const data = await this.cmsService.getData('newsletter');
    return { data: data || {} };
  }

  @Get('navigation')
  async getNavigation() {
    const data = await this.cmsService.getData('navigation');
    return { data: data || [] };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('navigation')
  async updateNavigation(@Body() body: any) {
    const updated = await this.cmsService.updateData('navigation', body);
    return { data: updated };
  }
}
