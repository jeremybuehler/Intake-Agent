import { z } from "zod";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// Enhanced configuration schema with dynamic updates
export const enhancedConfigSchema = z.object({
  // Core system configuration
  system: z.object({
    environment: z.enum(["development", "staging", "production"]).default("development"),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    maxConcurrentJobs: z.number().default(50),
    enableDetailedLogging: z.boolean().default(true),
    healthCheckInterval: z.number().default(60000),
    dataRetentionDays: z.number().default(30),
  }),

  // Database configuration with connection pooling
  database: z.object({
    url: z.string().default("postgresql://localhost:5432/jiveai"),
    connectionTimeout: z.number().default(30000),
    queryTimeout: z.number().default(60000),
    maxConnections: z.number().default(20),
    minConnections: z.number().default(2),
    idleTimeout: z.number().default(30000),
    acquireTimeout: z.number().default(60000),
    enableSSL: z.boolean().default(true),
    reconnectAttempts: z.number().default(3),
    reconnectDelay: z.number().default(5000),
  }),

  // OpenAI configuration with fallback options
  openai: z.object({
    apiKey: z.string().min(1),
    model: z.string().default("gpt-4o"),
    fallbackModel: z.string().default("gpt-3.5-turbo"),
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(1000),
    temperature: z.number().min(0).max(2).default(0.3),
    maxTokens: z.number().default(1000),
    enableFallback: z.boolean().default(true),
    rateLimitPerMinute: z.number().default(60),
  }),

  // Enhanced webhook configuration
  webhooks: z.object({
    enabled: z.boolean().default(true),
    maxPayloadSize: z.string().default("10mb"),
    timeout: z.number().default(30000),
    enableAuthentication: z.boolean().default(false),
    authToken: z.string().optional(),
    rateLimit: z.object({
      windowMs: z.number().default(900000), // 15 minutes
      maxRequests: z.number().default(100),
      enableDynamicLimiting: z.boolean().default(true),
    }),
    validation: z.object({
      enableStrictValidation: z.boolean().default(true),
      allowUnknownFields: z.boolean().default(false),
    }),
  }),

  // Enhanced SMS configuration
  sms: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(["twilio", "aws-sns"]).default("twilio"),
    webhookPath: z.string().default("/api/intake/sms"),
    enableAutoResponses: z.boolean().default(true),
    maxMessageLength: z.number().default(1600),
    enableDeduplication: z.boolean().default(true),
    deduplicationWindow: z.number().default(300000), // 5 minutes
    rateLimit: z.object({
      windowMs: z.number().default(60000), // 1 minute
      maxRequests: z.number().default(10),
      enablePerPhoneNumberLimiting: z.boolean().default(true),
    }),
  }),

  // Enhanced phone/IVR configuration
  phone: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(["twilio", "aws-connect"]).default("twilio"),
    webhookPath: z.string().default("/api/intake/call"),
    transcriptionEnabled: z.boolean().default(true),
    transcriptionLanguage: z.string().default("en-US"),
    enableRecording: z.boolean().default(false),
    maxCallDuration: z.number().default(600), // 10 minutes
    enableVoicemail: z.boolean().default(true),
    rateLimit: z.object({
      windowMs: z.number().default(60000), // 1 minute
      maxRequests: z.number().default(5),
    }),
  }),

  // Enhanced processing configuration
  processing: z.object({
    timeoutMs: z.number().default(60000),
    retryAttempts: z.number().default(2),
    retryDelay: z.number().default(2000),
    batchSize: z.number().default(10),
    enableFallback: z.boolean().default(true),
    fallbackStrategy: z.enum(["basic", "template", "manual"]).default("basic"),
    enableAsyncProcessing: z.boolean().default(true),
    queueMaxSize: z.number().default(1000),
    enablePriorityQueue: z.boolean().default(true),
    confidenceThreshold: z.number().min(0).max(100).default(70),
  }),

  // Enhanced monitoring and alerting
  monitoring: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    metricsRetentionDays: z.number().default(30),
    enableRealTimeMetrics: z.boolean().default(true),
    metricsUpdateInterval: z.number().default(30000),
    enablePerformanceTracking: z.boolean().default(true),
    enableResourceMonitoring: z.boolean().default(true),
    alerting: z.object({
      enabled: z.boolean().default(true),
      channels: z.object({
        console: z.boolean().default(true),
        email: z.boolean().default(false),
        webhook: z.boolean().default(false),
        slack: z.boolean().default(false),
      }),
      emailConfig: z.object({
        smtpHost: z.string().optional(),
        smtpPort: z.number().default(587),
        username: z.string().optional(),
        password: z.string().optional(),
        fromEmail: z.string().optional(),
        toEmails: z.array(z.string()).default([]),
      }),
      webhookConfig: z.object({
        url: z.string().url().optional(),
        headers: z.record(z.string()).default({}),
        timeout: z.number().default(10000),
      }),
      slackConfig: z.object({
        webhookUrl: z.string().url().optional(),
        channel: z.string().default("#alerts"),
        username: z.string().default("JiveAI-Bot"),
      }),
    }),
  }),

  // Security configuration
  security: z.object({
    enableCORS: z.boolean().default(true),
    corsOrigins: z.array(z.string()).default(["*"]),
    enableHelmet: z.boolean().default(true),
    enableRequestLogging: z.boolean().default(true),
    enableIPRateLimiting: z.boolean().default(true),
    trustProxy: z.boolean().default(true),
    maxRequestSize: z.string().default("10mb"),
    enableDataEncryption: z.boolean().default(false),
    encryptionKey: z.string().optional(),
  }),

  // Feature flags
  features: z.object({
    enableAdvancedAnalytics: z.boolean().default(true),
    enableMLInsights: z.boolean().default(false),
    enableAutoRouting: z.boolean().default(true),
    enableDuplicateDetection: z.boolean().default(true),
    enableSentimentAnalysis: z.boolean().default(false),
    enableJobPrioritization: z.boolean().default(true),
    enableCustomerHistory: z.boolean().default(true),
    enableABTesting: z.boolean().default(false),
  }),
});

