import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Dashboard() {
  // TODO: Replace with actual user data from authentication
  const username = "Creator";

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  const handleUploadVideo = () => {
    // TODO: Implement video upload flow
    console.log('Upload video clicked');
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
                className="text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-300"
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {username}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Manage your content and grow your audience
          </p>
        </div>

        {/* Your Videos Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Your Videos
            </h2>
            <Button 
              onClick={handleUploadVideo}
              className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-300 dark:hover:bg-amber-400 text-white dark:text-gray-900"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Video
            </Button>
          </div>

          {/* Videos Grid - Placeholder for now */}
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
    </div>
  );
}