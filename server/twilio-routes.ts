import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { enrichJobData } from "./openai";
import { rawJobIntakeSchema } from "@shared/schema";

export function registerTwilioRoutes(app: Express) {
  // Get Twilio configuration
  app.get("/api/twilio/config", async (req, res) => {
    try {
      const config = await storage.getTwilioConfig();
      res.json(config || null);
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
}