import { apiRequest } from "./queryClient";

export interface ApiTestRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address: string;
  description: string;
  preferred_time?: string;
  source: string;
}

export interface JobRecord {
  job_id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  service_type: "AC Repair" | "Install" | "Maintenance" | "Heating" | "Other";
  description: string;
  ai_summary: string;
  issue_type: string;
  urgency: "low" | "medium" | "high";
  potential_parts?: string[];
  preferred_time?: string;
  source: string;
  submitted_at: string;
  status: string;
  ai_confidence?: number;
  processing_time_ms?: number;
}

export interface JobSummary {
  id: number;
  job_id: string;
  customer_name: string;
  service_type: string;
  urgency: string;
  ai_confidence: number | null;
  submitted_at: Date;
  processing_time_ms: number | null;
}

export interface SystemMetrics {
  totalJobs: number;
  avgProcessingTime: number;
  avgConfidence: number;
  serviceTypeDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
}

export const api = {
  async testIntake(data: ApiTestRequest): Promise<JobRecord> {
    const response = await apiRequest("POST", "/api/intake", data);
    return response.json();
  },

  async getJobs(limit = 50): Promise<JobSummary[]> {
    const response = await apiRequest("GET", `/api/jobs?limit=${limit}`);
    return response.json();
  },

  async getMetrics(): Promise<SystemMetrics> {
    const response = await apiRequest("GET", "/api/metrics");
    return response.json();
  },

  async getJob(jobId: string): Promise<JobRecord> {
    const response = await apiRequest("GET", `/api/jobs/${jobId}`);
    return response.json();
  }
};
