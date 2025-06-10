import { storage } from './storage';

export interface SystemMetrics {
  totalJobs: number;
  avgProcessingTime: number;
  avgConfidence: number;
  serviceTypeDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
  errorRate: number;
  jobsLast24h: number;
  jobsLastHour: number;
  responseTimeP95: number;
  responseTimeP99: number;
  throughputPerHour: number;
  systemUptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
}

export interface PerformanceMetrics {
  timestamp: Date;
  processingTime: number;
  confidence: number;
  success: boolean;
  errorMessage?: string;
  endpointUsed: string;
}

class MetricsCollector {
  private performanceMetrics: PerformanceMetrics[] = [];
  private systemStartTime: Date = new Date();
  private maxMetricsRetention = 10000;
  private errorCount = 0;
  private successCount = 0;

  recordJobProcessing(
    processingTime: number,
    confidence: number,
    success: boolean,
    endpointUsed: string,
    errorMessage?: string
  ) {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      processingTime,
      confidence,
      success,
      errorMessage,
      endpointUsed,
    };

    this.performanceMetrics.unshift(metric);
    
    // Maintain retention limit
    if (this.performanceMetrics.length > this.maxMetricsRetention) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.maxMetricsRetention);
    }

    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    // Get base metrics from storage
    const baseMetrics = await storage.getJobMetrics();
    
    // Calculate time-based metrics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= last24h);
    const hourlyMetrics = this.performanceMetrics.filter(m => m.timestamp >= lastHour);
    
    // Calculate error rate
    const totalRequests = this.successCount + this.errorCount;
    const errorRate = totalRequests > 0 ? this.errorCount / totalRequests : 0;
    
    // Calculate response time percentiles
    const processingTimes = recentMetrics
      .filter(m => m.success)
      .map(m => m.processingTime)
      .sort((a, b) => a - b);
    
    const p95Index = Math.ceil(processingTimes.length * 0.95) - 1;
    const p99Index = Math.ceil(processingTimes.length * 0.99) - 1;
    
    const responseTimeP95 = processingTimes[p95Index] || 0;
    const responseTimeP99 = processingTimes[p99Index] || 0;
    
    // Calculate throughput
    const throughputPerHour = hourlyMetrics.filter(m => m.success).length;
    
    // System uptime
    const systemUptime = Math.floor((now.getTime() - this.systemStartTime.getTime()) / 1000);
    
    // Memory and CPU usage
    const memoryUsage = process.memoryUsage();
    const memUsed = memoryUsage.heapUsed;
    const memTotal = memoryUsage.heapTotal;
    const memPercentage = Math.round((memUsed / memTotal) * 100);
    
    // CPU usage (simplified - in production, would use more sophisticated measurement)
    const cpuUsage = Math.min(Math.round(Math.random() * 15 + 5), 100); // Simulated for demo
    
    return {
      ...baseMetrics,
      errorRate,
      jobsLast24h: recentMetrics.filter(m => m.success).length,
      jobsLastHour: hourlyMetrics.filter(m => m.success).length,
      responseTimeP95,
      responseTimeP99,
      throughputPerHour,
      systemUptime,
      memoryUsage: {
        used: memUsed,
        total: memTotal,
        percentage: memPercentage,
      },
      cpuUsage,
    };
  }

  getPerformanceHistory(hours: number = 24): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceMetrics.filter(m => m.timestamp >= cutoff);
  }

  getEndpointStats(): Record<string, {
    totalRequests: number;
    successRate: number;
    avgProcessingTime: number;
    avgConfidence: number;
  }> {
    const stats: Record<string, any> = {};
    
    this.performanceMetrics.forEach(metric => {
      if (!stats[metric.endpointUsed]) {
        stats[metric.endpointUsed] = {
          total: 0,
          successful: 0,
          totalTime: 0,
          totalConfidence: 0,
        };
      }
      
      const endpointStats = stats[metric.endpointUsed];
      endpointStats.total++;
      
      if (metric.success) {
        endpointStats.successful++;
        endpointStats.totalTime += metric.processingTime;
        endpointStats.totalConfidence += metric.confidence;
      }
    });
    
    // Calculate final stats
    Object.keys(stats).forEach(endpoint => {
      const endpointStats = stats[endpoint];
      stats[endpoint] = {
        totalRequests: endpointStats.total,
        successRate: endpointStats.total > 0 ? endpointStats.successful / endpointStats.total : 0,
        avgProcessingTime: endpointStats.successful > 0 ? endpointStats.totalTime / endpointStats.successful : 0,
        avgConfidence: endpointStats.successful > 0 ? endpointStats.totalConfidence / endpointStats.successful : 0,
      };
    });
    
    return stats;
  }

  getHealthScore(): {
    score: number;
    factors: Record<string, { score: number; weight: number; description: string }>;
  } {
    const factors = {
      errorRate: {
        score: Math.max(0, 100 - (this.errorCount / Math.max(1, this.successCount + this.errorCount)) * 1000),
        weight: 0.3,
        description: 'Low error rate indicates system stability',
      },
      responseTime: {
        score: Math.max(0, 100 - (this.getAverageResponseTime() / 1000) * 10),
        weight: 0.25,
        description: 'Fast response times indicate good performance',
      },
      confidence: {
        score: this.getAverageConfidence(),
        weight: 0.25,
        description: 'High AI confidence indicates quality processing',
      },
      uptime: {
        score: Math.min(100, (Date.now() - this.systemStartTime.getTime()) / (1000 * 60) * 2), // 2 points per minute, capped at 100
        weight: 0.2,
        description: 'System uptime indicates reliability',
      },
    };
    
    const weightedScore = Object.values(factors).reduce(
      (total, factor) => total + factor.score * factor.weight,
      0
    );
    
    return {
      score: Math.round(weightedScore),
      factors,
    };
  }

  private getAverageResponseTime(): number {
    const recentSuccessful = this.performanceMetrics
      .filter(m => m.success && m.timestamp >= new Date(Date.now() - 60 * 60 * 1000))
      .map(m => m.processingTime);
    
    return recentSuccessful.length > 0 
      ? recentSuccessful.reduce((sum, time) => sum + time, 0) / recentSuccessful.length
      : 0;
  }

  private getAverageConfidence(): number {
    const recentSuccessful = this.performanceMetrics
      .filter(m => m.success && m.timestamp >= new Date(Date.now() - 60 * 60 * 1000))
      .map(m => m.confidence);
    
    return recentSuccessful.length > 0 
      ? recentSuccessful.reduce((sum, conf) => sum + conf, 0) / recentSuccessful.length
      : 0;
  }

  resetMetrics() {
    this.performanceMetrics = [];
    this.errorCount = 0;
    this.successCount = 0;
    this.systemStartTime = new Date();
  }
}

export const metricsCollector = new MetricsCollector();