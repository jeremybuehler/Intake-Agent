import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3, CheckCircle, Zap } from "lucide-react";
import { ApiTester } from "@/components/api-tester";
import { JobLogs } from "@/components/job-logs";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { SystemDashboard } from "@/components/system-dashboard";
import { TwilioConfig } from "@/components/twilio-config";
import { ApiDashboard } from "@/components/api-dashboard";
import { WorkforceDashboard } from "@/components/workforce-dashboard";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    queryFn: api.getMetrics,
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Meridian FSM</h1>
                  <p className="text-xs text-gray-500">Maya - Intake Agent</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                Service Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              <div className="pb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="#overview" className="text-primary bg-primary/10 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <BarChart3 className="text-primary mr-3 h-4 w-4" />
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="#api-docs" className="text-gray-700 hover:text-primary hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <Activity className="text-gray-400 group-hover:text-primary mr-3 h-4 w-4" />
                      API Reference
                    </a>
                  </li>
                </ul>
              </div>
              <div className="pb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testing</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="#test-endpoint" className="text-gray-700 hover:text-primary hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <Zap className="text-gray-400 group-hover:text-primary mr-3 h-4 w-4" />
                      API Tester
                    </a>
                  </li>
                  <li>
                    <a href="#job-logs" className="text-gray-700 hover:text-primary hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <CheckCircle className="text-gray-400 group-hover:text-primary mr-3 h-4 w-4" />
                      Job Logs
                    </a>
                  </li>
                </ul>
              </div>
              <div className="pb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monitoring</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="#metrics" className="text-gray-700 hover:text-primary hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <BarChart3 className="text-gray-400 group-hover:text-primary mr-3 h-4 w-4" />
                      Metrics
                    </a>
                  </li>
                </ul>
              </div>
              <div className="pb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="#twilio" className="text-gray-700 hover:text-primary hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                      <Zap className="text-gray-400 group-hover:text-primary mr-3 h-4 w-4" />
                      Twilio Integration
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* System Overview */}
            <section id="overview" className="mb-12">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ava - FSM Intake Agent</h1>
                <p className="text-lg text-gray-600">AI-powered intake agent for JiveAI FSM operating system with intelligent job routing and validation</p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Service Status</h3>
                        <p className="text-2xl font-semibold text-green-600">Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Jobs Processed</h3>
                        <p className="text-2xl font-semibold text-blue-600">
                          {metrics?.totalJobs || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Success Rate</h3>
                        <p className="text-2xl font-semibold text-purple-600">
                          {metrics?.avgConfidence ? `${metrics.avgConfidence}%` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Architecture Overview */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">System Architecture</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">Data Intake</h3>
                      <p className="text-sm text-gray-500 mt-1">Webhooks, SMS, Phone/IVR, Email</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">Processing</h3>
                      <p className="text-sm text-gray-500 mt-1">GPT-4 analysis & enrichment</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">Structured Output</h3>
                      <p className="text-sm text-gray-500 mt-1">JobRecord dispatch ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* API Documentation */}
            <section id="api-docs" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Reference</h2>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Main Intake Endpoint */}
                <Card>
                  <CardContent className="p-0">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 text-green-800">POST</Badge>
                        <code className="text-lg font-mono text-gray-900">/api/intake</code>
                      </div>
                      <p className="text-gray-600 mt-2">Process and enrich raw job data using intelligence</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Body</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`{
  "customer_name": "John Smith",
  "customer_phone": "(555) 123-4567",
  "customer_email": "john@example.com",
  "address": "123 Main St, Austin, TX 78701",
  "description": "AC unit not cooling properly, making loud noises",
  "preferred_time": "Tomorrow morning",
  "source": "Webhook"
}`}</pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Response</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`{
  "job_id": "job_2024_001247",
  "customer": {
    "name": "John Smith",
    "phone": "(555) 123-4567",
    "email": "john@example.com",
    "address": "123 Main St, Austin, TX 78701"
  },
  "service_type": "AC Repair",
  "description": "AC unit not cooling properly, making loud noises",
  "ai_summary": "Cooling system malfunction with mechanical noise indicating potential compressor or fan motor issue",
  "issue_type": "HVAC_COOLING_FAILURE",
  "urgency": "high",
  "potential_parts": [
    "Compressor",
    "Fan Motor", 
    "Refrigerant"
  ],
  "preferred_time": "Tomorrow morning",
  "source": "Webhook",
  "submitted_at": "2024-01-15T10:30:00Z",
  "status": "pending_intake"
}`}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SMS Intake Endpoint */}
                <Card>
                  <CardContent className="p-0">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-blue-100 text-blue-800">POST</Badge>
                        <code className="text-lg font-mono text-gray-900">/api/intake/sms</code>
                      </div>
                      <p className="text-gray-600 mt-2">Convert SMS messages to job records (Twilio webhook compatible)</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Twilio SMS Webhook</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`{
  "From": "+15551234567",
  "Body": "John Smith\\n123 Oak Street\\nAC not working, very hot",
  "To": "+15559876543"
}`}</pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">TwiML Response</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you! Your service request has been received and assigned job ID: sms_2024_001248. Our team will contact you shortly.</Message>
</Response>`}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone Call Intake Endpoint */}
                <Card>
                  <CardContent className="p-0">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-purple-100 text-purple-800">POST</Badge>
                        <code className="text-lg font-mono text-gray-900">/api/intake/call</code>
                      </div>
                      <p className="text-gray-600 mt-2">Convert phone call transcriptions to job records (IVR compatible)</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Call Webhook</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`{
  "From": "+15551234567",
  "TranscriptionText": "Hi, this is Sarah Johnson. My heater stopped working at 456 Oak Avenue. It's getting very cold in here.",
  "CallSid": "CA123456789",
  "Caller": "Sarah Johnson"
}`}</pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">TwiML Response</h4>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">{`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Your service request has been recorded as job ID call_2024_001249. We will contact you shortly to schedule your appointment.</Say>
  <Hangup/>
</Response>`}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <ApiTester />
            <JobLogs />
            <MetricsDashboard />
            
            {/* Workforce Integration Section */}
            <section id="workforce" className="mb-12">
              <WorkforceDashboard />
            </section>
            
            {/* Twilio Configuration Section */}
            <section id="twilio" className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Twilio Integration</h2>
                <p className="text-gray-600">Configure Twilio API credentials for SMS, voice calls, and transcription services</p>
              </div>
              <TwilioConfig />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
