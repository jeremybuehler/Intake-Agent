import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  MessageCircle, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Save,
  Trash2,
  ExternalLink 
} from "lucide-react";

const twilioConfigSchema = z.object({
  account_sid: z.string().min(1, "Account SID is required"),
  auth_token: z.string().min(1, "Auth Token is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  webhook_url: z.string().url().optional().or(z.literal("")),
  sms_enabled: z.boolean().default(true),
  voice_enabled: z.boolean().default(true),
  transcription_enabled: z.boolean().default(true),
  auto_response_enabled: z.boolean().default(true),
  fallback_url: z.string().url().optional().or(z.literal("")),
  status_callback_url: z.string().url().optional().or(z.literal("")),
});

type TwilioConfigForm = z.infer<typeof twilioConfigSchema>;

interface TwilioConfig {
  id: number;
  account_sid: string;
  phone_number: string;
  webhook_url?: string;
  sms_enabled: boolean;
  voice_enabled: boolean;
  transcription_enabled: boolean;
  auto_response_enabled: boolean;
  fallback_url?: string;
  status_callback_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function TwilioConfig() {
  const [showAuthToken, setShowAuthToken] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ["/api/twilio/config"],
    queryFn: async () => {
      const response = await fetch("/api/twilio/config");
      if (!response.ok) throw new Error("Failed to fetch configuration");
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }
      
      try {
        return JSON.parse(text) as TwilioConfig | null;
      } catch (e) {
        return null;
      }
    },
  });

  const form = useForm<TwilioConfigForm>({
    resolver: zodResolver(twilioConfigSchema),
    defaultValues: {
      account_sid: config?.account_sid || "",
      auth_token: "",
      phone_number: config?.phone_number || "",
      webhook_url: config?.webhook_url || "",
      sms_enabled: config?.sms_enabled || true,
      voice_enabled: config?.voice_enabled || true,
      transcription_enabled: config?.transcription_enabled || true,
      auto_response_enabled: config?.auto_response_enabled || true,
      fallback_url: config?.fallback_url || "",
      status_callback_url: config?.status_callback_url || "",
    },
  });

  // Update form when config is loaded
  useState(() => {
    if (config) {
      form.reset({
        account_sid: config.account_sid,
        auth_token: "", // Never populate auth token for security
        phone_number: config.phone_number,
        webhook_url: config.webhook_url || "",
        sms_enabled: config.sms_enabled,
        voice_enabled: config.voice_enabled,
        transcription_enabled: config.transcription_enabled,
        auto_response_enabled: config.auto_response_enabled,
        fallback_url: config.fallback_url || "",
        status_callback_url: config.status_callback_url || "",
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: TwilioConfigForm) => {
      const cleanData = {
        ...data,
        webhook_url: data.webhook_url || undefined,
        fallback_url: data.fallback_url || undefined,
        status_callback_url: data.status_callback_url || undefined,
      };
      
      const response = await fetch("/api/twilio/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save configuration");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twilio/config"] });
      toast({
        title: "Configuration saved",
        description: "Twilio configuration has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration failed",
        description: error.message || "Failed to save Twilio configuration.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/twilio/config/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete configuration");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twilio/config"] });
      toast({
        title: "Configuration deleted",
        description: "Twilio configuration has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete configuration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TwilioConfigForm) => {
    createMutation.mutate(data);
  };

  const handleDelete = () => {
    if (config && window.confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(config.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading configuration...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Twilio configuration. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Twilio Integration Configuration
          </CardTitle>
          <CardDescription>
            Configure Twilio API credentials for SMS, voice calls, and transcription services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Configuration Active</span>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Account SID</Label>
                  <p className="font-mono text-blue-700 dark:text-blue-300">
                    {config.account_sid ? `${config.account_sid.substring(0, 8)}...${config.account_sid.slice(-4)}` : 'Not configured'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-mono text-green-700 dark:text-green-300">{config.phone_number || 'Not configured'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{new Date(config.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p>{new Date(config.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">SMS</span>
                  <Badge variant={config.sms_enabled ? "default" : "secondary"}>
                    {config.sms_enabled ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Voice</span>
                  <Badge variant={config.voice_enabled ? "default" : "secondary"}>
                    {config.voice_enabled ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Transcription</span>
                  <Badge variant={config.transcription_enabled ? "default" : "secondary"}>
                    {config.transcription_enabled ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Auto Response</span>
                  <Badge variant={config.auto_response_enabled ? "default" : "secondary"}>
                    {config.auto_response_enabled ? "On" : "Off"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Update Configuration
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Twilio configuration found. Please set up your Twilio integration below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Form</CardTitle>
          <CardDescription>
            {config ? "Update your Twilio configuration" : "Set up your Twilio integration"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="credentials" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_sid">Account SID *</Label>
                    <Input
                      id="account_sid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      {...form.register("account_sid")}
                    />
                    {form.formState.errors.account_sid && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.account_sid.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth_token">Auth Token *</Label>
                    <div className="relative">
                      <Input
                        id="auth_token"
                        type={showAuthToken ? "text" : "password"}
                        placeholder="Enter your Twilio Auth Token"
                        {...form.register("auth_token")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                      >
                        {showAuthToken ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {form.formState.errors.auth_token && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.auth_token.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    placeholder="+1234567890"
                    {...form.register("phone_number")}
                  />
                  {form.formState.errors.phone_number && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.phone_number.message}
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can find these credentials in your{" "}
                    <a 
                      href="https://console.twilio.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Twilio Console
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Services</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable SMS message processing
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("sms_enabled")}
                      onCheckedChange={(checked) => form.setValue("sms_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Voice Services</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable voice call processing
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("voice_enabled")}
                      onCheckedChange={(checked) => form.setValue("voice_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Transcription</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable call transcription
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("transcription_enabled")}
                      onCheckedChange={(checked) => form.setValue("transcription_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Response</Label>
                      <p className="text-sm text-muted-foreground">
                        Send automated confirmations
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("auto_response_enabled")}
                      onCheckedChange={(checked) => form.setValue("auto_response_enabled", checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">Primary Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://your-domain.com/api/intake/sms"
                      {...form.register("webhook_url")}
                    />
                    {form.formState.errors.webhook_url && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.webhook_url.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fallback_url">Fallback URL</Label>
                    <Input
                      id="fallback_url"
                      placeholder="https://your-domain.com/api/fallback"
                      {...form.register("fallback_url")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status_callback_url">Status Callback URL</Label>
                    <Input
                      id="status_callback_url"
                      placeholder="https://your-domain.com/api/status"
                      {...form.register("status_callback_url")}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure these URLs in your Twilio phone number settings to enable webhook functionality.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {config ? "Update Configuration" : "Save Configuration"}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}