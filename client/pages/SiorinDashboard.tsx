import { useEffect, useState } from "react";
import { getSiorinDashboard } from "@/services/siorinApi";
import type { DashboardResponse } from "@/types/siorin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RefreshCw, Users, Activity, Building, User2 } from "lucide-react";

const chartConfig = {
  count: {
    label: "Conversations",
    color: "#3b82f6",
  },
  unique_customers: {
    label: "Unique Customers",
    color: "#10b981",
  },
};

export default function SiorinDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getSiorinDashboard();
      setData(dashboardData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-500",
      failed: "bg-red-500",
      timeout: "bg-orange-500",
      in_progress: "bg-blue-500",
      cancelled: "bg-gray-500",
      pending: "bg-gray-500",
      confirmed: "bg-green-500",
      completed: "bg-blue-500",
      rescheduled: "bg-yellow-500",
      link_sent: "bg-blue-500",
      interested: "bg-yellow-500",
      converted: "bg-green-500",
      lost: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getMetricIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      total_customers: <Users className="h-4 w-4" />,
      active_today: <Activity className="h-4 w-4" />,
      b2b_customers: <Building className="h-4 w-4" />,
      b2c_customers: <User2 className="h-4 w-4" />,
    };
    return icons[key] || null;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Siorin Dashboard</h1>
            <p className="text-muted-foreground">Analytics and insights for Siorin agent</p>
          </div>
          <Button onClick={fetchDashboard} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">Error loading dashboard</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siorin Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and insights for Siorin agent
            {data && (
              <span className="ml-2 text-xs">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchDashboard} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="grid gap-6">
          {/* Overview Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Card 1: Overview Metrics (filtered - only showing 4 cards) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.overview)
              .filter(([key]) => !["meetings_booked", "product_inquiries"].includes(key))
              .map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </CardTitle>
                    {getMetricIcon(key)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Charts Row 1: Conversation Trends */}
          <Card>
            <CardHeader>
              <CardTitle>{data.conversation_trends.title}</CardTitle>
              <CardDescription>{data.conversation_trends.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.conversation_trends.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="Total Conversations"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="unique_customers"
                      stroke="#10b981"
                      name="Unique Customers"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <span>Total: {data.conversation_trends.total_conversations}</span>
                <span>Avg: {data.conversation_trends.avg_per_day.toFixed(1)}/day</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Recent Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle>{data.recent_activities.title}</CardTitle>
              <CardDescription>{data.recent_activities.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent_activities.data.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </TableCell>
                      <TableCell>
                        {activity.contact_name || activity.phone_number || "-"}
                      </TableCell>
                      <TableCell>
                        {activity.agent_route ? (
                          <Badge variant="outline">{activity.agent_route}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(activity.processing_duration_ms)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Card 7: Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(data.performance.avg_processing_time_ms / 1000).toFixed(2)}s
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.success_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.total_processed.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Timeouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.performance.timeout_count > 0 ? "text-red-500" : ""}`}>
                  {data.performance.timeout_count}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Human Takeovers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.human_takeover_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg AI Replies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.avg_ai_replies.toFixed(1)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: B2B vs B2C Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{data.b2b_b2c_distribution.title}</CardTitle>
              <CardDescription>{data.b2b_b2c_distribution.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.b2b_b2c_distribution.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type}: ${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.b2b_b2c_distribution.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Total Customers: {data.b2b_b2c_distribution.total_customers}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
