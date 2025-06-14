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

interface FelixAgentStatus {
  pending_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
  average_response_time: string;
  technicians_available: number;
  last_updated: string;
}

interface QuinnAgentStatus {
  pending_quotes: number;
  draft_quotes: number;
  sent_quotes: number;
  approved_quotes: number;
  average_quote_value: number;
  conversion_rate: string;
  last_updated: string;
}

export function WorkforceDashboard() {
  const { data: felixData, isLoading: felixLoading } = useQuery<FelixAgentStatus>({
    queryKey: ["/api/workforce/dispatch"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: quinnData, isLoading: quinnLoading } = useQuery<QuinnAgentStatus>({
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
          <h2 className="text-2xl font-bold text-gray-900">Noetis Mesh Agents</h2>
          <p className="text-gray-600">Felix & Quinn Agent Status</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRouting("dispatch")}
          >
            Test Felix
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRouting("quote")}
          >
            Test Quinn
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
          <TabsTrigger value="dispatch">Felix Agent</TabsTrigger>
          <TabsTrigger value="quotes">Quinn Agent</TabsTrigger>
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
                  {felixLoading ? "..." : felixData?.pending_jobs || 0}
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
                <div className="text-2xl font-bold text-blue-600">
                  {felixLoading ? "..." : felixData?.assigned_jobs || 0}
                </div>
                <p className="text-xs text-gray-600">Currently in field</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {felixLoading ? "..." : felixData?.in_progress_jobs || 0}
                </div>
                <p className="text-xs text-gray-600">Active service calls</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {felixLoading ? "..." : felixData?.completed_today || 0}
                </div>
                <p className="text-xs text-gray-600">Jobs finished</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Felix Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="font-medium">
                    {felixLoading ? "..." : felixData?.average_response_time || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available Technicians</span>
                  <span className="font-medium">
                    {felixLoading ? "..." : felixData?.technicians_available || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-xs text-gray-500">
                    {felixData?.last_updated ? new Date(felixData.last_updated).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                    <span>{felixData?.pending_jobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Assigned</Badge>
                    <span>{felixData?.assigned_jobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-green-600 border-green-600">In Progress</Badge>
                    <span>{felixData?.in_progress_jobs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {quinnLoading ? "..." : quinnData?.pending_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Awaiting preparation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft Quotes</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {quinnLoading ? "..." : quinnData?.draft_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Being prepared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent Quotes</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {quinnLoading ? "..." : quinnData?.sent_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Awaiting customer response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Quotes</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {quinnLoading ? "..." : quinnData?.approved_quotes || 0}
                </div>
                <p className="text-xs text-gray-600">Ready for scheduling</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quinn Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Quote Value</span>
                  <span className="font-medium">
                    {quinnLoading ? "..." : `$${quinnData?.average_quote_value || 0}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-medium">
                    {quinnLoading ? "..." : quinnData?.conversion_rate || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-xs text-gray-500">
                    {quinnData?.last_updated ? new Date(quinnData.last_updated).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quote Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                    <span>{quinnData?.pending_quotes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Draft</Badge>
                    <span>{quinnData?.draft_quotes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-green-600 border-green-600">Sent</Badge>
                    <span>{quinnData?.sent_quotes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Approved</Badge>
                    <span>{quinnData?.approved_quotes || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}