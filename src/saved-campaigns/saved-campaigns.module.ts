import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedCampaign } from './entities/saved-campaign.entity';
import { SavedCampaignsController } from './saved-campaigns.controller';
import { SavedCampaignsService } from './saved-campaigns.service';
import { Cause } from '../causes/entities/cause.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedCampaign, Cause])],
  controllers: [SavedCampaignsController],
  providers: [SavedCampaignsService],
  exports: [SavedCampaignsService],
})
export class SavedCampaignsModule {}
