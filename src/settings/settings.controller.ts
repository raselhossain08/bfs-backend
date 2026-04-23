import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../common/decorators/roles.decorator';
import {
    GlobalSettingsDto,
    ContactSettingsDto,
    SmsSettingsDto,
    EmailSettingsDto,
    SeoSettingsDto,
} from './dto/settings.dto';

/**
 * Settings Controller
 * Manages all system settings
 * Base path: /api/settings
 */
@Controller('settings')
export class SettingsController {
    private readonly logger = new Logger(SettingsController.name);

    constructor(private readonly settingsService: SettingsService) {}

    // ============ GLOBAL SETTINGS ============

    @Get('global')
    async getGlobalSettings() {
        const settings = await this.settingsService.getGlobalSettings();
        return { data: settings };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Patch('global')
    async updateGlobalSettings(@Body() dto: GlobalSettingsDto) {
        const settings = await this.settingsService.updateGlobalSettings(dto);
        return { success: true, data: settings };
    }

    // ============ CONTACT SETTINGS ============

    @Get('contact')
    async getContactSettings() {
        const settings = await this.settingsService.getContactSettings();
        return { data: settings };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Patch('contact')
    async updateContactSettings(@Body() dto: ContactSettingsDto) {
        const settings = await this.settingsService.updateContactSettings(dto);
        return { success: true, data: settings };
    }

    // ============ SMS SETTINGS ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('sms')
    async getSmsSettings() {
        const settings = await this.settingsService.getSmsSettings();
        return { data: settings };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Patch('sms')
    async updateSmsSettings(@Body() dto: SmsSettingsDto) {
        const settings = await this.settingsService.updateSmsSettings(dto);
        return { success: true, data: settings };
    }

    // ============ EMAIL SETTINGS ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('email')
    async getEmailSettings() {
        const settings = await this.settingsService.getEmailSettings();
        return { data: settings };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Patch('email')
    async updateEmailSettings(@Body() dto: EmailSettingsDto) {
        const settings = await this.settingsService.updateEmailSettings(dto);
        return { success: true, data: settings };
    }

    // ============ SEO SETTINGS ============

    @Get('seo')
    async getSeoSettings() {
        const settings = await this.settingsService.getSeoSettings();
        return { data: settings };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Patch('seo')
    async updateSeoSettings(@Body() dto: SeoSettingsDto) {
        const settings = await this.settingsService.updateSeoSettings(dto);
        return { success: true, data: settings };
    }

    // ============ EXPORT/IMPORT ============

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('export')
    async exportSettings() {
        const data = await this.settingsService.exportAllSettings();
        return { data };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Post('import')
    async importSettings(@Body() body: { data: any }) {
        await this.settingsService.importSettings(body.data);
        return { success: true, message: 'Settings imported successfully' };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Post('reset')
    async resetSettings() {
        await this.settingsService.resetAllSettings();
        return { success: true, message: 'All settings reset to defaults' };
    }
}
