import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class CampaignGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CampaignGateway.name);

  constructor(
    @Inject(forwardRef(() => CampaignService))
    private readonly campaignService: CampaignService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);
    const latestEntries = await this.campaignService.getLatestCampaignEntries(20);
    client.emit('campaignUpdate', latestEntries);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('requestCampaignData')
  async handleRequestCampaignData(client: Socket, @MessageBody() data: any): Promise<void> {
    this.logger.log(`Client ${client.id} requested full campaign data.`);
    const allEntries = await this.campaignService.getAllCampaignEntries();
    client.emit('campaignUpdate', allEntries);
  }
}