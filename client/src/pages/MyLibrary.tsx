import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { apiRequest } from '@/lib/queryClient';
import { getVideoById } from '../../../shared/videoData';

interface Purchase {
  id: string;
  profile_id: string;
  video_id: number;
  stripe_session_id: string;
  amount: number;
  purchased_at: string;
}

interface PurchasedVideo {
  id: number;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  price: number;
  purchaseDate: string;
  amount: number;
}

function MyLibraryContent() {
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's purchases
  const { data: purchasesData, error: purchasesError, isLoading } = useQuery({
    queryKey: ['purchases', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log('No user email available for purchases');
        return { purchases: [] };
      }
      
      console.log('Fetching purchases for user:', user.email);
      const response = await apiRequest('GET', `/api/purchases?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      console.log('Purchases response:', data);
      return data;
    },
    enabled: !!user?.email,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const purchases: Purchase[] = purchasesData?.purchases || [];

  // Transform purchases to include video details
  const purchasedVideos: PurchasedVideo[] = purchases.map(purchase => {
    const videoData = getVideoById(purchase.video_id);
    return {
      id: purchase.video_id,
      title: videoData?.title || 'Unknown Video',
      creator: videoData?.creator || 'Unknown Creator',
      thumbnail: videoData?.thumbnail || '',
      duration: videoData?.duration || '0m',
      price: videoData?.price || 0,
      purchaseDate: new Date(purchase.purchased_at).toLocaleDateString(),
      amount: purchase.amount / 100 // Convert cents to dollars
    };
  });

  const handleVideoClick = (videoId: number) => {
    setLocation(`/video/${videoId}`);
  };

  const handleBecomeCreator = () => {
    setLocation('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Library</h1>
            <p className="text-muted-foreground">Your purchased videos and learning progress</p>
          </div>
          
          <div className="text-center py-16">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading your library...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (purchasesError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Library</h1>
            <p className="text-muted-foreground">Your purchased videos and learning progress</p>
          </div>
          
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load library</h2>
            <p className="text-muted-foreground mb-8">
              There was an error loading your purchased videos. Please try again later.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Library</h1>
          <p className="text-muted-foreground">Your purchased videos and learning progress</p>
        </div>

        {purchasedVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Play className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No videos purchased yet</h2>
              <p className="text-muted-foreground mb-8">
                Discover amazing content from talented creators and start learning today.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/explore')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Explore Videos
              </Button>
              
              {profile?.role === 'viewer' && (
                <Button 
                  onClick={handleBecomeCreator}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Become a Creator
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {purchasedVideos.length} video{purchasedVideos.length !== 1 ? 's' : ''} purchased
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border bg-card"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white">
                        Purchased
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {video.duration}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {video.creator}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Purchased {video.purchaseDate}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        ${video.amount.toFixed(2)}
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function MyLibrary() {
  return (
    <ProtectedRoute>
      <MyLibraryContent />
    </ProtectedRoute>
  );
}