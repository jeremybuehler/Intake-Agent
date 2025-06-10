import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type ApiTestRequest, type JobRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ApiTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [requestData, setRequestData] = useState(`{
  "customer_name": "Sarah Johnson",
  "customer_phone": "(512) 555-0123",
  "customer_email": "sarah.johnson@email.com",
  "address": "456 Oak Ave, Austin, TX 78702",
  "description": "Heater stopped working completely, house is getting cold",
  "preferred_time": "ASAP",
  "source": "Webhook"
}`);
  const [response, setResponse] = useState<JobRecord | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleSendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);

    try {
      const parsedData: ApiTestRequest = JSON.parse(requestData);
      const startTime = Date.now();
      
      const result = await api.testIntake(parsedData);
      const endTime = Date.now();
      
      setResponse(result);
      setResponseTime(endTime - startTime);
      
      toast({
        title: "Request Successful",
        description: `Job processed successfully in ${endTime - startTime}ms`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="test-endpoint" className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Tester</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Intake Endpoint</CardTitle>
          <p className="text-gray-600">Send sample job data to test the AI enrichment process</p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Request Payload</label>
              <Textarea 
                value={requestData}
                onChange={(e) => setRequestData(e.target.value)}
                className="h-64 font-mono text-sm"
                placeholder="Enter JSON payload..."
              />
              
              <div className="mt-4">
                <Button 
                  onClick={handleSendRequest}
                  disabled={isLoading}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Processing..." : "Send Test Request"}
                </Button>
              </div>
            </div>
            
            {/* Response Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
              <div className="h-64 bg-gray-900 rounded-lg p-3 overflow-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  {error ? (
                    <span className="text-red-400">Error: {error}</span>
                  ) : response ? (
                    JSON.stringify(response, null, 2)
                  ) : (
                    'Click "Send Test Request" to see the AI-enriched response...'
                  )}
                </pre>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <Badge variant={response ? "default" : error ? "destructive" : "secondary"}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    response ? "bg-green-400" : error ? "bg-red-400" : "bg-gray-400"
                  }`}></span>
                  {response ? "Success" : error ? "Error" : "Ready"}
                </Badge>
                <span className="text-sm text-gray-500">
                  Response time: {responseTime ? `${responseTime}ms` : "--"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
