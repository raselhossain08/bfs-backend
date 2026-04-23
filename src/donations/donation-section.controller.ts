import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DonationSectionService } from './donation-section.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES, EDITOR_ROLES } from '../common/decorators/roles.decorator';
import { UpdateDonationSectionDto } from './dto/donation-section.dto';

/**
 * Donation Section Controller
 * Manages donation page configuration
 * Base path: /api/donation-section
 */
@Controller('donation-section')
export class DonationSectionController {
    private readonly logger = new Logger(DonationSectionController.name);

    constructor(private readonly donationSectionService: DonationSectionService) {}

    /**
     * Get donation section configuration (public)
     * GET /api/donation-section
     */
    @Get()
    async getDonationSection() {
        const section = await this.donationSectionService.getOrCreateDefault();
        return { data: section };
    }

    /**
     * Get donation section configuration (admin)
     * GET /api/donation-section/admin
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...ADMIN_ROLES)
    @Get('admin')
    async getAdminDonationSection() {
        const section = await this.donationSectionService.getOrCreateDefault();
        return { data: section };
    }

    /**
     * Update donation section (admin)
     * PATCH /api/donation-section/admin
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...EDITOR_ROLES)
    @Patch('admin')
    async updateDonationSection(@Body() dto: UpdateDonationSectionDto) {
        const section = await this.donationSectionService.getOrCreateDefault();
        const updated = await this.donationSectionService.update(section.id, dto);
        return { success: true, data: updated };
    }
}
