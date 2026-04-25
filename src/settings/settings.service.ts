import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getSetting(key: string): Promise<Setting | null> {
    return this.settingsRepository.findOne({ where: { key, isActive: true } });
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
    category?: string,
  ): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    const valueStr =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (setting) {
      setting.value = valueStr;
      if (category) setting.category = category;
    } else {
      setting = this.settingsRepository.create({
        key,
        value: valueStr,
        category: category || 'general',
        isActive: true,
      });
    }

    const saved = await this.settingsRepository.save(setting);
    this.logger.log(`Setting updated: ${key}`);
    return saved;
  }

  async getGlobalSettings(): Promise<any> {
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

  async updateGlobalSettings(data: any): Promise<any> {
    for (const [key, value] of Object.entries(data)) {
      await this.setSetting(key, value, 'global');
    }
    return this.getGlobalSettings();
  }

  async getContactSettings(): Promise<any> {
    const settings = (await this.getSettingValue('contactSettings')) || {};
    return {
      phone: settings.phone || '',
      email: settings.email || '',
      headquarters: settings.headquarters || {
        line1: '',
        line2: '',
        mapsUrl: '',
      },
      regionalHubs: settings.regionalHubs || [],
      socials: settings.socials || {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
      },
      services: settings.services || [],
    };
  }

  async updateContactSettings(data: any): Promise<any> {
    await this.setSetting('contactSettings', data, 'contact');
    return this.getContactSettings();
  }

  async getSmsSettings(): Promise<any> {
    const settings = (await this.getSettingValue('smsSettings')) || {};
    return {
      twilioAccountSid: settings.twilioAccountSid || '',
      twilioAuthToken: settings.twilioAuthToken ? '••••••••••••••••' : '',
      twilioPhoneNumber: settings.twilioPhoneNumber || '',
      smsEnabled: settings.smsEnabled || false,
    };
  }

  async updateSmsSettings(data: any): Promise<any> {
    const existing = (await this.getSettingValue('smsSettings')) || {};

    // If auth token is masked, keep existing
    const authToken = data.twilioAuthToken?.includes('•')
      ? existing.twilioAuthToken
      : data.twilioAuthToken;

    const updated = {
      ...existing,
      twilioAccountSid: data.twilioAccountSid || existing.twilioAccountSid,
      twilioAuthToken: authToken || existing.twilioAuthToken,
      twilioPhoneNumber: data.twilioPhoneNumber || existing.twilioPhoneNumber,
      smsEnabled: data.smsEnabled ?? existing.smsEnabled ?? false,
    };

    await this.setSetting('smsSettings', updated, 'sms');
    return this.getSmsSettings();
  }

  async getEmailSettings(): Promise<any> {
    const settings = (await this.getSettingValue('emailSettings')) || {};
    return {
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || '587',
      smtpUser: settings.smtpUser || '',
      smtpPass: settings.smtpPass ? '••••••••••••••••' : '',
      fromEmail: settings.fromEmail || '',
      fromName: settings.fromName || '',
      emailEnabled: settings.emailEnabled || false,
    };
  }

  async updateEmailSettings(data: any): Promise<any> {
    const existing = (await this.getSettingValue('emailSettings')) || {};

    // If password is masked, keep existing
    const smtpPass = data.smtpPass?.includes('•')
      ? existing.smtpPass
      : data.smtpPass;

    const updated = {
      ...existing,
      smtpHost: data.smtpHost || existing.smtpHost,
      smtpPort: data.smtpPort || existing.smtpPort,
      smtpUser: data.smtpUser || existing.smtpUser,
      smtpPass: smtpPass || existing.smtpPass,
      fromEmail: data.fromEmail || existing.fromEmail,
      fromName: data.fromName || existing.fromName,
      emailEnabled: data.emailEnabled ?? existing.emailEnabled ?? false,
    };

    await this.setSetting('emailSettings', updated, 'email');
    return this.getEmailSettings();
  }

  async getSeoSettings(): Promise<any> {
    const settings = (await this.getSettingValue('seoSettings')) || {};
    return {
      metaTitle: settings.metaTitle || '',
      metaDescription: settings.metaDescription || '',
      metaKeywords: settings.metaKeywords || '',
      ogImage: settings.ogImage || null,
      twitterCard: settings.twitterCard || 'summary_large_image',
      googleAnalyticsId: settings.googleAnalyticsId || '',
      enableSitemap: settings.enableSitemap ?? true,
      enableRobots: settings.enableRobots ?? true,
    };
  }

  async updateSeoSettings(data: any): Promise<any> {
    await this.setSetting('seoSettings', data, 'seo');
    return this.getSeoSettings();
  }

  async exportAllSettings(): Promise<any> {
    const settings = await this.settingsRepository.find({
      where: { isActive: true },
    });
    const exported = {};

    for (const setting of settings) {
      try {
        exported[setting.key] = JSON.parse(setting.value);
      } catch {
        exported[setting.key] = setting.value;
      }
    }

    return exported;
  }

  async importSettings(data: any): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setSetting(key, value);
    }
    this.logger.log('Settings imported successfully');
  }

  async resetAllSettings(): Promise<void> {
    await this.settingsRepository.update({}, { isActive: false });
    this.logger.log('All settings reset');
  }
}
