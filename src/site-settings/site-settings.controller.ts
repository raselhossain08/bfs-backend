import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SiteSettingsService } from './site-settings.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../common/decorators/roles.decorator';

@Controller('site-settings')
export class SiteSettingsController {
  private readonly logger = new Logger(SiteSettingsController.name);

  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async getAllSettings(@Query('group') group?: string) {
    const data = await this.siteSettingsService.getAllSettings(group);
    return { data };
  }

  @Get('site-info')
  async getSiteInfo() {
    const data = await this.siteSettingsService.getSiteInfo();
    return { data };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Patch('site-info')
  async updateSiteInfo(@Body() body: any) {
    const data = await this.siteSettingsService.updateSiteInfo(body);
    return { success: true, data };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post()
  async setSetting(@Body() body: { key: string; value: any; group?: string }) {
    const data = await this.siteSettingsService.setSetting(body.key, body.value, body.group);
    return { success: true, data };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    await this.siteSettingsService.deleteSetting(key);
    return { success: true, message: `Setting "${key}" deleted` };
  }
}