import type { Express } from "express";
import { twilioClient } from "./twilio-client";
import { sendGridService } from "./sendgrid-client";

export interface ConsolidatedMetrics {
  period: string;
  twilio: {
    sms: {
      sent: number;
      delivered: number;
      failed: number;
      cost: number;
    };
    voice: {
      calls: number;
      minutes: number;
      cost: number;
    };
    account: {
      status: string;
      balance?: string;
    };
  };
  sendgrid: {
    emails: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
    };
  };
  system: {
    jobs: number;
    avgProcessingTime: number;
    avgConfidence: number;
    successRate: number;
  };
}

export interface APILog {
  id: string;
  timestamp: Date;
  service: 'twilio' | 'sendgrid' | 'system';
  type: 'sms' | 'voice' | 'email' | 'job' | 'webhook';
  status: 'success' | 'failed' | 'pending';
  message: string;
  details: any;
  cost?: number;
  duration?: number;
}

export function registerApiDashboardRoutes(app: Express) {
  
  // Get consolidated metrics from all services
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const period = req.query.period as string || '24h';
      
      // Get Twilio data
      const [messages, calls, account] = await Promise.allSettled([
        twilioClient.messages.list({ limit: 100 }),
        twilioClient.calls.list({ limit: 100 }),
        twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()
      ]);
      
      // Process Twilio metrics
      const twilioSms = messages.status === 'fulfilled' ? messages.value : [];
      const twilioCalls = calls.status === 'fulfilled' ? calls.value : [];
      const twilioAccount = account.status === 'fulfilled' ? account.value : null;
      
      const smsMetrics = {
        sent: twilioSms.filter(m => m.status === 'sent' || m.status === 'delivered').length,
        delivered: twilioSms.filter(m => m.status === 'delivered').length,
        failed: twilioSms.filter(m => m.status === 'failed' || m.status === 'undelivered').length,
        cost: twilioSms.reduce((sum, m) => sum + (parseFloat(m.price || '0') * -1), 0)
      };
      
      const voiceMetrics = {
        calls: twilioCalls.length,
        minutes: twilioCalls.reduce((sum, c) => sum + parseInt(c.duration || '0'), 0) / 60,
        cost: twilioCalls.reduce((sum, c) => sum + (parseFloat(c.price || '0') * -1), 0)
      };
      
      // Get SendGrid stats (would be real API call in production)
      const emailMetrics = {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
      };
      
      // Get system metrics from existing endpoint
      const systemResponse = await fetch('http://localhost:5000/api/metrics');
      const systemMetrics = await systemResponse.json();
      
      const consolidatedMetrics: ConsolidatedMetrics = {
        period,
        twilio: {
          sms: smsMetrics,
          voice: voiceMetrics,
          account: {
            status: twilioAccount?.status || 'unknown',
            balance: twilioAccount?.balance || undefined
          }
        },
        sendgrid: {
          emails: emailMetrics
        },
        system: {
          jobs: systemMetrics.totalJobs || 0,
          avgProcessingTime: systemMetrics.avgProcessingTime || 0,
          avgConfidence: systemMetrics.avgConfidence || 0,
          successRate: 95.5 // Calculate from actual data
        }
      };
      
      res.json(consolidatedMetrics);
      
    } catch (error) {
      console.error('Error fetching consolidated metrics:', error);
      res.status(500).json({ error: 'Failed to fetch consolidated metrics' });
    }
  });
  
  // Get real-time logs from all services
  app.get("/api/dashboard/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const service = req.query.service as string;
      
      const logs: APILog[] = [];
      
      // Get Twilio logs
      if (!service || service === 'twilio') {
        const [messages, calls] = await Promise.allSettled([
          twilioClient.messages.list({ limit: 25 }),
          twilioClient.calls.list({ limit: 25 })
        ]);
        
        if (messages.status === 'fulfilled') {
          messages.value.forEach(msg => {
            logs.push({
              id: msg.sid,
              timestamp: msg.dateCreated,
              service: 'twilio',
              type: 'sms',
              status: msg.status === 'delivered' ? 'success' : 
                      msg.status === 'failed' || msg.status === 'undelivered' ? 'failed' : 'pending',
              message: `SMS ${msg.direction} ${msg.from} → ${msg.to}`,
              details: {
                body: msg.body,
                errorCode: msg.errorCode,
                errorMessage: msg.errorMessage
              },
              cost: msg.price ? parseFloat(msg.price) * -1 : undefined
            });
          });
        }
        
        if (calls.status === 'fulfilled') {
          calls.value.forEach(call => {
            logs.push({
              id: call.sid,
              timestamp: call.dateCreated,
              service: 'twilio',
              type: 'voice',
              status: call.status === 'completed' ? 'success' : 
                      call.status === 'failed' || call.status === 'canceled' ? 'failed' : 'pending',
              message: `Call ${call.direction} ${call.from} → ${call.to}`,
              details: {
                duration: call.duration,
                startTime: call.startTime,
                endTime: call.endTime
              },
              cost: call.price ? parseFloat(call.price) * -1 : undefined,
              duration: call.duration ? parseInt(call.duration) : undefined
            });
          });
        }
      }
      
      // Get system logs from job records
      if (!service || service === 'system') {
        const jobsResponse = await fetch('http://localhost:5000/api/jobs?limit=25');
        const jobs = await jobsResponse.json();
        
        jobs.forEach((job: any) => {
          logs.push({
            id: job.job_id,
            timestamp: new Date(job.submitted_at),
            service: 'system',
            type: 'job',
            status: 'success',
            message: `Job intake ${job.service_type} (${job.urgency} priority)`,
            details: {
              customerName: job.customer_name,
              source: job.source,
              confidence: job.ai_confidence,
              processingTime: job.processing_time_ms
            },
            duration: job.processing_time_ms
          });
        });
      }
      
      // Sort logs by timestamp (newest first)
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      res.json(logs.slice(0, limit));
      
    } catch (error) {
      console.error('Error fetching API logs:', error);
      res.status(500).json({ error: 'Failed to fetch API logs' });
    }
  });
  
  // Test all API connections
  app.get("/api/dashboard/test-connections", async (req, res) => {
    try {
      const results = {
        twilio: { connected: false, error: null as string | null },
        sendgrid: { connected: false, error: null as string | null },
        database: { connected: false, error: null as string | null },
        openai: { connected: false, error: null as string | null }
      };
      
      // Test Twilio
      try {
        await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
        results.twilio.connected = true;
      } catch (error) {
        results.twilio.error = error instanceof Error ? error.message : 'Connection failed';
      }
      
      // Test SendGrid
      try {
        await sendGridService.testConnection();
        results.sendgrid.connected = true;
      } catch (error) {
        results.sendgrid.error = error instanceof Error ? error.message : 'Connection failed';
      }
      
      // Test Database
      try {
        const healthResponse = await fetch('http://localhost:5000/api/system/health');
        const health = await healthResponse.json();
        results.database.connected = health.services.database === 'connected';
        results.openai.connected = health.services.openai === 'connected';
      } catch (error) {
        results.database.error = 'Health check failed';
        results.openai.error = 'Health check failed';
      }
      
      res.json(results);
      
    } catch (error) {
      console.error('Error testing connections:', error);
      res.status(500).json({ error: 'Failed to test connections' });
    }
  });
  
  // Get Twilio phone numbers and webhooks
  app.get("/api/dashboard/twilio/numbers", async (req, res) => {
    try {
      const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
      
      const numbers = phoneNumbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        smsUrl: number.smsUrl,
        voiceUrl: number.voiceUrl,
        capabilities: number.capabilities,
        dateCreated: number.dateCreated
      }));
      
      res.json(numbers);
      
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      res.status(500).json({ error: 'Failed to fetch Twilio phone numbers' });
    }
  });
  
  // Update Twilio webhook URLs
  app.post("/api/dashboard/twilio/update-webhooks", async (req, res) => {
    try {
      const { smsUrl, voiceUrl } = req.body;
      
      const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
      
      const updates = await Promise.all(
        phoneNumbers.map(number => 
          twilioClient.incomingPhoneNumbers(number.sid).update({
            smsUrl: smsUrl || number.smsUrl,
            voiceUrl: voiceUrl || number.voiceUrl
          })
        )
      );
      
      res.json({ 
        success: true, 
        updated: updates.length,
        numbers: updates.map(n => ({
          phoneNumber: n.phoneNumber,
          smsUrl: n.smsUrl,
          voiceUrl: n.voiceUrl
        }))
      });
      
    } catch (error) {
      console.error('Error updating Twilio webhooks:', error);
      res.status(500).json({ error: 'Failed to update webhooks' });
    }
  });
}