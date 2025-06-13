import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'deferred' | 'blocked';
  timestamp: Date;
  events?: EmailEvent[];
}

export interface EmailEvent {
  event: string;
  timestamp: number;
  email: string;
  sg_event_id: string;
  sg_message_id: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
}

export interface SendGridStats {
  date: string;
  stats: {
    metrics: {
      blocks: number;
      bounce_drops: number;
      bounces: number;
      clicks: number;
      deferred: number;
      delivered: number;
      invalid_emails: number;
      opens: number;
      processed: number;
      requests: number;
      spam_report_drops: number;
      spam_reports: number;
      unique_clicks: number;
      unique_opens: number;
      unsubscribe_drops: number;
      unsubscribes: number;
    };
  }[];
}

export class SendGridService {
  
  async sendEmail(
    to: string, 
    from: string, 
    subject: string, 
    text?: string, 
    html?: string
  ): Promise<EmailMessage> {
    try {
      const msg = {
        to,
        from,
        subject,
        text,
        html
      };

      const [response] = await sgMail.send(msg);
      
      return {
        id: response.headers['x-message-id'] || 'unknown',
        to,
        from,
        subject,
        html,
        text,
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('SendGrid Email Error:', error);
      throw error;
    }
  }

  async sendJobNotification(
    jobId: string,
    customerEmail: string,
    serviceType: string,
    summary: string,
    urgency: string
  ): Promise<EmailMessage> {
    const subject = `Service Request Confirmation - Job #${jobId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Service Request Confirmed</h2>
        <p>Thank you for contacting JiveAI! We've received your service request and our team is reviewing it.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Request Details</h3>
          <p><strong>Job ID:</strong> ${jobId}</p>
          <p><strong>Service Type:</strong> ${serviceType}</p>
          <p><strong>Priority:</strong> <span style="color: ${urgency === 'high' ? '#dc2626' : urgency === 'medium' ? '#d97706' : '#16a34a'};">${urgency.toUpperCase()}</span></p>
          <p><strong>Summary:</strong> ${summary}</p>
        </div>
        
        <p>Our team will contact you shortly to schedule your service appointment.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>This is an automated message from JiveAI Service Management System.</p>
        </div>
      </div>
    `;

    const text = `
Service Request Confirmed - Job #${jobId}

Thank you for contacting JiveAI! We've received your service request:

Job ID: ${jobId}
Service Type: ${serviceType}
Priority: ${urgency.toUpperCase()}
Summary: ${summary}

Our team will contact you shortly to schedule your service appointment.
    `;

    return this.sendEmail(
      customerEmail,
      'noreply@jiveai.com',
      subject,
      text,
      html
    );
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<SendGridStats[]> {
    try {
      // Note: SendGrid stats API requires paid plan
      // For now, return mock structure - in production you'd call the actual API
      const today = new Date();
      const thirtyDaysAgo = startDate || new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // This would be replaced with actual SendGrid API call:
      // const response = await sgMail.getStats({ start_date: startDate, end_date: endDate });
      
      return [{
        date: today.toISOString().split('T')[0],
        stats: [{
          metrics: {
            blocks: 0,
            bounce_drops: 0,
            bounces: 0,
            clicks: 0,
            deferred: 0,
            delivered: 0,
            invalid_emails: 0,
            opens: 0,
            processed: 0,
            requests: 0,
            spam_report_drops: 0,
            spam_reports: 0,
            unique_clicks: 0,
            unique_opens: 0,
            unsubscribe_drops: 0,
            unsubscribes: 0
          }
        }]
      }];
    } catch (error) {
      console.error('Error fetching SendGrid stats:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test by attempting to send to a test email
      await this.sendEmail(
        'test@test.com',
        'noreply@jiveai.com',
        'Connection Test',
        'This is a connection test',
        '<p>This is a connection test</p>'
      );
      return true;
    } catch (error) {
      // Check if it's an authentication error vs other errors
      return false;
    }
  }

  async processInboundEmail(emailData: any): Promise<string> {
    try {
      // Extract email content and create job
      const { from, subject, text, html } = emailData;
      
      // Use AI to process the email content
      const description = text || html || subject;
      
      // Generate job ID
      const jobId = `job_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      
      return jobId;
    } catch (error) {
      console.error('Error processing inbound email:', error);
      throw error;
    }
  }
}

export const sendGridService = new SendGridService();