import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Users, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeaturedCreatorsCarousel } from '@/components/FeaturedCreatorsCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Mock featured creators data
const featuredCreators = [
  {
    username: 'maya',
    displayName: 'Maya Chen',
    description: 'Digital art tutorials and creative process insights',
    videoCount: 12,
    rating: 4.9,
    thumbnail: '/api/placeholder/300/200',
    isVerified: true
  },
  {
    username: 'alex',
    displayName: 'Alex Rivera',
    description: 'Photography workshops and behind-the-scenes content',
    videoCount: 8,
    rating: 4.8,
    thumbnail: '/api/placeholder/300/200',
    isVerified: true
  },
  {
    username: 'sarah',
    displayName: 'Sarah Thompson',
    description: 'Music production and sound design tutorials',
    videoCount: 15,
    rating: 4.9,
    thumbnail: '/api/placeholder/300/200',
    isVerified: false
  }
];

export default function ViewerHome() {
  const { user, profile, becomeCreator } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
            {user && profile && (
              <span className="block text-3xl text-primary mt-2">
                Hello, {profile.email}!
              </span>
            )}
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
            <Link href="/library">
              <Button size="lg" variant="outline">
                My Library
              </Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={handleBecomeCreator}>
              Become a Creator
            </Button>
            {!user && (
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

        {/* Featured Creators Section */}
        <section className="mb-16 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Featured Creators</h2>
              <p className="text-muted-foreground mt-2">Discover amazing talent from our community</p>
            </div>
            <Link href="/explore">
              <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                View All
              </Button>
            </Link>
          </div>
          
          <FeaturedCreatorsCarousel creators={featuredCreators} />
        </section>

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