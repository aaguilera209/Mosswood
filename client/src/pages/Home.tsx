import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Users, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import FeaturedCreatorsCarousel from '@/components/FeaturedCreatorsCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const { user, profile, becomeCreator } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch real creators from database
  const { data: creators = [], isLoading: creatorsLoading, error } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      const response = await fetch('/api/creators');
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Transform creators for the carousel component
  const featuredCreators = (creators as any[]).map((creator: any) => ({
    username: creator.username,
    displayName: creator.display_name,
    description: creator.tagline || creator.bio || 'New creator',
    videoCount: creator.video_count || 0,
    rating: creator.rating, // Don't provide fallback for authentic data
    thumbnail: creator.banner_url || '/api/placeholder/300/200',
    isVerified: creator.is_verified || false
  }));



  const handleBecomeCreator = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to become a creator.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is already a creator
    if (profile?.role === 'creator') {
      toast({
        title: "You're already a creator!",
        description: "Redirecting to your dashboard...",
      });
      setLocation('/dashboard');
      return;
    }

    // Redirect to Profile Builder instead of directly making them a creator
    toast({
      title: "Let's set up your creator profile!",
      description: "Complete your profile to start creating.",
    });
    setLocation('/edit-profile');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Welcome to Mosswood
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover amazing content from independent creators. Support artists directly 
            and own your viewing experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Link href="/explore">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Explore Creators
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleBecomeCreator}
            >
              Sign Up
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => setLocation('/login')}
            >
              Sign In
            </Button>
          </div>
        </section>

        {/* Featured Creators Carousel */}
        {creators.length === 0 && !error ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading creators...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load creators. Please try refreshing the page.</p>
          </div>
        ) : (
          <FeaturedCreatorsCarousel creators={featuredCreators} />
        )}

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
