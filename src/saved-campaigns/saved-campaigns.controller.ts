import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Param,
    Body,
    Request,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SavedCampaignsService } from './saved-campaigns.service';
import { SavedCampaign } from './entities/saved-campaign.entity';

interface SaveCampaignDto {
    causeId: number;
    notifyOnGoal?: boolean;
    notifyOnUpdate?: boolean;
    notes?: string;
    folder?: string;
}

interface UpdateSavedCampaignDto {
    notifyOnGoal?: boolean;
    notifyOnUpdate?: boolean;
    notes?: string;
    folder?: string;
}

interface BulkRemoveDto {
    causeIds: number[];
}

@Controller('users/me/saved-campaigns')
@UseGuards(AuthGuard('jwt'))
export class SavedCampaignsController {
    constructor(private readonly savedCampaignsService: SavedCampaignsService) {}

    @Get()
    async getSavedCampaigns(
        @Request() req: any,
        @Query('folder') folder?: string,
    ): Promise<{ data: SavedCampaign[] }> {
        const savedCampaigns = await this.savedCampaignsService.getUserSavedCampaigns(
            req.user.id,
            folder ? { folder } : undefined,
        );
        return { data: savedCampaigns };
    }

    @Get('count')
    async getSavedCount(@Request() req: any): Promise<{ count: number }> {
        const count = await this.savedCampaignsService.getSavedCampaignsCount(req.user.id);
        return { count };
    }

    @Get('folders')
    async getFolders(@Request() req: any): Promise<{ data: string[] }> {
        const folders = await this.savedCampaignsService.getFolders(req.user.id);
        return { data: folders };
    }

    @Get('near-goal')
    async getNearGoal(
        @Request() req: any,
        @Query('threshold') threshold?: string,
    ): Promise<{ data: SavedCampaign[] }> {
        const thresholdValue = threshold ? parseInt(threshold, 10) : 80;
        const campaigns = await this.savedCampaignsService.getCampaignsNearGoal(
            req.user.id,
            thresholdValue,
        );
        return { data: campaigns };
    }

    @Get(':causeId/check')
    async checkIfSaved(
        @Request() req: any,
        @Param('causeId') causeId: string,
    ): Promise<{ saved: boolean }> {
        const saved = await this.savedCampaignsService.checkIfSaved(
            req.user.id,
            parseInt(causeId, 10),
        );
        return { saved };
    }

    @Post()
    async saveCampaign(
        @Request() req: any,
        @Body() dto: SaveCampaignDto,
    ): Promise<{ success: boolean; data: SavedCampaign }> {
        const savedCampaign = await this.savedCampaignsService.saveCampaign(req.user.id, dto);
        return { success: true, data: savedCampaign };
    }

    @Patch(':causeId')
    async updateSavedCampaign(
        @Request() req: any,
        @Param('causeId') causeId: string,
        @Body() dto: UpdateSavedCampaignDto,
    ): Promise<{ success: boolean; data: SavedCampaign }> {
        const savedCampaign = await this.savedCampaignsService.updateSavedCampaign(
            req.user.id,
            parseInt(causeId, 10),
            dto,
        );
        return { success: true, data: savedCampaign };
    }

    @Delete(':causeId')
    async removeSavedCampaign(
        @Request() req: any,
        @Param('causeId') causeId: string,
    ): Promise<{ success: boolean }> {
        return this.savedCampaignsService.removeSavedCampaign(
            req.user.id,
            parseInt(causeId, 10),
        );
    }

    @Post('bulk-remove')
    async bulkRemove(
        @Request() req: any,
        @Body() dto: BulkRemoveDto,
    ): Promise<{ success: boolean; count: number }> {
        return this.savedCampaignsService.bulkRemove(req.user.id, dto.causeIds);
    }
}