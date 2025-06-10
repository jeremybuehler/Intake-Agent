import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { api, type JobSummary } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function JobLogs() {
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => api.getJobs(20),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <section id="job-logs" className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Job Processing</h2>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Processing Log</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading jobs...
                    </td>
                  </tr>
                ) : jobs && jobs.length > 0 ? (
                  jobs.map((job, index) => (
                    <tr key={job.job_id} className={index % 2 === 1 ? "bg-gray-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{job.job_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.service_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getUrgencyColor(job.urgency)}>
                          {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.ai_confidence ? `${job.ai_confidence}%` : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(job.submitted_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No jobs processed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
