import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, Play, MoreHorizontal } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoUploadModal } from '@/components/VideoUploadModal';

// Mock video data - TODO: Replace with actual data from backend
const mockVideos = [
  {
    id: 1,
    title: "My Creative Journey: From Beginner to Creator",
    status: "Published",
    thumbnail: null, // Will use placeholder
    duration: "12:34",
    views: 1250,
    publishedAt: "2024-12-15"
  },
  {
    id: 2,
    title: "Behind the Scenes: Setting Up My Home Studio",
    status: "Published", 
    thumbnail: null,
    duration: "8:22",
    views: 892,
    publishedAt: "2024-12-10"
  },
  {
    id: 3,
    title: "Tutorial: Advanced Video Editing Techniques",
    status: "Draft",
    thumbnail: null,
    duration: "15:47",
    views: 0,
    publishedAt: null
  },
  {
    id: 4,
    title: "Q&A with My Community",
    status: "Published",
    thumbnail: null,
    duration: "25:12",
    views: 2100,
    publishedAt: "2024-12-05"
  }
];

export default function Dashboard() {
  // TODO: Replace with actual user data from authentication
  const username = "Creator";
  const hasVideos = mockVideos.length > 0;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // For testing - can toggle between showing videos and empty state
  // const hasVideos = false; // Uncomment to test empty state

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  const handleUploadVideo = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo showText={true} />
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary border-border"
              >
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
            Welcome, {username}
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your content and grow your audience
          </p>
        </div>

        {/* Your Videos Section */}
        <div className="space-y-6">
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
          {hasVideos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockVideos.map((video) => (
                <Card key={video.id} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="p-0">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gray-900 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          video.status === 'Published' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {video.status}
                        </span>
                      </div>
                      {/* More Options Button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {video.status === 'Published' && video.views > 0 
                            ? `${video.views.toLocaleString()} views`
                            : video.status === 'Draft'
                            ? 'Draft'
                            : 'No views yet'
                          }
                        </span>
                        {video.publishedAt && (
                          <span>
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
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
                  className="text-amber-700 dark:text-amber-300 border-amber-700 dark:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Video
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Future Dashboard Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Analytics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Analytics</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Track your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Coming soon
              </p>
            </CardContent>
          </Card>

          {/* Audience Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Audience</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Manage your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Coming soon
              </p>
            </CardContent>
          </Card>

          {/* Monetization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Monetization</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Earnings and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Video Upload Modal */}
      <VideoUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={handleCloseUploadModal} 
      />
    </div>
  );
}