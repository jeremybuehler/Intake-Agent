import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// JobRecord table for storing processed jobs
export const jobRecords = pgTable("job_records", {
  id: serial("id").primaryKey(),
  job_id: text("job_id").notNull().unique(),
  customer_name: text("customer_name").notNull(),
  customer_phone: text("customer_phone").notNull(),
  customer_email: text("customer_email"),
  customer_address: text("customer_address"),
  service_type: text("service_type").notNull(),
  description: text("description").notNull(),
  ai_summary: text("ai_summary").notNull(),
  issue_type: text("issue_type").notNull(),
  urgency: text("urgency").notNull(),
  potential_parts: text("potential_parts").array(),
  preferred_time: text("preferred_time"),
  source: text("source").notNull(),
  submitted_at: timestamp("submitted_at").notNull(),
  status: text("status").notNull().default("pending_intake"),
  ai_confidence: integer("ai_confidence").default(0),
  processing_time_ms: integer("processing_time_ms"),
});

// Twilio configuration table
export const twilioConfig = pgTable("twilio_config", {
  id: serial("id").primaryKey(),
  account_sid: text("account_sid").notNull(),
  auth_token: text("auth_token").notNull(),
  phone_number: text("phone_number").notNull(),
  webhook_url: text("webhook_url"),
  sms_enabled: boolean("sms_enabled").notNull().default(true),
  voice_enabled: boolean("voice_enabled").notNull().default(true),
  transcription_enabled: boolean("transcription_enabled").notNull().default(true),
  auto_response_enabled: boolean("auto_response_enabled").notNull().default(true),
  fallback_url: text("fallback_url"),
  status_callback_url: text("status_callback_url"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
});

// Input schema for raw job intake
export const rawJobIntakeSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().min(1, "Customer phone is required"),
  customer_email: z.string().email().optional(),
  address: z.string().min(1, "Address is required"),
  description: z.string().min(1, "Job description is required"),
  preferred_time: z.string().optional(),
  source: z.enum(["Webhook", "SMS", "Phone Call", "Email", "FSM API", "Manual Upload"]).default("Webhook"),
});

// Meridian FSM-compliant output schema for Maya
export const meridianJobOutputSchema = z.object({
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string(),
    service_history: z.array(z.string()).optional(),
    preferred_contact: z.enum(["phone", "sms", "email"]).optional()
  }),
  job_type: z.string(), // HVAC-specific job types
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  address: z.string(),
  location: z.object({
    validated: z.boolean(),
    serviceable: z.boolean(),
    zone: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  notes: z.string(),
  tags: z.array(z.string()), // Auto-generated tags
  route_to: z.enum(["dispatch_queue", "quote_queue", "fallback_notification"]),
  confidence: z.number().min(0).max(100),
  requires_review: z.boolean().default(false),
  similar_jobs: z.array(z.string()).optional(),
  processing_metadata: z.object({
    ai_model: z.string(),
    processing_time: z.number(),
    timestamp: z.string()
  })
});

// JobRecord output schema
export const jobRecordSchema = z.object({
  job_id: z.string(),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string(),
  }),
  service_type: z.enum(["AC Repair", "Install", "Maintenance", "Heating", "Other"]),
  description: z.string(),
  ai_summary: z.string(),
  issue_type: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  potential_parts: z.array(z.string()).optional(),
  preferred_time: z.string().optional(),
  source: z.string(),
  submitted_at: z.string(),
  status: z.string(),
  ai_confidence: z.number().optional(),
  processing_time_ms: z.number().optional(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobRecordSchema = createInsertSchema(jobRecords).omit({
  id: true,
});

// Twilio configuration schemas
export const twilioConfigSchema = z.object({
  account_sid: z.string().min(1, "Account SID is required"),
  auth_token: z.string().min(1, "Auth Token is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  webhook_url: z.string().url().optional(),
  sms_enabled: z.boolean().default(true),
  voice_enabled: z.boolean().default(true),
  transcription_enabled: z.boolean().default(true),
  auto_response_enabled: z.boolean().default(true),
  fallback_url: z.string().url().optional(),
  status_callback_url: z.string().url().optional(),
});

export const insertTwilioConfigSchema = createInsertSchema(twilioConfig).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RawJobIntake = z.infer<typeof rawJobIntakeSchema>;
export type JobRecord = z.infer<typeof jobRecordSchema>;
export type InsertJobRecord = z.infer<typeof insertJobRecordSchema>;
export type DbJobRecord = typeof jobRecords.$inferSelect;
export type TwilioConfig = typeof twilioConfig.$inferSelect;
export type InsertTwilioConfig = z.infer<typeof insertTwilioConfigSchema>;
export type TwilioConfigInput = z.infer<typeof twilioConfigSchema>;
