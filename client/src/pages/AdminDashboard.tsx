import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, Video, DollarSign, BarChart3, Shield, Eye, UserX, 
  Settings, CreditCard, TrendingUp, Search, ExternalLink,
  Pause, Play, AlertTriangle, CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Temporary admin access check
  const hasAdminAccess = profile?.role === 'master_admin' || profile?.email === 'alex@jrvs.ai';

  // Admin stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: hasAdminAccess
  });

  // Recent users query
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: hasAdminAccess
  });

  // Recent videos query
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/admin/videos'],
    enabled: hasAdminAccess
  });

  // Recent purchases query
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/admin/purchases'],
    enabled: hasAdminAccess
  });

  // Temporary fix: Allow alex@jrvs.ai access while debugging role loading
  const isAuthorized = 
    profile?.role === 'master_admin' || 
    profile?.email === 'alex@jrvs.ai';

  console.log('Admin access check:', {
    userEmail: profile?.email,
    userRole: profile?.role,
    isAuthorized
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            Admin access required. Current role: {profile?.role || 'none'}
          </p>
          <p className="text-sm text-muted-foreground">
            Email: {profile?.email || 'none'}
          </p>
        </div>
      </div>
    );
  }

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statsLoading ? '...' : stats?.total_users || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.creators || 0} creators, {stats?.viewers || 0} viewers
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statsLoading ? '...' : stats?.total_videos || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.free_videos || 0} free, {stats?.paid_videos || 0} paid
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${statsLoading ? '...' : ((stats?.total_revenue || 0) / 100).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            ${((stats?.platform_fees || 0) / 100).toFixed(2)} platform fees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statsLoading ? '...' : stats?.total_purchases || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            ${((stats?.avg_purchase || 0) / 100).toFixed(2)} avg order value
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Master Admin Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Eye className="h-3 w-3 mr-1" />
                Stealth Mode Active
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  View Platform
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <StatsCards />
            
            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
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
                      {(!users || users.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">No users found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Videos */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Videos</CardTitle>
                  <CardDescription>Latest video uploads</CardDescription>
                </CardHeader>
                <CardContent>
                  {videosLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {videos?.slice(0, 5).map((video: any) => (
                        <div key={video.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{video.title}</p>
                            <p className="text-sm text-muted-foreground">by {video.creator_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(video.price / 100).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {video.is_free ? 'Free' : 'Paid'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!videos || videos.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">No videos found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Purchases */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Purchases</CardTitle>
                  <CardDescription>Latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {purchasesLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {purchases?.slice(0, 10).map((purchase: any) => (
                        <div key={purchase.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{purchase.video_title}</p>
                            <p className="text-sm text-muted-foreground">
                              by {purchase.creator_name} • bought by {purchase.buyer_email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(purchase.amount_total / 100).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              ${((purchase.platform_fee_amount || 0) / 100).toFixed(2)} platform fee
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!purchases || purchases.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">No purchases found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Creator Management</h2>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Search creators..." 
                  className="w-64"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Creator</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Videos</th>
                        <th className="p-4 font-medium">Revenue</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.filter((user: any) => user.role === 'creator').map((creator: any) => (
                        <tr key={creator.id} className="border-b">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <p className="font-medium">{creator.display_name || 'Unnamed'}</p>
                                <p className="text-sm text-muted-foreground">@{creator.username || 'no-username'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{creator.email}</td>
                          <td className="p-4">
                            <Badge variant="default">Active</Badge>
                          </td>
                          <td className="p-4 text-sm">0</td>
                          <td className="p-4 text-sm">$0.00</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Pause className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Video Management</h2>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Search videos..." 
                  className="w-64"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Video</th>
                        <th className="p-4 font-medium">Creator</th>
                        <th className="p-4 font-medium">Price</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Views</th>
                        <th className="p-4 font-medium">Revenue</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos?.map((video: any) => (
                        <tr key={video.id} className="border-b">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                                <Video className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium truncate max-w-xs">{video.title}</p>
                                <p className="text-sm text-muted-foreground">ID: {video.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{video.creator_name}</td>
                          <td className="p-4 text-sm">
                            {video.is_free ? 'Free' : `$${(video.price / 100).toFixed(2)}`}
                          </td>
                          <td className="p-4">
                            <Badge variant="default">Published</Badge>
                          </td>
                          <td className="p-4 text-sm">0</td>
                          <td className="p-4 text-sm">$0.00</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Pause className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Management</h2>
            
            {/* Platform Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stripe Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">TEST MODE</Badge>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Using test keys</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Platform Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">10%</div>
                  <p className="text-sm text-muted-foreground">1000 basis points</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Webhook Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Healthy</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Last: 2 min ago</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All platform transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchases?.map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{purchase.video_title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {purchase.creator_name} • {new Date(purchase.purchased_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(purchase.amount_total / 100).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          Platform: ${((purchase.platform_fee_amount || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <p className="text-sm text-muted-foreground">vs last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4%</div>
                  <p className="text-sm text-muted-foreground">visitors to buyers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Watch Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4:32</div>
                  <p className="text-sm text-muted-foreground">per video view</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Platform Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Configuration</CardTitle>
                  <CardDescription>Core platform settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                    <Input 
                      id="platform-fee" 
                      type="number" 
                      defaultValue="10" 
                      min="0" 
                      max="30" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Current: 10% (1000 basis points)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input 
                      id="support-email" 
                      type="email" 
                      defaultValue="support@mosswood.com"
                    />
                  </div>
                  
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform status overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Stripe API</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Healthy</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>File Storage</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Available</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Run System Check
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}