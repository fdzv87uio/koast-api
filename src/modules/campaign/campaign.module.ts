import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignService } from './campaign.service';
import { CampaignGateway } from './campaign.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Campaign.name, schema: CampaignSchema }]),
    HttpModule,
  ],
  providers: [CampaignService, CampaignGateway],
  exports: [CampaignService],
  controllers: [],
})

export class CampaignModule {}