import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { enrichJobData } from "./openai";
import { rawJobIntakeSchema } from "@shared/schema";
import twilio from "twilio";

// Initialize Twilio client for outbound calls
let twilioClient: twilio.Twilio | null = null;

async function initializeTwilioClient() {
  try {
    const config = await storage.getTwilioConfig();
    if (config && config.account_sid && config.auth_token) {
      twilioClient = twilio(config.account_sid, config.auth_token);
      console.log("Twilio client initialized for outbound calls");
    }
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
  }
}

// Function to send outbound SMS
async function sendSMS(to: string, message: string, from?: string) {
  if (!twilioClient) {
    await initializeTwilioClient();
  }
  
  if (!twilioClient) {
    throw new Error("Twilio client not initialized");
  }

  const config = await storage.getTwilioConfig();
  const fromNumber = from || config?.phone_number;
  
  if (!fromNumber) {
    throw new Error("No Twilio phone number configured");
  }

  try {
    const message_instance = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`SMS sent successfully. SID: ${message_instance.sid}`);
    return message_instance;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

export function registerTwilioRoutes(app: Express) {
  // Get Twilio configuration
  app.get("/api/twilio/config", async (req, res) => {
    try {
      const config = await storage.getTwilioConfig();
      
      // If no config exists in database, show environment-based configuration
      if (!config) {
        const envConfig = {
          account_sid: process.env.TWILIO_ACCOUNT_SID || null,
          phone_number: process.env.TWILIO_PHONE_NUMBER || null,
          webhook_url: null,
          sms_enabled: false,
          voice_enabled: false,
          transcription_enabled: false,
          auto_response_enabled: false,
          fallback_url: null,
          status_callback_url: null,
          is_active: false,
          source: "environment"
        };
        res.json(envConfig);
      } else {
        res.json(config);
      }
    } catch (error) {
      console.error("Error fetching Twilio config:", error);
      res.status(500).json({ error: "Failed to fetch Twilio configuration" });
    }
  });

  // Create or update Twilio configuration
  app.post("/api/twilio/config", async (req, res) => {
    try {
      const { twilioConfigSchema } = await import("@shared/schema");
      const validatedConfig = twilioConfigSchema.parse(req.body);
      
      const config = await storage.createTwilioConfig(validatedConfig);
      
      res.status(201).json({
        id: config.id,
        account_sid: config.account_sid,
        phone_number: config.phone_number,
        webhook_url: config.webhook_url,
        sms_enabled: config.sms_enabled,
        voice_enabled: config.voice_enabled,
        transcription_enabled: config.transcription_enabled,
        auto_response_enabled: config.auto_response_enabled,
        fallback_url: config.fallback_url,
        status_callback_url: config.status_callback_url,
        created_at: config.created_at,
        updated_at: config.updated_at,
        is_active: config.is_active,
      });
    } catch (error) {
      console.error("Error creating Twilio config:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid configuration data",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      } else {
        res.status(500).json({
          error: "Failed to create Twilio configuration",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
    }
  });

  // Webhook endpoint for incoming SMS messages
  app.post("/api/twilio/webhook/sms", async (req, res) => {
    try {
      console.log("Received SMS webhook:", req.body);
      
      const { From, To, Body, MessageSid } = req.body;
      
      if (!From || !Body) {
        console.error("Missing required SMS data");
        res.status(400).send("Missing required data");
        return;
      }

      // Process the SMS message as a job intake
      const jobData = {
        customer_phone: From,
        customer_name: "SMS Customer",
        description: Body,
        source: "sms" as const,
        raw_data: JSON.stringify(req.body)
      };

      // Enrich with AI
      const enrichedData = await enrichJobData(Body, `Phone: ${From}`);
      
      // Create job record
      const jobRecord = await storage.createJobRecord({
        job_id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        customer_name: jobData.customer_name,
        customer_phone: From,
        description: Body,
        service_type: enrichedData.service_type,
        ai_summary: enrichedData.ai_summary,
        issue_type: enrichedData.issue_type,
        urgency: enrichedData.urgency,
        potential_parts: enrichedData.potential_parts,
        confidence: enrichedData.confidence,
        source: "sms",
        raw_data: jobData.raw_data,
        processing_time: 0
      });

      console.log(`SMS job created: ${jobRecord.job_id}`);

      // Send auto-response if enabled
      const config = await storage.getTwilioConfig();
      if (config?.auto_response_enabled) {
        const responseMessage = `Thank you for contacting JiveAI! We've received your ${enrichedData.service_type} request and assigned job #${jobRecord.job_id}. Our team will respond within 24 hours.`;
        
        try {
          await sendSMS(From, responseMessage, To);
          console.log("Auto-response sent successfully");
        } catch (error) {
          console.error("Failed to send auto-response:", error);
        }
      }

      // Respond to Twilio with TwiML
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Job #${jobRecord.job_id} created. We'll contact you soon!</Message>
        </Response>`);

    } catch (error) {
      console.error("SMS webhook error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Webhook endpoint for incoming voice calls
  app.post("/api/twilio/webhook/voice", async (req, res) => {
    try {
      console.log("Received voice webhook:", req.body);
      
      const { From, To, CallSid } = req.body;
      
      // Respond with TwiML to handle the call
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Thank you for calling JiveAI Intake Agent. Please leave a detailed message about your service request after the beep, and we'll get back to you within 24 hours.</Say>
          <Record 
            action="/api/twilio/webhook/recording" 
            method="POST"
            maxLength="300"
            finishOnKey="#"
            transcribe="true"
            transcribeCallback="/api/twilio/webhook/transcription"
          />
          <Say voice="alice">Thank you for your message. Goodbye.</Say>
        </Response>`);

    } catch (error) {
      console.error("Voice webhook error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Webhook endpoint for voice recording completion
  app.post("/api/twilio/webhook/recording", async (req, res) => {
    try {
      console.log("Received recording webhook:", req.body);
      
      const { From, RecordingUrl, RecordingSid, CallSid } = req.body;
      
      // Create a basic job record for the call
      const jobRecord = await storage.createJobRecord({
        job_id: `call_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        customer_name: "Voice Caller",
        customer_phone: From,
        description: `Voice message recorded. Recording SID: ${RecordingSid}`,
        service_type: "Other",
        ai_summary: "Voice message received, pending transcription",
        issue_type: "Voice Call",
        urgency: "medium",
        potential_parts: [],
        confidence: 50,
        source: "voice",
        raw_data: JSON.stringify({ ...req.body, recording_url: RecordingUrl }),
        processing_time: 0
      });

      console.log(`Voice job created: ${jobRecord.job_id}`);

      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Your message has been recorded as job number ${jobRecord.job_id}. Thank you!</Say>
        </Response>`);

    } catch (error) {
      console.error("Recording webhook error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Webhook endpoint for voice transcription
  app.post("/api/twilio/webhook/transcription", async (req, res) => {
    try {
      console.log("Received transcription webhook:", req.body);
      
      const { TranscriptionText, RecordingSid, From } = req.body;
      
      if (TranscriptionText) {
        // Find the job record and update with AI enrichment
        const enrichedData = await enrichJobData(TranscriptionText, `Phone: ${From}`);
        
        // Here you would update the job record with the transcription and AI analysis
        console.log("Transcription processed:", {
          text: TranscriptionText,
          enriched: enrichedData
        });
      }

      res.status(200).send("OK");

    } catch (error) {
      console.error("Transcription webhook error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Status callback webhook for message delivery updates
  app.post("/api/twilio/webhook/status", async (req, res) => {
    try {
      console.log("Received status callback:", req.body);
      
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
      
      // Log the status update for monitoring
      console.log(`Message ${MessageSid} status: ${MessageStatus}${ErrorCode ? ` (Error: ${ErrorCode})` : ''}`);
      
      res.status(200).send("OK");

    } catch (error) {
      console.error("Status callback error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Delete Twilio configuration
  app.delete("/api/twilio/config/:id", async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      if (isNaN(configId)) {
        res.status(400).json({ error: "Invalid configuration ID" });
        return;
      }

      const success = await storage.deleteTwilioConfig(configId);
      
      if (success) {
        res.json({ success: true, message: "Configuration deleted successfully" });
      } else {
        res.status(404).json({ error: "Configuration not found" });
      }
    } catch (error) {
      console.error("Error deleting Twilio config:", error);
      res.status(500).json({
        error: "Failed to delete Twilio configuration",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // SMS Webhook endpoint - receives incoming SMS messages
  app.post("/api/twilio/webhook", async (req, res) => {
    try {
      const { From, To, Body } = req.body;
      
      if (!From || !Body) {
        res.status(400).send("Missing required fields");
        return;
      }

      // Generate unique job ID
      const jobId = `job_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      
      // Use AI to enrich the SMS data
      const aiResult = await enrichJobData(Body, `Phone: ${From}`);
      
      // Create job record
      const jobRecord = await storage.createJobRecord({
        job_id: jobId,
        customer_name: "SMS Customer",
        customer_phone: From,
        customer_email: undefined,
        customer_address: null,
        service_type: aiResult.service_type,
        description: Body,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        source: "SMS",
        submitted_at: new Date(),
        ai_confidence: aiResult.confidence,
        processing_time_ms: Date.now() - Date.now()
      });

      // Send TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for contacting JiveAI! We've received your service request (Job #${jobId}). Our team will contact you shortly to schedule your ${aiResult.service_type} service.</Message>
</Response>`;

      res.set('Content-Type', 'text/xml');
      res.send(twiml);
      
    } catch (error) {
      console.error("SMS webhook error:", error);
      
      // Send error response in TwiML format
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>We're experiencing technical difficulties. Please call us directly or try again later.</Message>
</Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.status(500).send(errorTwiml);
    }
  });

  // Voice webhook endpoint - receives incoming voice calls
  app.post("/api/twilio/voice", async (req, res) => {
    try {
      const { From, To } = req.body;
      
      // Generate TwiML response for voice calls
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling JiveAI. Please describe your service request after the beep, and we'll process it automatically.</Say>
  <Record 
    timeout="30" 
    maxLength="120" 
    action="/api/twilio/recording" 
    transcribe="true"
    transcribeCallback="/api/twilio/transcription"
  />
  <Say voice="alice">Thank you. We've recorded your request and will contact you shortly.</Say>
</Response>`;

      res.set('Content-Type', 'text/xml');
      res.send(twiml);
      
    } catch (error) {
      console.error("Voice webhook error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're experiencing technical difficulties. Please try calling again later.</Say>
</Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.status(500).send(errorTwiml);
    }
  });

  // Recording webhook - handles completed voice recordings
  app.post("/api/twilio/recording", async (req, res) => {
    try {
      const { RecordingUrl, From } = req.body;
      
      console.log(`Recording received from ${From}: ${RecordingUrl}`);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your request has been recorded. We'll contact you soon.</Say>
</Response>`;

      res.set('Content-Type', 'text/xml');
      res.send(twiml);
      
    } catch (error) {
      console.error("Recording webhook error:", error);
      res.status(500).send("Error processing recording");
    }
  });

  // Transcription webhook - processes voice transcriptions
  app.post("/api/twilio/transcription", async (req, res) => {
    try {
      const { TranscriptionText, From, RecordingUrl } = req.body;
      
      if (!TranscriptionText || !From) {
        res.status(400).send("Missing transcription data");
        return;
      }

      // Process the transcription as a job intake
      const jobId = `job_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      
      // Use AI to enrich the transcribed text
      const aiResult = await enrichJobData(TranscriptionText, `Phone: ${From}, Recording: ${RecordingUrl}`);
      
      // Create job record from voice transcription
      const jobRecord = await storage.createJobRecord({
        job_id: jobId,
        customer_name: "Voice Customer",
        customer_phone: From,
        customer_email: undefined,
        customer_address: null,
        service_type: aiResult.service_type,
        description: TranscriptionText,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        source: "Phone Call",
        submitted_at: new Date(),
        ai_confidence: aiResult.confidence,
        processing_time_ms: Date.now() - Date.now()
      });

      console.log(`Voice job created: ${jobId} from ${From}`);
      res.status(200).send("Transcription processed");
      
    } catch (error) {
      console.error("Transcription webhook error:", error);
      res.status(500).send("Error processing transcription");
    }
  });

  // Status callback endpoint
  app.post("/api/twilio/status", async (req, res) => {
    try {
      const { MessageStatus, From, To } = req.body;
      console.log(`Message status update: ${MessageStatus} for ${From} -> ${To}`);
      res.status(200).send("Status received");
    } catch (error) {
      console.error("Status callback error:", error);
      res.status(500).send("Error processing status");
    }
  });

  // Send outbound SMS endpoint
  app.post("/api/twilio/send-sms", async (req, res) => {
    try {
      const { to, message, from } = req.body;
      
      if (!to || !message) {
        res.status(400).json({ error: "Missing required fields: to, message" });
        return;
      }

      const result = await sendSMS(to, message, from);
      
      res.json({
        success: true,
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      });
    } catch (error) {
      console.error("Send SMS error:", error);
      res.status(500).json({
        error: "Failed to send SMS",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Initialize Twilio client on startup
  initializeTwilioClient();
}