import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Database, Brain, Webhook, MessageCircle, Phone, Settings, Activity } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  status: "healthy" | "degraded";
  timestamp: string;
  services: {
    database: "connected" | "disconnected";
    openai: "connected" | "disconnected";
  };
  config: {
    endpoints: {
      webhooks: boolean;
      sms: boolean;
      phone: boolean;
    };
    processing: {
      timeout: number;
      retries: number;
    };
  };
}

interface ConnectionStatus {
  database: boolean;
  openai: boolean;
  lastChecked: string;
  config: {
    database: {
      maxConnections: number;
      timeout: number;
    };
    openai: {
      model: string;
      timeout: number;
    };
    endpoints: {
      webhooks: boolean;
      sms: boolean;
      phone: boolean;
    };
  };
}

interface SystemConfig {
  endpoints: {
    webhooks: {
      enabled: boolean;
      rateLimit: {
        windowMs: number;
        maxRequests: number;
      };
    };
    sms: {
      enabled: boolean;
      provider: string;
      webhookPath: string;
      rateLimit: {
        windowMs: number;
        maxRequests: number;
      };
    };
    phone: {
      enabled: boolean;
      provider: string;
      webhookPath: string;
      transcriptionEnabled: boolean;
      rateLimit: {
        windowMs: number;
        maxRequests: number;
      };
    };
  };
  processing: {
    timeoutMs: number;
    retryAttempts: number;
    batchSize: number;
    enableFallback: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    metricsRetentionDays: number;
  };
  openai: {
    model: string;
    timeout: number;
    maxRetries: number;
    temperature: number;
  };
}

export function SystemDashboard() {
  const { toast } = useToast();

  const { data: health, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<ConnectionStatus>({
    queryKey: ["/api/system/connections"],
    refetchInterval: 30000,
  });

  const { data: config, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/system/config"],
  });

  const reconnectDatabase = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/system/connections/database/reconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reconnect database");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/connections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reconnect database",
        variant: "destructive",
      });
    },
  });

  const reconnectOpenAI = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/system/connections/openai/reconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reconnect OpenAI");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/connections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reconnect OpenAI",
        variant: "destructive",
      });
    },
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
    queryClient.invalidateQueries({ queryKey: ["/api/system/connections"] });
    queryClient.invalidateQueries({ queryKey: ["/api/system/config"] });
  };

  if (healthLoading || connectionsLoading || configLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Dashboard</h2>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Dashboard</h2>
        <Button onClick={refreshAll} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system status and service availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={health?.status === "healthy" ? "default" : "destructive"}>
                {health?.status?.toUpperCase() || "UNKNOWN"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "Unknown"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Database</span>
              </div>
              <Badge variant={health?.services.database === "connected" ? "default" : "destructive"}>
                {health?.services.database || "Unknown"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>OpenAI</span>
              </div>
              <Badge variant={health?.services.openai === "connected" ? "default" : "destructive"}>
                {health?.services.openai || "Unknown"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Management */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection
            </CardTitle>
            <CardDescription>
              PostgreSQL database connection status and controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge variant={connections?.database ? "default" : "destructive"}>
                {connections?.database ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Max Connections</span>
              <span className="font-mono text-sm">{connections?.config.database.maxConnections}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timeout</span>
              <span className="font-mono text-sm">{connections?.config.database.timeout}ms</span>
            </div>
            <Separator />
            <Button
              onClick={() => reconnectDatabase.mutate()}
              disabled={reconnectDatabase.isPending}
              variant="outline"
              className="w-full"
            >
              {reconnectDatabase.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              OpenAI Connection
            </CardTitle>
            <CardDescription>
              AI service connection status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge variant={connections?.openai ? "default" : "destructive"}>
                {connections?.openai ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Model</span>
              <span className="font-mono text-sm">{connections?.config.openai.model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timeout</span>
              <span className="font-mono text-sm">{connections?.config.openai.timeout}ms</span>
            </div>
            <Separator />
            <Button
              onClick={() => reconnectOpenAI.mutate()}
              disabled={reconnectOpenAI.isPending}
              variant="outline"
              className="w-full"
            >
              {reconnectOpenAI.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect OpenAI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Endpoint Configuration
          </CardTitle>
          <CardDescription>
            Intake channel availability and rate limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  <span className="font-medium">Webhooks</span>
                </div>
                <Badge variant={config?.endpoints.webhooks.enabled ? "default" : "secondary"}>
                  {config?.endpoints.webhooks.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Rate: {config?.endpoints.webhooks.rateLimit.maxRequests} req/15min</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">SMS</span>
                </div>
                <Badge variant={config?.endpoints.sms.enabled ? "default" : "secondary"}>
                  {config?.endpoints.sms.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Provider: {config?.endpoints.sms.provider}</div>
                <div>Rate: {config?.endpoints.sms.rateLimit.maxRequests} req/min</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone/IVR</span>
                </div>
                <Badge variant={config?.endpoints.phone.enabled ? "default" : "secondary"}>
                  {config?.endpoints.phone.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Provider: {config?.endpoints.phone.provider}</div>
                <div>Rate: {config?.endpoints.phone.rateLimit.maxRequests} req/min</div>
                <div>Transcription: {config?.endpoints.phone.transcriptionEnabled ? "On" : "Off"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Configuration</CardTitle>
          <CardDescription>
            Job processing settings and AI configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Processing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Timeout</span>
                  <span className="font-mono">{config?.processing.timeoutMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Retry Attempts</span>
                  <span className="font-mono">{config?.processing.retryAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Batch Size</span>
                  <span className="font-mono">{config?.processing.batchSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fallback</span>
                  <Badge variant={config?.processing.enableFallback ? "default" : "secondary"}>
                    {config?.processing.enableFallback ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">AI Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Model</span>
                  <span className="font-mono">{config?.openai.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature</span>
                  <span className="font-mono">{config?.openai.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Retries</span>
                  <span className="font-mono">{config?.openai.maxRetries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeout</span>
                  <span className="font-mono">{config?.openai.timeout}ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}