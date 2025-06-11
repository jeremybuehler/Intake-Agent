import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

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
}