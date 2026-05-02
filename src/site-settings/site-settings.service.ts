import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from './entities/site-setting.entity';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    @InjectRepository(SiteSetting)
    private siteSettingsRepository: Repository<SiteSetting>,
  ) {}

  async getSetting(key: string): Promise<SiteSetting | null> {
    return this.siteSettingsRepository.findOne({
      where: { key, isActive: true },
    });
  }

  async getSettingValue(key: string): Promise<any> {
    const setting = await this.getSetting(key);
    if (!setting) return null;
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  async setSetting(
    key: string,
    value: any,
    group?: string,
  ): Promise<SiteSetting> {
    let setting = await this.siteSettingsRepository.findOne({ where: { key } });

    const valueStr =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (setting) {
      setting.value = valueStr;
      if (group) setting.group = group;
    } else {
      setting = this.siteSettingsRepository.create({
        key,
        value: valueStr,
        group: group || 'general',
        isActive: true,
      });
    }

    const saved = await this.siteSettingsRepository.save(setting);
    this.logger.log(`Site setting updated: ${key}`);
    return saved;
  }

  async getAllSettings(group?: string): Promise<SiteSetting[]> {
    const where: any = { isActive: true };
    if (group) where.group = group;
    return this.siteSettingsRepository.find({ where, order: { key: 'ASC' } });
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.getSetting(key);
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    await this.siteSettingsRepository.remove(setting);
    this.logger.log(`Site setting deleted: ${key}`);
  }

  async getSiteInfo(): Promise<any> {
    const keys = [
      'siteName',
      'siteDescription',
      'logo',
      'favicon',
      'primaryColor',
      'fontFamily',
      'enableAnimations',
      'maintenanceMode',
    ];
    const settings: Record<string, any> = {};

    for (const key of keys) {
      settings[key] = await this.getSettingValue(key);
    }

    return {
      siteName: settings.siteName || 'Birdsfly Sangstha',
      siteDescription: settings.siteDescription || '',
      logo: settings.logo || null,
      favicon: settings.favicon || null,
      primaryColor: settings.primaryColor || '#14b8a6',
      fontFamily: settings.fontFamily || 'font-sans',
      enableAnimations: settings.enableAnimations ?? true,
      maintenanceMode: settings.maintenanceMode ?? false,
    };
  }

  async updateSiteInfo(data: any): Promise<any> {
    for (const [key, value] of Object.entries(data)) {
      await this.setSetting(key, value, 'site');
    }
    return this.getSiteInfo();
  }
}
