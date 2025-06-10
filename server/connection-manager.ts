import { Pool } from '@neondatabase/serverless';
import { appConfig, performHealthCheck } from './config';
import OpenAI from 'openai';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private dbPool: Pool | null = null;
  private openaiClient: OpenAI | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionStatus: {
    database: boolean;
    openai: boolean;
    lastChecked: Date;
  } = {
    database: false,
    openai: false,
    lastChecked: new Date(),
  };

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('Initializing connection manager...');
    
    // Initialize database connection
    await this.initializeDatabase();
    
    // Initialize OpenAI client
    this.initializeOpenAI();
    
    // Start health check monitoring
    this.startHealthCheckMonitoring();
    
    console.log('Connection manager initialized successfully');
  }

  private async initializeDatabase(): Promise<void> {
    try {
      if (!appConfig.database.url) {
        throw new Error('Database URL not configured');
      }

      this.dbPool = new Pool({
        connectionString: appConfig.database.url,
        max: appConfig.database.maxConnections,
        idleTimeoutMillis: appConfig.database.idleTimeout,
        connectionTimeoutMillis: appConfig.database.connectionTimeout,
      });

      // Test connection
      const client = await this.dbPool.connect();
      await client.query('SELECT 1');
      client.release();
      
      this.connectionStatus.database = true;
      console.log('Database connection established successfully');
    } catch (error) {
      this.connectionStatus.database = false;
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  private initializeOpenAI(): void {
    try {
      if (!appConfig.openai.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      this.openaiClient = new OpenAI({
        apiKey: appConfig.openai.apiKey,
        timeout: appConfig.openai.timeout,
        maxRetries: appConfig.openai.maxRetries,
      });

      this.connectionStatus.openai = true;
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      this.connectionStatus.openai = false;
      console.error('Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  private startHealthCheckMonitoring(): void {
    if (appConfig.monitoring.enabled) {
      this.healthCheckInterval = setInterval(async () => {
        try {
          const health = await performHealthCheck();
          this.connectionStatus = {
            ...health,
            lastChecked: new Date(),
          };
          
          if (!health.overall) {
            console.warn('Health check failed:', health);
          }
        } catch (error) {
          console.error('Health check error:', error);
        }
      }, 60000); // Check every minute
    }
  }

  getConnectionStatus() {
    return {
      ...this.connectionStatus,
      config: {
        database: {
          maxConnections: appConfig.database.maxConnections,
          timeout: appConfig.database.connectionTimeout,
        },
        openai: {
          model: appConfig.openai.model,
          timeout: appConfig.openai.timeout,
        },
        endpoints: {
          webhooks: appConfig.webhooks.enabled,
          sms: appConfig.sms.enabled,
          phone: appConfig.phone.enabled,
        },
      },
    };
  }

  async reconnectDatabase(): Promise<boolean> {
    try {
      if (this.dbPool) {
        await this.dbPool.end();
      }
      await this.initializeDatabase();
      return true;
    } catch (error) {
      console.error('Database reconnection failed:', error);
      return false;
    }
  }

  reconnectOpenAI(): boolean {
    try {
      this.initializeOpenAI();
      return true;
    } catch (error) {
      console.error('OpenAI reconnection failed:', error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down connection manager...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.dbPool) {
      await this.dbPool.end();
    }
    
    console.log('Connection manager shutdown complete');
  }

  getDatabase(): Pool {
    if (!this.dbPool || !this.connectionStatus.database) {
      throw new Error('Database connection not available');
    }
    return this.dbPool;
  }

  getOpenAI(): OpenAI {
    if (!this.openaiClient || !this.connectionStatus.openai) {
      throw new Error('OpenAI client not available');
    }
    return this.openaiClient;
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();