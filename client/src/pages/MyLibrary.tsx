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

  // For development - use a test email if no user is authenticated
  const testEmail = "aguilera209@gmail.com"; // The email from payment logs
  const effectiveEmail = user?.email || testEmail;
  


  // Fetch user's purchases
  const { data: purchasesData, error: purchasesError, isLoading } = useQuery({
    queryKey: ['purchases', effectiveEmail],
    queryFn: async () => {
      console.log('Fetching purchases for email:', effectiveEmail);
      try {
        const response = await apiRequest('GET', `/api/purchases?email=${encodeURIComponent(effectiveEmail)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Purchases response:', data);
        return data;
      } catch (error) {
        console.error('Purchase fetch error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const purchases: Purchase[] = purchasesData?.purchases || [];

  // Fetch real video data for purchased videos
  const { data: videosData } = useQuery({
    queryKey: ['purchased-video-details', purchases.map(p => p.video_id)],
    queryFn: async () => {
      if (purchases.length === 0) return [];
      
      console.log('=== LIBRARY DEBUG ===');
      console.log('User ID:', user?.id);  
      console.log('Effective email:', effectiveEmail);
      console.log('Purchases raw:', purchases);
      console.log('Video IDs to fetch:', purchases.map(p => p.video_id));
      
      const videoPromises = purchases.map(async (purchase) => {
        try {
          const response = await apiRequest('GET', `/api/video/${purchase.video_id}`);
          const videoResponse = await response.json();
          const video = videoResponse.video;
          console.log(`Video ${purchase.video_id} data:`, video);
          return {
            ...video,
            purchase_id: purchase.id,
            purchased_at: purchase.purchased_at,
            amount: purchase.amount
          };
        } catch (error) {
          console.error(`Failed to fetch video ${purchase.video_id}:`, error);
          return null;
        }
      });
      
      const videos = await Promise.all(videoPromises);
      const validVideos = videos.filter(v => v !== null);
      console.log('Final video data:', validVideos);
      console.log('====================');
      
      return validVideos;
    },
    enabled: purchases.length > 0
  });

  // Map real video data to purchased videos
  const purchasedVideos: PurchasedVideo[] = (videosData || [])
    .map(video => ({
      id: video.id,
      title: video.title || 'Unknown Video',
      creator: video.profiles?.display_name || 'Unknown Creator',
      thumbnail: video.thumbnail_url || '',
      duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00',
      price: video.price || 0,
      purchaseDate: new Date(video.purchased_at).toLocaleDateString(),
      amount: video.amount / 100 // Convert cents to dollars
    }))
    .filter(video => video.title !== 'Unknown Video');

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
                      src={`/api/video-thumbnail/${video.id}.jpg?t=${Date.now()}`} 
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                      style={{ background: 'transparent' }}
                      onLoad={(e) => {
                        console.log(`Thumbnail loaded successfully for video ${video.id}`);
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.style.background = 'transparent';
                        }
                      }}
                      onError={(e) => {
                        console.error(`Failed to load thumbnail for video ${video.id}`);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.style.background = 'linear-gradient(135deg, #0d1b2a 0%, #007B82 100%)';
                        }
                      }}
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
  return <MyLibraryContent />;
}