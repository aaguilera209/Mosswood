import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Users, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import FeaturedCreatorsCarousel from '@/components/FeaturedCreatorsCarousel.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Real featured creators from database

export default function ViewerHome() {
  const { user, profile, becomeCreator } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch real creators from database
  const { data: creators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ['/api/creators'],
    queryFn: async () => {
      const response = await fetch('/api/creators');
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }
      return response.json();
    }
  });

  // Transform creators for the carousel component
  const featuredCreators = creators.map((creator: any) => ({
    username: creator.username,
    displayName: creator.display_name,
    description: creator.bio || 'Creative professional sharing amazing content',
    videoCount: creator.video_count || 0,
    rating: creator.rating, // Don't provide fallback for authentic data
    thumbnail: creator.avatar_url || '/api/placeholder/300/200',
    isVerified: creator.is_verified || false
  }));

  const handleBecomeCreator = async () => {
    // For testing without authentication, simulate the flow
    if (!user) {
      toast({
        title: "Demo: You're now a creator!",
        description: "In a real app, you'd need to sign in first. Redirecting to dashboard...",
      });
      setLocation('/dashboard');
      return;
    }

    try {
      await becomeCreator();
      toast({
        title: "You're now a creator!",
        description: "Your dashboard is ready.",
      });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to become a creator.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to Mosswood
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover amazing content from independent creators. Support artists directly and own your viewing experience.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/explore">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Explore Creators
              </Button>
            </Link>
            {user ? (
              <>
                <Link href="/library">
                  <Button size="lg" variant="outline">
                    My Library
                  </Button>
                </Link>
                <Button size="lg" variant="secondary" onClick={handleBecomeCreator}>
                  Become a Creator
                </Button>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" variant="outline">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Featured Creators Carousel */}
        <FeaturedCreatorsCarousel creators={featuredCreators} />

        {/* How It Works Section */}
        <section className="bg-muted/50 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">How Mosswood Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Discover Creators</h3>
              <p className="text-muted-foreground">
                Browse independent creators and find content that speaks to you
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Buy & Own</h3>
              <p className="text-muted-foreground">
                Purchase videos directly from creators and own them forever
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Support Artists</h3>
              <p className="text-muted-foreground">
                Your purchases go directly to creators, supporting independent art
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}