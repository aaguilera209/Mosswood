import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Plus, Play, MoreHorizontal, LogOut, BarChart3, Users, DollarSign, TrendingUp, Clock, Eye, ShoppingCart, Gift, Calendar, Mail, MapPin, Repeat, ArrowUp, ArrowDown, Edit, Trash2, User } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StripeConnectSetup } from '@/components/StripeConnectSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Mock video data with enhanced analytics - TODO: Replace with actual data from backend
const mockVideos = [
  {
    id: 1,
    title: "My Creative Journey: From Beginner to Creator",
    status: "Published",
    thumbnail: null,
    duration: "12:34",
    views: 1250,
    purchases: 89,
    revenue: 891.00,
    conversionRate: 7.1,
    watchThroughRate: 78,
    avgWatchTime: "9:47",
    publishedAt: "2024-12-15"
  },
  {
    id: 2,
    title: "Behind the Scenes: Setting Up My Home Studio",
    status: "Published", 
    thumbnail: null,
    duration: "8:22",
    views: 892,
    purchases: 67,
    revenue: 670.00,
    conversionRate: 7.5,
    watchThroughRate: 82,
    avgWatchTime: "6:51",
    publishedAt: "2024-12-10"
  },
  {
    id: 3,
    title: "Tutorial: Advanced Video Editing Techniques",
    status: "Draft",
    thumbnail: null,
    duration: "15:47",
    views: 0,
    purchases: 0,
    revenue: 0,
    conversionRate: 0,
    watchThroughRate: 0,
    avgWatchTime: "0:00",
    publishedAt: null
  },
  {
    id: 4,
    title: "Q&A with My Community",
    status: "Published",
    thumbnail: null,
    duration: "25:12",
    views: 2100,
    purchases: 134,
    revenue: 1340.00,
    conversionRate: 6.4,
    watchThroughRate: 65,
    avgWatchTime: "16:23",
    publishedAt: "2024-12-05"
  }
];

// Mock promo code data
const mockPromoCodes = [
  {
    id: 1,
    code: "WELCOME20",
    discount: 20,
    discountType: "percentage",
    totalRedemptions: 23,
    revenueGenerated: 437.60,
    createdAt: "2024-12-01",
    redemptions: [
      {
        id: 1,
        userEmail: "sarah.m@example.com",
        videoTitle: "My Creative Journey: From Beginner to Creator",
        videoId: 1,
        redeemedAt: "2024-12-15T14:32:00Z",
        originalPrice: 10.00,
        discountAmount: 2.00,
        finalPrice: 8.00
      },
      {
        id: 2,
        userEmail: "alex.rivera@example.com",
        videoTitle: "Behind the Scenes: Setting Up My Home Studio",
        videoId: 2,
        redeemedAt: "2024-12-14T09:15:00Z",
        originalPrice: 10.00,
        discountAmount: 2.00,
        finalPrice: 8.00
      },
      {
        id: 3,
        userEmail: "mike.chen@example.com",
        videoTitle: "Q&A with My Community",
        videoId: 4,
        redeemedAt: "2024-12-13T16:45:00Z",
        originalPrice: 10.00,
        discountAmount: 2.00,
        finalPrice: 8.00
      }
    ]
  },
  {
    id: 2,
    code: "STUDENT50",
    discount: 50,
    discountType: "percentage",
    totalRedemptions: 8,
    revenueGenerated: 40.00,
    createdAt: "2024-11-15",
    redemptions: [
      {
        id: 4,
        userEmail: "student@university.edu",
        videoTitle: "Tutorial: Advanced Video Editing Techniques",
        videoId: 3,
        redeemedAt: "2024-12-10T11:20:00Z",
        originalPrice: 10.00,
        discountAmount: 5.00,
        finalPrice: 5.00
      }
    ]
  },
  {
    id: 3,
    code: "HOLIDAY2024",
    discount: 15,
    discountType: "percentage",
    totalRedemptions: 0,
    revenueGenerated: 0,
    createdAt: "2024-12-20",
    redemptions: []
  }
];

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalRevenue: 2901.60,
    totalViews: 4242,
    totalPurchases: 290,
    overallConversionRate: 6.8,
    promoCodeRevenue: 477.60,
    growthMetrics: {
      revenueGrowth: 12.3,
      viewsGrowth: 8.7,
      purchasesGrowth: 15.2
    }
  },
  revenueOverTime: [
    { date: "2024-12-01", revenue: 145.50, views: 289 },
    { date: "2024-12-02", revenue: 178.20, views: 356 },
    { date: "2024-12-03", revenue: 203.80, views: 401 },
    { date: "2024-12-04", revenue: 156.90, views: 312 },
    { date: "2024-12-05", revenue: 298.40, views: 578 },
    { date: "2024-12-06", revenue: 189.30, views: 367 },
    { date: "2024-12-07", revenue: 234.60, views: 456 }
  ],
  audienceInsights: {
    topCountries: [
      { country: "United States", viewers: 1847, percentage: 43.5 },
      { country: "Canada", viewers: 678, percentage: 16.0 },
      { country: "United Kingdom", viewers: 512, percentage: 12.1 },
      { country: "Australia", viewers: 345, percentage: 8.1 },
      { country: "Germany", viewers: 289, percentage: 6.8 }
    ],
    repeatPurchasers: 47,
    emailSubscribers: 1234,
    emailGrowthRate: 5.8
  }
};