export type EnhancedConfig = z.infer<typeof enhancedConfigSchema>;

class ConfigurationManager {
  private config: EnhancedConfig;
  private configPath: string;
  private watchers: ((config: EnhancedConfig) => void)[] = [];

  constructor() {
    this.configPath = join(process.cwd(), "config.json");
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnhancedConfig {
    // Load from environment variables first
    const envConfig = this.loadFromEnvironment();
    
    // Load from config file if it exists
    let fileConfig = {};
    if (existsSync(this.configPath)) {
      try {
        const fileContent = readFileSync(this.configPath, "utf-8");
        fileConfig = JSON.parse(fileContent);
      } catch (error) {
        console.warn("Failed to load config file, using defaults:", error);
      }
    }

    // Merge configurations (env takes precedence)
    const mergedConfig = this.deepMerge(fileConfig, envConfig);
    
    try {
      return enhancedConfigSchema.parse(mergedConfig);
    } catch (error) {
      console.error("Configuration validation failed:", error);
      throw new Error("Invalid configuration. Please check your settings.");
    }
  }

  private loadFromEnvironment(): any {
    // Create a default configuration and override with environment variables
    const defaultConfig = enhancedConfigSchema.parse({});
    
    const envOverrides: any = {};
    
    // System overrides
    if (process.env.NODE_ENV) envOverrides.system = { ...envOverrides.system, environment: process.env.NODE_ENV };
    if (process.env.LOG_LEVEL) envOverrides.system = { ...envOverrides.system, logLevel: process.env.LOG_LEVEL };
    
    // Database overrides
    if (process.env.DATABASE_URL) {
      envOverrides.database = {
        ...envOverrides.database,
        url: process.env.DATABASE_URL,
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || defaultConfig.database.connectionTimeout.toString()),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || defaultConfig.database.queryTimeout.toString()),
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || defaultConfig.database.maxConnections.toString()),
      };
    }
    
    // OpenAI overrides
    if (process.env.OPENAI_API_KEY) {
      envOverrides.openai = {
        ...envOverrides.openai,
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || defaultConfig.openai.model,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || defaultConfig.openai.temperature.toString()),
      };
    }
    
    return this.deepMerge(defaultConfig, envOverrides);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  getConfig(): EnhancedConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<EnhancedConfig>): boolean {
    try {
      const newConfig = this.deepMerge(this.config, updates);
      const validatedConfig = enhancedConfigSchema.parse(newConfig);
      
      this.config = validatedConfig;
      this.saveConfiguration();
      this.notifyWatchers();
      
      return true;
    } catch (error) {
      console.error("Failed to update configuration:", error);
      return false;
    }
  }

  private saveConfiguration(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Failed to save configuration:", error);
    }
  }

  private notifyWatchers(): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.config);
      } catch (error) {
        console.error("Configuration watcher error:", error);
      }
    });
  }

  watch(callback: (config: EnhancedConfig) => void): () => void {
    this.watchers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.watchers.indexOf(callback);
      if (index > -1) {
        this.watchers.splice(index, 1);
      }
    };
  }

  validateConfiguration(config?: Partial<EnhancedConfig>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const configToValidate = config ? this.deepMerge(this.config, config) : this.config;
    
    try {
      enhancedConfigSchema.parse(configToValidate);
      
      const warnings: string[] = [];
      
      // Check for potential issues
      if (configToValidate.database.maxConnections > 100) {
        warnings.push("High database connection count may impact performance");
      }
      
      if (configToValidate.openai.temperature > 1.0) {
        warnings.push("High AI temperature may produce inconsistent results");
      }
      
      if (configToValidate.processing.timeoutMs < 10000) {
        warnings.push("Low processing timeout may cause failures for complex jobs");
      }
      
      return {
        valid: true,
        errors: [],
        warnings,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.errors?.map((e: any) => `${e.path.join(".")}: ${e.message}`) || [error.message],
        warnings: [],
      };
    }
  }

  resetToDefaults(): boolean {
    try {
      const defaultConfig = enhancedConfigSchema.parse({});
      this.config = defaultConfig;
      this.saveConfiguration();
      this.notifyWatchers();
      return true;
    } catch (error) {
      console.error("Failed to reset configuration:", error);
      return false;
    }
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      const validatedConfig = enhancedConfigSchema.parse(importedConfig);
      
      this.config = validatedConfig;
      this.saveConfiguration();
      this.notifyWatchers();
      
      return true;
    } catch (error) {
      console.error("Failed to import configuration:", error);
      return false;
    }
  }
}

export const configManager = new ConfigurationManager();