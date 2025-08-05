import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalRevenue: number;
    totalPurchases: number;
    avgCompletionRate: number;
    avgRevenuePerViewer: number;
    newViewers: number;
    returningViewers: number;
    subscriberConversionRate: number;
  };
  videoPerformance: Array<{
    id: number;
    title: string;
    views: number;
    revenue: number;
    purchases: number;
    completionRate: number;
    revenuePerViewer: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  watchTimeTrend: Array<{
    date: string;
    avgWatchTime: number;
  }>;
  conversionFunnel: {
    views: number;
    watched30Sec: number;
    completed: number;
    purchased: number;
  };
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
  isLoading: boolean;
}

const COLORS = ['#007B82', '#1ecbe1', '#00bfa6', '#26a69a'];

export function AnalyticsCharts({ data, isLoading }: AnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare device breakdown data for pie chart
  const totalDeviceViews = data.deviceBreakdown.desktop + data.deviceBreakdown.mobile + data.deviceBreakdown.tablet;
  const deviceData = [
    { 
      name: 'Desktop', 
      value: data.deviceBreakdown.desktop, 
      percentage: totalDeviceViews > 0 ? Math.round((data.deviceBreakdown.desktop / totalDeviceViews) * 100) : 0,
      color: COLORS[0] 
    },
    { 
      name: 'Mobile', 
      value: data.deviceBreakdown.mobile, 
      percentage: totalDeviceViews > 0 ? Math.round((data.deviceBreakdown.mobile / totalDeviceViews) * 100) : 0,
      color: COLORS[1] 
    },
    { 
      name: 'Tablet', 
      value: data.deviceBreakdown.tablet, 
      percentage: totalDeviceViews > 0 ? Math.round((data.deviceBreakdown.tablet / totalDeviceViews) * 100) : 0,
      color: COLORS[2] 
    }
  ].filter(item => item.value > 0);

  // Prepare conversion funnel data
  const funnelData = [
    { name: 'Views', value: data.conversionFunnel.views, percentage: 100 },
    { 
      name: 'Watched 30s', 
      value: data.conversionFunnel.watched30Sec, 
      percentage: data.conversionFunnel.views > 0 ? Math.round((data.conversionFunnel.watched30Sec / data.conversionFunnel.views) * 100) : 0 
    },
    { 
      name: 'Completed', 
      value: data.conversionFunnel.completed, 
      percentage: data.conversionFunnel.views > 0 ? Math.round((data.conversionFunnel.completed / data.conversionFunnel.views) * 100) : 0 
    },
    { 
      name: 'Purchased', 
      value: data.conversionFunnel.purchased, 
      percentage: data.conversionFunnel.views > 0 ? Math.round((data.conversionFunnel.purchased / data.conversionFunnel.views) * 100) : 0 
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Watch Time Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Watch Time Trend</CardTitle>
          <CardDescription>Average watch time over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.watchTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [`${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`, 'Avg Watch Time']}
              />
              <Line 
                type="monotone" 
                dataKey="avgWatchTime" 
                stroke="#007B82" 
                strokeWidth={2}
                dot={{ fill: '#007B82', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Views by device type</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Views']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No device data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Videos</CardTitle>
          <CardDescription>Revenue and completion rates by video</CardDescription>
        </CardHeader>
        <CardContent>
          {data.videoPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.videoPerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                    if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="revenue" fill="#007B82" name="revenue" />
                <Bar dataKey="completionRate" fill="#1ecbe1" name="completionRate" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No video performance data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Viewer journey from view to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} (${props.payload.percentage}%)`, 
                  'Count'
                ]}
              />
              <Bar dataKey="value" fill="#007B82" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}