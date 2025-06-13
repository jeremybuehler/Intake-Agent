import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error("TWILIO_ACCOUNT_SID environment variable must be set");
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error("TWILIO_AUTH_TOKEN environment variable must be set");
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface TwilioMessage {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateSent?: Date;
  errorCode?: number;
  errorMessage?: string;
  price?: string;
  priceUnit?: string;
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
}

export interface TwilioCall {
  sid: string;
  status: string;
  to: string;
  from: string;
  duration?: string;
  startTime?: Date;
  endTime?: Date;
  price?: string;
  priceUnit?: string;
  direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  recordingUrl?: string;
}

export class TwilioService {
  
  async sendSMS(to: string, body: string, from?: string): Promise<TwilioMessage> {
    try {
      const message = await twilioClient.messages.create({
        to,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        body
      });

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent || undefined,
        errorCode: message.errorCode ? Number(message.errorCode) : undefined,
        errorMessage: message.errorMessage || undefined,
        price: message.price || undefined,
        priceUnit: message.priceUnit || undefined,
        direction: message.direction as any
      };
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      throw error;
    }
  }

  async getMessages(limit: number = 50): Promise<TwilioMessage[]> {
    try {
      const messages = await twilioClient.messages.list({ limit });
      return messages.map(msg => ({
        sid: msg.sid,
        status: msg.status,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent || undefined,
        errorCode: msg.errorCode || undefined,
        errorMessage: msg.errorMessage || undefined,
        price: msg.price || undefined,
        priceUnit: msg.priceUnit || undefined,
        direction: msg.direction as any
      }));
    } catch (error) {
      console.error('Error fetching Twilio messages:', error);
      throw error;
    }
  }

  async getCalls(limit: number = 50): Promise<TwilioCall[]> {
    try {
      const calls = await twilioClient.calls.list({ limit });
      return calls.map(call => ({
        sid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        duration: call.duration || undefined,
        startTime: call.startTime || undefined,
        endTime: call.endTime || undefined,
        price: call.price || undefined,
        priceUnit: call.priceUnit || undefined,
        direction: call.direction as any,
        recordingUrl: undefined // Will be populated from recordings if needed
      }));
    } catch (error) {
      console.error('Error fetching Twilio calls:', error);
      throw error;
    }
  }

  async getAccountInfo() {
    try {
      const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      return {
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated,
        dateUpdated: account.dateUpdated
      };
    } catch (error) {
      console.error('Error fetching Twilio account info:', error);
      throw error;
    }
  }

  async getPhoneNumbers() {
    try {
      const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
      return phoneNumbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: number.capabilities,
        smsUrl: number.smsUrl,
        voiceUrl: number.voiceUrl,
        dateCreated: number.dateCreated
      }));
    } catch (error) {
      console.error('Error fetching Twilio phone numbers:', error);
      throw error;
    }
  }

  async getUsage(category: 'sms' | 'calls' | 'all' = 'all') {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const usage = await twilioClient.usage.records.list({
        startDate,
        endDate: today,
        category: category === 'all' ? undefined : category
      });

      return usage.map(record => ({
        category: record.category,
        description: record.description,
        usage: record.usage,
        usageUnit: record.usageUnit,
        count: record.count,
        countUnit: record.countUnit,
        price: record.price,
        priceUnit: record.priceUnit,
        startDate: record.startDate,
        endDate: record.endDate
      }));
    } catch (error) {
      console.error('Error fetching Twilio usage:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const twilioService = new TwilioService();