import { users, jobRecords, type User, type InsertUser, type DbJobRecord, type InsertJobRecord } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job Records methods
  createJobRecord(jobRecord: InsertJobRecord): Promise<DbJobRecord>;
  getJobRecord(jobId: string): Promise<DbJobRecord | undefined>;
  getJobRecords(limit?: number): Promise<DbJobRecord[]>;
  getJobMetrics(): Promise<{
    totalJobs: number;
    avgProcessingTime: number;
    avgConfidence: number;
    serviceTypeDistribution: Record<string, number>;
    urgencyDistribution: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createJobRecord(jobRecord: InsertJobRecord): Promise<DbJobRecord> {
    const [record] = await db
      .insert(jobRecords)
      .values({
        job_id: jobRecord.job_id,
        customer_name: jobRecord.customer_name,
        customer_phone: jobRecord.customer_phone,
        customer_email: jobRecord.customer_email ?? null,
        customer_address: jobRecord.customer_address,
        service_type: jobRecord.service_type,
        description: jobRecord.description,
        ai_summary: jobRecord.ai_summary,
        issue_type: jobRecord.issue_type,
        urgency: jobRecord.urgency,
        potential_parts: jobRecord.potential_parts ?? null,
        preferred_time: jobRecord.preferred_time ?? null,
        source: jobRecord.source,
        submitted_at: jobRecord.submitted_at,
        status: jobRecord.status || "pending_intake",
        ai_confidence: jobRecord.ai_confidence ?? null,
        processing_time_ms: jobRecord.processing_time_ms ?? null
      })
      .returning();
    return record;
  }

  async getJobRecord(jobId: string): Promise<DbJobRecord | undefined> {
    const [record] = await db.select().from(jobRecords).where(eq(jobRecords.job_id, jobId));
    return record || undefined;
  }

  async getJobRecords(limit = 50): Promise<DbJobRecord[]> {
    const records = await db
      .select()
      .from(jobRecords)
      .orderBy(desc(jobRecords.submitted_at))
      .limit(limit);
    return records;
  }

  async getJobMetrics() {
    const records = await db.select().from(jobRecords);
    const totalJobs = records.length;
    
    const avgProcessingTime = records
      .filter(r => r.processing_time_ms)
      .reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / Math.max(1, records.filter(r => r.processing_time_ms).length);
    
    const avgConfidence = records
      .filter(r => r.ai_confidence)
      .reduce((sum, r) => sum + (r.ai_confidence || 0), 0) / Math.max(1, records.filter(r => r.ai_confidence).length);

    const serviceTypeDistribution: Record<string, number> = {};
    const urgencyDistribution: Record<string, number> = {};

    records.forEach(record => {
      serviceTypeDistribution[record.service_type] = (serviceTypeDistribution[record.service_type] || 0) + 1;
      urgencyDistribution[record.urgency] = (urgencyDistribution[record.urgency] || 0) + 1;
    });

    return {
      totalJobs,
      avgProcessingTime: Math.round(avgProcessingTime),
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      serviceTypeDistribution,
      urgencyDistribution
    };
  }
}

export const storage = new DatabaseStorage();
