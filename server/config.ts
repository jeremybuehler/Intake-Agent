import { z } from "zod";

// Configuration schema for the JiveAI Intake Agent
export const configSchema = z.object({
  // Database configuration
  database: z.object({
    url: z.string().url(),
    connectionTimeout: z.number().default(30000),
    queryTimeout: z.number().default(60000),
    maxConnections: z.number().default(20),
    idleTimeout: z.number().default(30000),
  }),
  
  // OpenAI configuration
  openai: z.object({
    apiKey: z.string().min(1),
    model: z.string().default("gpt-4o"),
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3),
    temperature: z.number().min(0).max(2).default(0.3),
  }),
  
  // Webhook endpoints configuration
  webhooks: z.object({
    enabled: z.boolean().default(true),
    rateLimit: z.object({
      windowMs: z.number().default(900000), // 15 minutes
      maxRequests: z.number().default(100),
    }),
  }),
  
  // SMS integration configuration (Twilio)
  sms: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(["twilio"]).default("twilio"),
    webhookPath: z.string().default("/api/intake/sms"),
    rateLimit: z.object({
      windowMs: z.number().default(60000), // 1 minute
      maxRequests: z.number().default(10),
    }),
  }),
  
  // Phone/IVR integration configuration
  phone: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(["twilio"]).default("twilio"),
    webhookPath: z.string().default("/api/intake/call"),
    transcriptionEnabled: z.boolean().default(true),
    rateLimit: z.object({
      windowMs: z.number().default(60000), // 1 minute
      maxRequests: z.number().default(5),
    }),
  }),
  
  // Job processing configuration
  processing: z.object({
    timeoutMs: z.number().default(60000),
    retryAttempts: z.number().default(2),
    batchSize: z.number().default(10),
    enableFallback: z.boolean().default(true),
  }),
  
  // Monitoring and logging
  monitoring: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    metricsRetentionDays: z.number().default(30),
  }),
});

export type Config = z.infer<typeof configSchema>;

// Load and validate configuration from environment variables
export function loadConfig(): Config {
  const config = {
    database: {
      url: process.env.DATABASE_URL || "",
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000"),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "60000"),
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000"),
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || "3"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.3"),
    },
    webhooks: {
      enabled: process.env.WEBHOOKS_ENABLED !== "false",
      rateLimit: {
        windowMs: parseInt(process.env.WEBHOOK_RATE_WINDOW || "900000"),
        maxRequests: parseInt(process.env.WEBHOOK_RATE_LIMIT || "100"),
      },
    },
    sms: {
      enabled: process.env.SMS_ENABLED !== "false",
      provider: "twilio" as const,
      webhookPath: process.env.SMS_WEBHOOK_PATH || "/api/intake/sms",
      rateLimit: {
        windowMs: parseInt(process.env.SMS_RATE_WINDOW || "60000"),
        maxRequests: parseInt(process.env.SMS_RATE_LIMIT || "10"),
      },
    },
    phone: {
      enabled: process.env.PHONE_ENABLED !== "false",
      provider: "twilio" as const,
      webhookPath: process.env.PHONE_WEBHOOK_PATH || "/api/intake/call",
      transcriptionEnabled: process.env.PHONE_TRANSCRIPTION_ENABLED !== "false",
      rateLimit: {
        windowMs: parseInt(process.env.PHONE_RATE_WINDOW || "60000"),
        maxRequests: parseInt(process.env.PHONE_RATE_LIMIT || "5"),
      },
    },
    processing: {
      timeoutMs: parseInt(process.env.PROCESSING_TIMEOUT || "60000"),
      retryAttempts: parseInt(process.env.PROCESSING_RETRIES || "2"),
      batchSize: parseInt(process.env.PROCESSING_BATCH_SIZE || "10"),
      enableFallback: process.env.PROCESSING_FALLBACK_ENABLED !== "false",
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== "false",
      logLevel: (process.env.LOG_LEVEL || "info") as "error" | "warn" | "info" | "debug",
      metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || "30"),
    },
  };

  try {
    return configSchema.parse(config);
  } catch (error) {
    console.error("Configuration validation failed:", error);
    throw new Error("Invalid configuration. Please check your environment variables.");
  }
}

// Get current configuration
export const appConfig = loadConfig();

// Configuration validation helpers
export function validateDatabaseConnection(config: Config["database"]): boolean {
  return config.url.length > 0 && config.url.startsWith("postgresql://");
}

export function validateOpenAIConfig(config: Config["openai"]): boolean {
  return config.apiKey.length > 0 && config.apiKey.startsWith("sk-");
}

// Health check for all configured services
export async function performHealthCheck(): Promise<{
  database: boolean;
  openai: boolean;
  overall: boolean;
}> {
  const results = {
    database: false,
    openai: false,
    overall: false,
  };

  // Check database connection
  try {
    const { pool } = await import("./db");
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    results.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  // Check OpenAI connection
  try {
    if (validateOpenAIConfig(appConfig.openai)) {
      results.openai = true;
    }
  } catch (error) {
    console.error("OpenAI health check failed:", error);
  }

  results.overall = results.database && results.openai;
  return results;
}