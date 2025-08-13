import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Video, DollarSign, BarChart3, Shield, Eye, UserX } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AdminDashboard() {
  const { user, profile } = useAuth();

  // Redirect if not admin
  if (!user || !profile || profile.role !== 'master_admin') {
    return <Navigate to="/" replace />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/admin/videos'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/videos');
      return response.json();
    },
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/admin/purchases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/purchases');
      return response.json();
    },
  });

  if (statsLoading || usersLoading || videosLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Master Admin</h1>
                <p className="text-sm text-muted-foreground">Platform oversight and management</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
              <Eye className="w-3 h-3 mr-1" />
              Stealth Mode
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.creators || 0} creators, {stats?.viewers || 0} viewers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="w-4 h-4" />
                Total Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_videos || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.free_videos || 0} free, {stats?.paid_videos || 0} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${((stats?.total_revenue || 0) / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Platform fee: ${((stats?.platform_fees || 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_purchases || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ${((stats?.avg_purchase || 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest platform signups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users?.slice(0, 5).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.display_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'creator' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Videos */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Videos</CardTitle>
              <CardDescription>Latest video uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videos?.slice(0, 5).map((video: any) => (
                  <div key={video.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-muted-foreground">by {video.creator_name}</p>
                    </div>
                    <Badge variant={video.is_free ? 'secondary' : 'default'}>
                      {video.is_free ? 'Free' : `$${(video.price / 100).toFixed(2)}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Latest platform transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchases?.slice(0, 10).map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{purchase.video_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.buyer_email} → {purchase.creator_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(purchase.amount_total / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fee: ${(purchase.platform_fee_amount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Notice */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Stealth Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300">
            <p>
              Your admin account is invisible to regular users. You won't appear in:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Featured Creators</li>
              <li>Creator directories</li>
              <li>Public user listings</li>
              <li>Platform statistics</li>
            </ul>
            <p className="mt-2 text-sm">
              You're operating as a ghost admin - managing the platform behind the scenes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}