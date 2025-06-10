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
  customer_address: text("customer_address").notNull(),
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

// Input schema for raw job intake
export const rawJobIntakeSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().min(1, "Customer phone is required"),
  customer_email: z.string().email().optional(),
  address: z.string().min(1, "Address is required"),
  description: z.string().min(1, "Job description is required"),
  preferred_time: z.string().optional(),
  source: z.string().default("Webhook"),
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RawJobIntake = z.infer<typeof rawJobIntakeSchema>;
export type JobRecord = z.infer<typeof jobRecordSchema>;
export type InsertJobRecord = z.infer<typeof insertJobRecordSchema>;
export type DbJobRecord = typeof jobRecords.$inferSelect;
