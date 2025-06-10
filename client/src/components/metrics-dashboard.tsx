import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export function MetricsDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/metrics"],
    queryFn: api.getMetrics,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <section id="metrics" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return (
      <section id="metrics" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Metrics</h2>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No metrics data available
          </CardContent>
        </Card>
      </section>
    );
  }

  const serviceTypeColors = {
    "AC Repair": "bg-red-500",
    "Maintenance": "bg-blue-500", 
    "Install": "bg-green-500",
    "Heating": "bg-yellow-500",
    "Other": "bg-gray-500"
  };

  const totalServiceTypes = Object.values(metrics.serviceTypeDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <section id="metrics" className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Metrics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Average Response Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.avgProcessingTime ? `${(metrics.avgProcessingTime / 1000).toFixed(1)}s` : "N/A"}
                </span>
              </div>
              <Progress value={Math.min(100, (3000 - metrics.avgProcessingTime) / 30)} className="w-full" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Processing Accuracy</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.avgConfidence ? `${metrics.avgConfidence}%` : "N/A"}
                </span>
              </div>
              <Progress value={metrics.avgConfidence || 0} className="w-full" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Jobs Processed</span>
                <span className="text-sm font-semibold text-gray-900">{metrics.totalJobs}</span>
              </div>
              <Progress value={Math.min(100, metrics.totalJobs / 10)} className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.serviceTypeDistribution).map(([serviceType, count]) => {
                const percentage = totalServiceTypes > 0 ? Math.round((count / totalServiceTypes) * 100) : 0;
                const colorClass = serviceTypeColors[serviceType as keyof typeof serviceTypeColors] || "bg-gray-500";
                
                return (
                  <div key={serviceType} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                      <span className="text-sm font-medium text-gray-700">{serviceType}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                  </div>
                );
              })}
            </div>
            
            {totalServiceTypes === 0 && (
              <div className="text-center text-gray-500 py-4">
                No service data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
