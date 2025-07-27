import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class CampaignGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CampaignGateway.name);

   constructor(
    @Inject(forwardRef(() => CampaignService))
    private readonly campaignService: CampaignService,
  ) {}
  /**
   * Handles new client connections to the WebSocket.
   * On connection, sends the latest campaign entries to the newly connected client.
   * @param client The connected Socket.IO client.
   */
  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Emit loading event before sending initial data
    client.emit('loading', true);
    const latestEntries = await this.campaignService.getLatestCampaignEntries(20); // Send last 20 entries
    client.emit('campaignUpdate', latestEntries);
    client.emit('loadingComplete', false);
  }

  /**
   * Handles client disconnections from the WebSocket.
   * @param client The disconnected Socket.IO client.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handles a 'requestCampaignData' message from a client.
   * Sends all available campaign entries to the requesting client.
   * @param client The Socket.IO client that sent the message.
   * @param data Any data sent with the message (currently unused).
   */
  @SubscribeMessage('requestCampaignData')
  async handleRequestCampaignData(client: Socket, @MessageBody() data: any): Promise<void> {
    this.logger.log(`Client ${client.id} requested full campaign data.`);
    client.emit('loading', true);
    const allEntries = await this.campaignService.getAllCampaignEntries();
    client.emit('campaignUpdate', allEntries); // Send all data
    client.emit('loadingComplete', false);
  }
}