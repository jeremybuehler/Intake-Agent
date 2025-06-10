import { appConfig } from './config';

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  service: 'database' | 'openai' | 'system' | 'processing';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'critical' | 'warning' | 'info';
  cooldownMs: number;
  enabled: boolean;
}

class AlertingSystem {
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private lastTriggered: Map<string, number> = new Map();
  private maxAlertsRetention = 1000;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'database_connection_lost',
        name: 'Database Connection Lost',
        condition: (health) => !health.database,
        severity: 'critical',
        cooldownMs: 300000, // 5 minutes
        enabled: true,
      },
      {
        id: 'openai_connection_lost',
        name: 'OpenAI Connection Lost',
        condition: (health) => !health.openai,
        severity: 'critical',
        cooldownMs: 300000, // 5 minutes
        enabled: true,
      },
      {
        id: 'high_processing_time',
        name: 'High Processing Time',
        condition: (metrics) => metrics.avgProcessingTime > 30000, // 30 seconds
        severity: 'warning',
        cooldownMs: 600000, // 10 minutes
        enabled: true,
      },
      {
        id: 'low_ai_confidence',
        name: 'Low AI Confidence',
        condition: (metrics) => metrics.avgConfidence < 70,
        severity: 'warning',
        cooldownMs: 900000, // 15 minutes
        enabled: true,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.errorRate > 0.1, // 10% error rate
        severity: 'warning',
        cooldownMs: 300000, // 5 minutes
        enabled: true,
      },
    ];
  }

  createAlert(
    type: Alert['type'],
    service: Alert['service'],
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      service,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.unshift(alert);
    
    // Maintain retention limit
    if (this.alerts.length > this.maxAlertsRetention) {
      this.alerts = this.alerts.slice(0, this.maxAlertsRetention);
    }

    console.log(`[ALERT:${type.toUpperCase()}] ${service}: ${message}`);
    
    return alert;
  }

  checkRules(health: any, metrics: any) {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const lastTriggered = this.lastTriggered.get(rule.id) || 0;
      if (now - lastTriggered < rule.cooldownMs) continue;

      try {
        const shouldTrigger = rule.condition({ ...health, ...metrics });
        
        if (shouldTrigger) {
          this.lastTriggered.set(rule.id, now);
          
          const alertType = rule.severity === 'critical' ? 'error' : 
                           rule.severity === 'warning' ? 'warning' : 'info';
          
          this.createAlert(
            alertType,
            'system',
            `Alert: ${rule.name}`,
            { ruleId: rule.id, health, metrics }
          );
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }
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

  getAlerts(options: {
    limit?: number;
    type?: Alert['type'];
    service?: Alert['service'];
    resolved?: boolean;
    since?: Date;
  } = {}): Alert[] {
    let filtered = this.alerts;

    if (options.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }
    
    if (options.service) {
      filtered = filtered.filter(a => a.service === options.service);
    }
    
    if (options.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }
    
    if (options.since) {
      filtered = filtered.filter(a => a.timestamp >= options.since);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts({ resolved: false });
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  addCustomRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.alertRules.push(newRule);
    return newRule;
  }

  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  getSystemStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentAlerts = this.getAlerts({ since: last24Hours });
    const activeAlerts = this.getActiveAlerts();
    
    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      recentAlerts: recentAlerts.length,
      alertsByType: {
        error: recentAlerts.filter(a => a.type === 'error').length,
        warning: recentAlerts.filter(a => a.type === 'warning').length,
        info: recentAlerts.filter(a => a.type === 'info').length,
      },
      alertsByService: {
        database: recentAlerts.filter(a => a.service === 'database').length,
        openai: recentAlerts.filter(a => a.service === 'openai').length,
        system: recentAlerts.filter(a => a.service === 'system').length,
        processing: recentAlerts.filter(a => a.service === 'processing').length,
      },
      rulesEnabled: this.alertRules.filter(r => r.enabled).length,
      totalRules: this.alertRules.length,
    };
  }
}

export const alertingSystem = new AlertingSystem();