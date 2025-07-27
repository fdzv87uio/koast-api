import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true }) // Mongoose will automatically add createdAt and updatedAt fields
export class Campaign {
  @Prop({ required: true })
  id: string; // Facebook Ad Campaign ID

  @Prop()
  name: string;

  @Prop()
  objective: string;

  @Prop()
  status: string;

  @Prop()
  effective_status: string;

  @Prop()
  start_time: string;

  @Prop()
  created_time: string;

  @Prop()
  updated_time: string;

  @Prop()
  buying_type: string;

  @Prop()
  configured_status: string;

  @Prop()
  source_campaign_id: string;

  @Prop()
  account_id: string;

  // Additional random generated fields
  @Prop({ required: true })
  spend: number; // in dollars

  @Prop({ required: true })
  ROAS: number; // Return on Ad Spend, in integers

  @Prop({ required: true })
  CTR: number; // Click-Through Rate, as a ratio (e.g., 0.015)

  @Prop({ required: true })
  timestamp: Date; // Datetime in readable format
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);