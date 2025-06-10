import { storage } from './storage';
import { appConfig, performHealthCheck } from './config';

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  service: 'database' | 'openai' | 'system' | 'processing';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface SystemStats {
  totalJobs: number;
  avgProcessingTime: number;
  avgConfidence: number;
  errorRate: number;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  activeAlerts: number;
  healthScore: number;
}

class SimpleMonitoringSystem {
  private alerts: Alert[] = [];
  private startTime = new Date();
  private errorCount = 0;
  private successCount = 0;
  private processingTimes: number[] = [];
  private confidenceScores: number[] = [];

  recordJobSuccess(processingTime: number, confidence: number) {
    this.successCount++;
    this.processingTimes.push(processingTime);
    this.confidenceScores.push(confidence);
    
    // Keep only last 100 records for performance
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-100);
      this.confidenceScores = this.confidenceScores.slice(-100);
    }
    
    // Check for alerts
    this.checkPerformanceAlerts(processingTime, confidence);
  }

  recordJobError(errorMessage: string) {
    this.errorCount++;
    this.createAlert('error', 'processing', `Job processing failed: ${errorMessage}`);
  }

  recordSystemEvent(type: Alert['type'], service: Alert['service'], message: string) {
    this.createAlert(type, service, message);
  }

  private createAlert(type: Alert['type'], service: Alert['service'], message: string) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      service,
      message,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.unshift(alert);
    
    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(0, 500);
    }

    console.log(`[ALERT:${type.toUpperCase()}] ${service}: ${message}`);
  }

  private checkPerformanceAlerts(processingTime: number, confidence: number) {
    // Alert if processing time is too high
    if (processingTime > 30000) { // 30 seconds
      this.createAlert('warning', 'processing', `High processing time: ${processingTime}ms`);
    }
    
    // Alert if confidence is too low
    if (confidence < 70) {
      this.createAlert('warning', 'processing', `Low AI confidence: ${confidence}%`);
    }
    
    // Alert if error rate is high
    const totalJobs = this.successCount + this.errorCount;
    if (totalJobs > 10 && (this.errorCount / totalJobs) > 0.1) {
      this.createAlert('error', 'system', `High error rate: ${Math.round((this.errorCount / totalJobs) * 100)}%`);
    }
  }

  async getSystemStats(): Promise<SystemStats> {
    const baseMetrics = await storage.getJobMetrics();
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    const avgProcessingTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : baseMetrics.avgProcessingTime;
    
    const avgConfidence = this.confidenceScores.length > 0
      ? this.confidenceScores.reduce((sum, conf) => sum + conf, 0) / this.confidenceScores.length
      : baseMetrics.avgConfidence;
    
    const totalJobs = this.successCount + this.errorCount;
    const errorRate = totalJobs > 0 ? this.errorCount / totalJobs : 0;
    
    const memoryUsage = process.memoryUsage();
    const memUsed = memoryUsage.heapUsed;
    const memTotal = memoryUsage.heapTotal;
    
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;
    const healthScore = this.calculateHealthScore(errorRate, avgProcessingTime, avgConfidence, activeAlerts);
    
    return {
      totalJobs: baseMetrics.totalJobs + this.successCount,
      avgProcessingTime,
      avgConfidence,
      errorRate,
      uptime,
      memoryUsage: {
        used: memUsed,
        total: memTotal,
        percentage: Math.round((memUsed / memTotal) * 100),
      },
      activeAlerts,
      healthScore,
    };
  }

  private calculateHealthScore(errorRate: number, avgProcessingTime: number, avgConfidence: number, activeAlerts: number): number {
    let score = 100;
    
    // Deduct for error rate
    score -= errorRate * 500; // 50% error rate = -250 points
    
    // Deduct for slow processing
    if (avgProcessingTime > 10000) {
      score -= (avgProcessingTime - 10000) / 1000; // 1 point per extra second
    }
    
    // Deduct for low confidence
    if (avgConfidence < 80) {
      score -= (80 - avgConfidence) * 2; // 2 points per % below 80%
    }
    
    // Deduct for active alerts
    score -= activeAlerts * 5; // 5 points per active alert
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getAlerts(options: { resolved?: boolean; limit?: number } = {}): Alert[] {
    let filtered = this.alerts;
    
    if (options.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }
    
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`[ALERT:RESOLVED] ${alert.service}: ${alert.message}`);
      return true;
    }
    return false;
  }

  async performHealthCheck() {
    try {
      const health = await performHealthCheck();
      
      if (!health.database) {
        this.createAlert('error', 'database', 'Database connection lost');
      }
      
      if (!health.openai) {
        this.createAlert('error', 'openai', 'OpenAI connection lost');
      }
      
      return {
        ...health,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        activeAlerts: this.alerts.filter(a => !a.resolved).length,
      };
    } catch (error) {
      this.createAlert('error', 'system', 'Health check failed');
      return {
        database: false,
        openai: false,
        overall: false,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        activeAlerts: this.alerts.filter(a => !a.resolved).length,
      };
    }
  }

  getEndpointStats() {
    return {
      webhook: {
        totalRequests: this.successCount,
        successRate: this.successCount / Math.max(1, this.successCount + this.errorCount),
        avgProcessingTime: this.processingTimes.length > 0 
          ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length 
          : 0,
      },
      sms: {
        totalRequests: 0,
        successRate: 1,
        avgProcessingTime: 0,
      },
      phone: {
        totalRequests: 0,
        successRate: 1,
        avgProcessingTime: 0,
      },
    };
  }

  getRecentPerformance(hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts
      .filter(a => a.timestamp >= cutoff)
      .map(a => ({
        timestamp: a.timestamp,
        type: a.type,
        service: a.service,
        resolved: a.resolved,
      }));
  }
}

export const simpleMonitoring = new SimpleMonitoringSystem();