import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";

interface DispatchStatus {
  pending_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
  average_response_time: string;
  technicians_available: number;
  last_updated: string;
}

interface QuoteStatus {
  pending_quotes: number;
  draft_quotes: number;
  sent_quotes: number;
  approved_quotes: number;
  average_quote_value: number;
  conversion_rate: string;
  last_updated: string;
}

export function WorkforceDashboard() {
  const { data: dispatchData, isLoading: dispatchLoading } = useQuery<DispatchStatus>({
    queryKey: ["/api/workforce/dispatch"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: quoteData, isLoading: quoteLoading } = useQuery<QuoteStatus>({
    queryKey: ["/api/workforce/quotes"],
    refetchInterval: 30000
  });

  const testRouting = async (routeType: "dispatch" | "quote" | "fallback") => {
    try {
      const response = await fetch("/api/workforce/test-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_type: routeType })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`${routeType} routing test successful:`, result);
      }
    } catch (error) {
      console.error(`${routeType} routing test failed:`, error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Noetis Workforce Integration</h2>
          <p className="text-gray-600">Mill Dispatch and Quote System Status</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRouting("dispatch")}
          >
            Test Dispatch
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRouting("quote")}
          >
            Test Quote
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRouting("fallback")}
          >
            Test Fallback
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dispatch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dispatch">Mill Dispatch</TabsTrigger>
          <TabsTrigger value="quotes">Quote System</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dispatchLoading ? "..." : dispatchData?.pending_jobs || 0}
                </div>
                <p className="text-xs text-gray-600">Awaiting assignment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Jobs</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dispatchLoading ? "..." : dispatchData?.assigned_jobs || 0}
                </div>
                <p className="text-xs text-gray-600">Active assignments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dispatchLoading ? "..." : dispatchData?.in_progress_jobs || 0}
                </div>
                <p className="text-xs text-gray-600">Currently working</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dispatchLoading ? "..." : dispatchData?.completed_today || 0}
                </div>
                <p className="text-xs text-gray-600">Jobs finished</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dispatchLoading ? "..." : dispatchData?.average_response_time || "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-2">Average dispatch response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Available Technicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dispatchLoading ? "..." : dispatchData?.technicians_available || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">Ready for assignment</p>
              </CardContent>
            </Card>
          </div>

          {dispatchData?.last_updated && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last updated:</span>
                  <Badge variant="outline">
                    {new Date(dispatchData.last_updated).toLocaleTimeString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quoteLoading ? "..." : quoteData?.pending_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft Quotes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quoteLoading ? "..." : quoteData?.draft_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">In preparation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent Quotes</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quoteLoading ? "..." : quoteData?.sent_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Awaiting response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quoteLoading ? "..." : quoteData?.approved_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Customer approved</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Average Quote Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {quoteLoading ? "..." : `$${quoteData?.average_quote_value?.toLocaleString() || 0}`}
                </div>
                <p className="text-sm text-gray-600 mt-2">Per quote average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {quoteLoading ? "..." : quoteData?.conversion_rate || "0%"}
                </div>
                <p className="text-sm text-gray-600 mt-2">Quote to job conversion</p>
              </CardContent>
            </Card>
          </div>

          {quoteData?.last_updated && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last updated:</span>
                  <Badge variant="outline">
                    {new Date(quoteData.last_updated).toLocaleTimeString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}