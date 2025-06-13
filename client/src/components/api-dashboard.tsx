import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react";

interface ConsolidatedMetrics {
  period: string;
  twilio: {
    sms: {
      sent: number;
      delivered: number;
      failed: number;
      cost: number;
    };
    voice: {
      calls: number;
      minutes: number;
      cost: number;
    };
    account: {
      status: string;
      balance?: string;
    };
  };
  sendgrid: {
    emails: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
    };
  };
  system: {
    jobs: number;
    avgProcessingTime: number;
    avgConfidence: number;
    successRate: number;
  };
}

interface APILog {
  id: string;
  timestamp: string;
  service: 'twilio' | 'sendgrid' | 'system';
  type: 'sms' | 'voice' | 'email' | 'job' | 'webhook';
  status: 'success' | 'failed' | 'pending';
  message: string;
  details: any;
  cost?: number;
  duration?: number;
}

interface ConnectionStatus {
  twilio: { connected: boolean; error: string | null };
  sendgrid: { connected: boolean; error: string | null };
  database: { connected: boolean; error: string | null };
  openai: { connected: boolean; error: string | null };
}

export function ApiDashboard() {
  const [selectedService, setSelectedService] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/dashboard/logs", selectedService],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedService !== 'all') {
        params.append('service', selectedService);
      }
      const response = await fetch(`/api/dashboard/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json() as Promise<APILog[]>;
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const { data: connections } = useQuery({
    queryKey: ["/api/dashboard/test-connections"],
    refetchInterval: 60000 // Refresh every minute
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/test-connections"] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'twilio': return <MessageSquare className="h-4 w-4" />;
      case 'sendgrid': return <Mail className="h-4 w-4" />;
      case 'system': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor Twilio, SendGrid, and system metrics in real-time
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {connections && Object.entries(connections).map(([service, status]: [string, any]) => (
          <Card key={service}>
            <CardContent className="flex items-center p-4">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                status.connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium capitalize">{service}</p>
                {status.error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{status.error}</p>
                )}
              </div>
              {status.connected ? 
                <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.twilio.sms.sent}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.twilio.sms.delivered} delivered, {metrics.twilio.sms.failed} failed
              </p>
              <p className="text-xs text-green-600 mt-1">
                ${metrics.twilio.sms.cost.toFixed(4)} cost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voice Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.twilio.voice.calls}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.twilio.voice.minutes.toFixed(1)} minutes
              </p>
              <p className="text-xs text-green-600 mt-1">
                ${metrics.twilio.voice.cost.toFixed(4)} cost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Messages</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sendgrid.emails.sent}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.sendgrid.emails.delivered} delivered, {metrics.sendgrid.emails.opened} opened
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Processing</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.system.jobs}</div>
              <p className="text-xs text-muted-foreground">
                {(metrics.system.avgProcessingTime / 1000).toFixed(1)}s avg time
              </p>
              <p className="text-xs text-green-600 mt-1">
                {metrics.system.avgConfidence.toFixed(1)}% AI confidence
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time API Logs</CardTitle>
              <CardDescription>
                Live activity from Twilio, SendGrid, and system APIs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedService === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedService('all')}
              >
                All
              </Button>
              <Button
                variant={selectedService === 'twilio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedService('twilio')}
              >
                Twilio
              </Button>
              <Button
                variant={selectedService === 'sendgrid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedService('sendgrid')}
              >
                SendGrid
              </Button>
              <Button
                variant={selectedService === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedService('system')}
              >
                System
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(log.service)}
                        <Badge variant="outline" className="text-xs">
                          {log.service}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.cost && (
                        <span className="text-xs text-green-600">
                          ${log.cost.toFixed(4)}
                        </span>
                      )}
                      {log.duration && (
                        <span className="text-xs text-blue-600">
                          {log.duration > 1000 ? `${(log.duration/1000).toFixed(1)}s` : `${log.duration}ms`}
                        </span>
                      )}
                      <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No logs available for the selected service
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}