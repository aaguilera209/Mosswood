import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, ArrowLeft, Clock, Wrench, Settings, Video } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLocation } from 'wouter';

export default function EditVideoComingSoon() {
  const [, setLocation] = useLocation();

  const handleGoBack = () => {
    setLocation('/dashboard?tab=videos');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo showText={true} />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Edit className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Video Editing Coming Soon!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building an amazing video editing experience for creators. This feature will include:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Video Details</h3>
                <p className="text-sm text-muted-foreground">
                  Edit title, description, tags, and pricing
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Advanced Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage visibility, audience restrictions, and more
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Media Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Upload new thumbnails and update video files
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Expected release: Q2 2025
              </span>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleGoBack}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Videos
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}