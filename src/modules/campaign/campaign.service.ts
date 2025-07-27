import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignGateway } from './campaign.gateway';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  private readonly FACEBOOK_GRAPH_API_URL: string;
  private readonly BEARER_TOKEN: string;
  private readonly CAMPAIGN_ID = '120231398059670228';

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly campaignGateway: CampaignGateway,
  ) {
    this.FACEBOOK_GRAPH_API_URL = this.configService.get<string>('FACEBOOK_API_URL') ?? "";
    this.BEARER_TOKEN = this.configService.get<string>('FACEBOOK_BEARER_TOKEN') ?? "";
  }

  // Cron job to fetch data every 30 seconds
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Attempting to fetch and save campaign data...');
    // Emit loading event before starting the fetch
    this.campaignGateway.server.emit('loading', true);
    await this.fetchAndSaveCampaignData();
    // Emit loadingComplete event after the process
    this.campaignGateway.server.emit('loadingComplete', false);
  }

  /**
   * Fetches campaign data from the Facebook Graph API proxy,
   * generates random performance metrics, saves the combined data to MongoDB,
   * and emits the latest entries via WebSocket.
   * @returns The saved CampaignDocument or null if an error occurred.
   */
  async fetchAndSaveCampaignData(): Promise<CampaignDocument | null> {
    try {
      // Construct the API URL with required fields
      const apiUrl = `${this.FACEBOOK_GRAPH_API_URL}${this.CAMPAIGN_ID}?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,created_time,updated_time,buying_type,bid_strategy,configured_status,source_campaign_id,spend_cap,account_id`;
      const headers = { Authorization: `Bearer ${this.BEARER_TOKEN}` };

      // Fetch data from the external API
      const response = await lastValueFrom(this.httpService.get(apiUrl, { headers }));
      const apiData = response.data;

      // Generate random data for performance metrics with low variance
      const spend = this.generateRandomNumber(500, 1000, 2); // Spend: $500.00 - $1000.00
      const ROAS = this.generateRandomNumber(1, 10, 0); // ROAS: 1 - 10 (integer)
      const CTR = this.generateRandomNumber(0.01, 0.05, 4); // CTR: 0.0100 - 0.0500 (1% - 5%)

      // Create a new campaign entry combining API data and generated metrics
      const newCampaignEntry = {
        ...apiData,
        spend,
        ROAS,
        CTR,
        timestamp: new Date(), // Current timestamp for this observation
      };

      // Save the new entry to MongoDB
      const savedCampaign = await this.campaignModel.create(newCampaignEntry);
      this.logger.log(`Successfully saved new campaign entry with ID: ${savedCampaign.id}`);

      // Fetch and emit the latest campaign entries to all connected clients
      // Fetching only a limited number of latest entries for efficiency in emission
      const latestEntries = await this.getLatestCampaignEntries(20); // Get last 20 entries for frontend display
      this.campaignGateway.server.emit('campaignUpdate', latestEntries);

      return savedCampaign;
    } catch (error) {
      this.logger.error(`Failed to fetch and save campaign data: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Generates a random number within a specified range and rounds it to a given decimal place.
   * @param min The minimum value of the range.
   * @param max The maximum value of the range.
   * @param decimalPlaces The number of decimal places to round to.
   * @returns A random number.
   */
  private generateRandomNumber(min: number, max: number, decimalPlaces: number): number {
    const value = min + Math.random() * (max - min);
    return parseFloat(value.toFixed(decimalPlaces));
  }

  /**
   * Retrieves all campaign entries from MongoDB, sorted by timestamp in descending order.
   * @returns A promise that resolves to an array of CampaignDocument.
   */
  async getAllCampaignEntries(): Promise<CampaignDocument[]> {
    return this.campaignModel.find().sort({ timestamp: -1 }).exec();
  }

  /**
   * Retrieves a limited number of the latest campaign entries from MongoDB,
   * sorted by timestamp in descending order.
   * @param limit The maximum number of entries to retrieve.
   * @returns A promise that resolves to an array of CampaignDocument.
   */
  async getLatestCampaignEntries(limit: number): Promise<CampaignDocument[]> {
    return this.campaignModel.find().sort({ timestamp: -1 }).limit(limit).exec();
  }
}