function DashboardContent() {
  const { profile, signOut, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
  const [deleteVideoTitle, setDeleteVideoTitle] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch real videos from API
  const { data: videosData, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      if (!user?.id) return { videos: [] };
      const response = await fetch(`/api/videos?creator_id=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  const videos = videosData?.videos || [];
  const hasVideos = videos.length > 0;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  const handleUploadVideo = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleVideoClick = (videoId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLocation(`/video/${videoId}`);
  };

  const handleDeleteVideoConfirm = async () => {
    if (!deleteVideoId) return;

    try {
      const response = await apiRequest('DELETE', `/api/videos/${deleteVideoId}`);
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      toast({
        title: "Video Deleted",
        description: `"${deleteVideoTitle}" has been deleted successfully.`,
      });

      // Refresh videos list
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      
      // Close modal
      setDeleteVideoId(null);
      setDeleteVideoTitle('');
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = (videoId: number, videoTitle: string) => {
    setDeleteVideoId(videoId);
    setDeleteVideoTitle(videoTitle);
  };

  const handleEditVideo = () => {
    setLocation('/edit-video-coming-soon');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo showText={true} />
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {profile?.email} ({profile?.role})
              </span>
              <Button
                onClick={() => setLocation('/edit-profile')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
              <ThemeToggle />
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary border-border"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome, Creator
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your content and grow your audience
          </p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="promo-codes">Promo Codes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockAnalytics.overview.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{mockAnalytics.overview.growthMetrics.revenueGrowth}%
                    </span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.overview.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{mockAnalytics.overview.growthMetrics.viewsGrowth}%
                    </span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.overview.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{mockAnalytics.overview.growthMetrics.purchasesGrowth}%
                    </span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.overview.overallConversionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Above industry average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stripe Connect Setup */}
            <StripeConnectSetup />

            {/* Recent Performance */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Videos</CardTitle>
                  <CardDescription>Your highest-earning content this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockVideos.filter(v => v.status === 'Published').sort((a, b) => b.revenue - a.revenue).slice(0, 3).map((video) => (
                      <div key={video.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{video.title}</p>
                          <p className="text-sm text-muted-foreground">{video.views} views • {video.purchases} purchases</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${video.revenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{video.conversionRate}% conv.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Promo Code Summary</CardTitle>
                  <CardDescription>Revenue generated from discount codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Promo Revenue</span>
                      <span className="font-bold">${mockAnalytics.overview.promoCodeRevenue.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      {mockPromoCodes.filter(code => code.totalRedemptions > 0).map((code) => (
                        <div key={code.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{code.code}</span>
                          <div className="text-right">
                            <span className="font-medium">${code.revenueGenerated.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-2">({code.totalRedemptions} uses)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Your Videos
              </h2>
              <Button 
                onClick={handleUploadVideo}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Video
              </Button>
            </div>

            {/* Videos Grid */}
            {videosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : hasVideos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="group hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="p-0">
                      {/* Video Thumbnail */}
                      <div 
                        className="relative aspect-video bg-gray-900 dark:bg-gray-800 rounded-t-lg overflow-hidden cursor-pointer"
                        onClick={(e) => handleVideoClick(video.id, e)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {video.duration}
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                            Published
                          </span>
                        </div>
                        {/* More Options Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVideoClick(video.id);
                              }}>
                                <Play className="w-4 h-4 mr-2" />
                                Watch Video
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditVideo();
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Video
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteVideo(video.id, video.title);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Video
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="p-4 cursor-pointer"
                      onClick={(e) => handleVideoClick(video.id, e)}
                    >
                      <CardTitle className="text-base mb-2 line-clamp-2">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mb-3">
                        {video.description || 'No description provided'}
                      </CardDescription>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {video.is_free ? 'Free' : `$${(video.price / 100).toFixed(2)}`}
                        </div>
                        <div className="flex items-center">
                          <Upload className="w-4 h-4 mr-1" />
                          {new Date(video.created_at).toLocaleDateString()}
                        </div>
                        {video.tags && video.tags.length > 0 && (
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {video.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{video.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Empty State
              <Card className="w-full">
                <CardHeader className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    No videos yet
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Start building your content library by uploading your first video
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-12">
                  <Button 
                    onClick={handleUploadVideo}
                    variant="outline"
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Video
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">Advanced Analytics</h2>
              
              {/* Video Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Performance</CardTitle>
                  <CardDescription>Detailed metrics for your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockVideos.filter(v => v.status === 'Published').map((video) => (
                      <div key={video.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium line-clamp-1 flex-1">{video.title}</h4>
                          <Badge variant={video.conversionRate > 7 ? "default" : "secondary"}>
                            {video.conversionRate}% conversion
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground flex items-center"><Eye className="w-3 h-3 mr-1" />Views</p>
                            <p className="font-semibold">{video.views.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center"><ShoppingCart className="w-3 h-3 mr-1" />Purchases</p>
                            <p className="font-semibold">{video.purchases}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1" />Watch Rate</p>
                            <p className="font-semibold">{video.watchThroughRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center"><DollarSign className="w-3 h-3 mr-1" />Revenue</p>
                            <p className="font-semibold">${video.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Avg. watch time: {video.avgWatchTime} • Published: {new Date(video.publishedAt!).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Insights */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Insights</CardTitle>
                    <CardDescription>Financial performance breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Revenue</span>
                        <span className="font-bold">${mockAnalytics.overview.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Direct Sales</span>
                        <span>${(mockAnalytics.overview.totalRevenue - mockAnalytics.overview.promoCodeRevenue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Promo Code Sales</span>
                        <span>${mockAnalytics.overview.promoCodeRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h5 className="font-medium mb-3">Revenue by Video</h5>
                      <div className="space-y-2">
                        {mockVideos.filter(v => v.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((video) => (
                          <div key={video.id} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground line-clamp-1 flex-1">{video.title}</span>
                            <span className="font-medium ml-2">${video.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                    <CardDescription>Know your viewers better</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-3">Top Viewer Countries</h5>
                      <div className="space-y-2">
                        {mockAnalytics.audienceInsights.topCountries.slice(0, 5).map((country) => (
                          <div key={country.country} className="flex justify-between items-center text-sm">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-2 text-muted-foreground" />
                              {country.country}
                            </span>
                            <div className="text-right">
                              <span className="font-medium">{country.viewers}</span>
                              <span className="text-muted-foreground ml-1">({country.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Repeat className="w-3 h-3 mr-1" />
                          Repeat Purchasers
                        </span>
                        <span className="font-medium">{mockAnalytics.audienceInsights.repeatPurchasers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          Email Subscribers
                        </span>
                        <span className="font-medium">{mockAnalytics.audienceInsights.emailSubscribers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Growth Rate</span>
                        <span className="font-medium text-green-600">+{mockAnalytics.audienceInsights.emailGrowthRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promo-codes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Promo Code Performance</h2>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New Code
              </Button>
            </div>

            <div className="space-y-6">
              {mockPromoCodes.length > 0 ? (
                mockPromoCodes.map((promoCode) => (
                  <Card key={promoCode.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            {promoCode.code}
                          </CardTitle>
                          <CardDescription>
                            {promoCode.discount}% discount • Created {new Date(promoCode.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{promoCode.totalRedemptions}</p>
                          <p className="text-sm text-muted-foreground">redemptions</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {promoCode.redemptions.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Revenue Generated:</span>
                            <span className="font-bold text-green-600">${promoCode.revenueGenerated.toLocaleString()}</span>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-3">Recent Redemptions</h5>
                            <div className="space-y-3">
                              {promoCode.redemptions.slice(0, 5).map((redemption) => (
                                <div key={redemption.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{redemption.userEmail}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{redemption.videoTitle}</p>
                                    <p className="text-xs text-muted-foreground flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(redemption.redeemedAt).toLocaleDateString()} at {new Date(redemption.redeemedAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm">
                                      <span className="line-through text-muted-foreground">${redemption.originalPrice}</span>
                                      <span className="ml-2 font-medium">${redemption.finalPrice}</span>
                                    </p>
                                    <p className="text-xs text-green-600">-${redemption.discountAmount} saved</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {promoCode.redemptions.length > 5 && (
                              <Button variant="outline" size="sm" className="w-full mt-3">
                                View All {promoCode.redemptions.length} Redemptions
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No redemptions yet. Share this promo code to start tracking!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Gift className="w-8 h-8 text-gray-400" />
                    </div>
                    <CardTitle>No promo codes yet</CardTitle>
                    <CardDescription>
                      Create discount codes to boost sales and track redemptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-12">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Promo Code
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Video Upload Modal */}
      <VideoUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={handleCloseUploadModal} 
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={(open) => !open && setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteVideoTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteVideoId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVideoConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}