import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rawJobIntakeSchema, type RawJobIntake, type JobRecord } from "@shared/schema";
import { enrichJobData } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Main intake endpoint
  app.post("/api/intake", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate input
      const validatedInput = rawJobIntakeSchema.parse(req.body);
      
      // Generate unique job ID
      const jobId = `job_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      
      // Prepare customer info for AI analysis
      const customerInfo = `Name: ${validatedInput.customer_name}, Phone: ${validatedInput.customer_phone}, Address: ${validatedInput.address}`;
      
      // Get AI enrichment
      const aiResult = await enrichJobData(validatedInput.description, customerInfo);
      
      const processingTime = Date.now() - startTime;
      
      // Create job record for storage
      const jobRecord = {
        job_id: jobId,
        customer_name: validatedInput.customer_name,
        customer_phone: validatedInput.customer_phone,
        customer_email: validatedInput.customer_email || null,
        customer_address: validatedInput.address,
        service_type: aiResult.service_type,
        description: validatedInput.description,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        preferred_time: validatedInput.preferred_time || null,
        source: validatedInput.source,
        submitted_at: new Date(),
        status: "pending_intake" as const,
        ai_confidence: aiResult.confidence,
        processing_time_ms: processingTime,
      };

      // Store the job record
      await storage.createJobRecord(jobRecord);

      // Format response as JobRecord
      const response: JobRecord = {
        job_id: jobId,
        customer: {
          name: validatedInput.customer_name,
          phone: validatedInput.customer_phone,
          email: validatedInput.customer_email,
          address: validatedInput.address,
        },
        service_type: aiResult.service_type,
        description: validatedInput.description,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        preferred_time: validatedInput.preferred_time,
        source: validatedInput.source,
        submitted_at: jobRecord.submitted_at.toISOString(),
        status: "pending_intake",
        ai_confidence: aiResult.confidence,
        processing_time_ms: processingTime,
      };

      res.status(200).json(response);

    } catch (error) {
      console.error("Intake processing error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid input data",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      } else {
        res.status(500).json({
          error: "Internal server error during job processing",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
    }
  });

  // Get recent job records
  app.get("/api/jobs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const jobs = await storage.getJobRecords(limit);
      
      const formattedJobs = jobs.map(job => ({
        id: job.id,
        job_id: job.job_id,
        customer_name: job.customer_name,
        service_type: job.service_type,
        urgency: job.urgency,
        ai_confidence: job.ai_confidence,
        submitted_at: job.submitted_at,
        processing_time_ms: job.processing_time_ms,
      }));

      res.json(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch job records" });
    }
  });

  // Get system metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getJobMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  // SMS to Job converter endpoint
  app.post("/api/intake/sms", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Expected SMS webhook payload (Twilio format)
      const { From: phone, Body: message, To: toNumber } = req.body;
      
      if (!phone || !message) {
        res.status(400).json({
          error: "Invalid SMS payload",
          details: ["Phone number and message body are required"]
        });
        return;
      }

      // Parse SMS content for customer info and job details
      const lines = message.split('\n').map(line => line.trim()).filter(Boolean);
      
      // Try to extract customer name from first line or use phone as fallback
      const customerName = lines[0]?.match(/^[A-Za-z\s]+$/) ? lines[0] : `Customer ${phone}`;
      
      // Extract address - look for lines with address patterns
      const addressLine = lines.find(line => 
        /\d+.*(?:st|nd|rd|th|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|way|ln|lane)/i.test(line) ||
        /\d{5}/.test(line) // ZIP code pattern
      );
      
      const jobRecord = {
        customer_name: customerName,
        customer_phone: phone,
        customer_email: undefined,
        address: addressLine || "Address to be confirmed",
        description: message,
        preferred_time: undefined,
        source: "SMS" as const,
      };

      // Validate and process through normal intake flow
      const validatedInput = rawJobIntakeSchema.parse(jobRecord);
      const jobId = `sms_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      const customerInfo = `Name: ${validatedInput.customer_name}, Phone: ${validatedInput.customer_phone}, Address: ${validatedInput.address}`;
      const aiResult = await enrichJobData(validatedInput.description, customerInfo);
      const processingTime = Date.now() - startTime;

      const dbJobRecord = {
        job_id: jobId,
        customer_name: validatedInput.customer_name,
        customer_phone: validatedInput.customer_phone,
        customer_email: validatedInput.customer_email || null,
        customer_address: validatedInput.address,
        service_type: aiResult.service_type,
        description: validatedInput.description,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        preferred_time: validatedInput.preferred_time || null,
        source: validatedInput.source,
        submitted_at: new Date(),
        status: "pending_intake" as const,
        ai_confidence: aiResult.confidence,
        processing_time_ms: processingTime,
      };

      await storage.createJobRecord(dbJobRecord);

      // Return TwiML response for SMS acknowledgment
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you! Your service request has been received and assigned job ID: ${jobId}. Our team will contact you shortly.</Message>
</Response>`);

    } catch (error) {
      console.error("SMS intake processing error:", error);
      
      // Return TwiML error response
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, we couldn't process your request. Please call us directly for assistance.</Message>
</Response>`);
    }
  });

  // Phone Call (IVR) to Job converter endpoint
  app.post("/api/intake/call", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Expected call webhook payload (Twilio format with transcription)
      const { 
        From: phone, 
        TranscriptionText: transcription,
        CallSid: callSid,
        Caller: caller
      } = req.body;
      
      if (!phone || !transcription) {
        res.status(400).json({
          error: "Invalid call payload",
          details: ["Phone number and transcription are required"]
        });
        return;
      }

      // Parse transcription for customer info and job details
      const customerName = caller || `Customer ${phone}`;
      
      // Try to extract address from transcription
      const addressMatch = transcription.match(/(?:address|located|at)\s+(.+?)(?:\.|,|$)/i);
      const address = addressMatch ? addressMatch[1].trim() : "Address to be confirmed";

      const jobRecord = {
        customer_name: customerName,
        customer_phone: phone,
        customer_email: undefined,
        address: address,
        description: `Phone call transcript: ${transcription}`,
        preferred_time: undefined,
        source: "Phone Call" as const,
      };

      // Validate and process through normal intake flow
      const validatedInput = rawJobIntakeSchema.parse(jobRecord);
      const jobId = `call_${new Date().getFullYear()}_${String(Date.now()).slice(-6)}`;
      const customerInfo = `Name: ${validatedInput.customer_name}, Phone: ${validatedInput.customer_phone}, Address: ${validatedInput.address}`;
      const aiResult = await enrichJobData(validatedInput.description, customerInfo);
      const processingTime = Date.now() - startTime;

      const dbJobRecord = {
        job_id: jobId,
        customer_name: validatedInput.customer_name,
        customer_phone: validatedInput.customer_phone,
        customer_email: validatedInput.customer_email || null,
        customer_address: validatedInput.address,
        service_type: aiResult.service_type,
        description: validatedInput.description,
        ai_summary: aiResult.ai_summary,
        issue_type: aiResult.issue_type,
        urgency: aiResult.urgency,
        potential_parts: aiResult.potential_parts,
        preferred_time: validatedInput.preferred_time || null,
        source: validatedInput.source,
        submitted_at: new Date(),
        status: "pending_intake" as const,
        ai_confidence: aiResult.confidence,
        processing_time_ms: processingTime,
      };

      await storage.createJobRecord(dbJobRecord);

      // Return TwiML response for call acknowledgment
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Your service request has been recorded as job ID ${jobId}. We will contact you shortly to schedule your appointment.</Say>
  <Hangup/>
</Response>`);

    } catch (error) {
      console.error("Call intake processing error:", error);
      
      // Return TwiML error response
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, we couldn't process your request. Please hold while we transfer you to a representative.</Say>
  <Hangup/>
</Response>`);
    }
  });

  // Get specific job details
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const job = await storage.getJobRecord(req.params.jobId);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      const response: JobRecord = {
        job_id: job.job_id,
        customer: {
          name: job.customer_name,
          phone: job.customer_phone,
          email: job.customer_email || undefined,
          address: job.customer_address,
        },
        service_type: job.service_type as any,
        description: job.description,
        ai_summary: job.ai_summary,
        issue_type: job.issue_type,
        urgency: job.urgency as any,
        potential_parts: job.potential_parts || undefined,
        preferred_time: job.preferred_time || undefined,
        source: job.source,
        submitted_at: job.submitted_at.toISOString(),
        status: job.status,
        ai_confidence: job.ai_confidence || undefined,
        processing_time_ms: job.processing_time_ms || undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
