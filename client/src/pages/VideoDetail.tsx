import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Monitor, Maximize, Users, Settings, Lock, ArrowLeft, DollarSign } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRoute, Link } from 'wouter';
import { getVideoById, getRelatedVideos, getCreatorByName, type Video } from '@/../../shared/videoData';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type PlaybackMode = 'default' | 'theater' | 'fullscreen';

// Helper function to format duration from seconds to MM:SS
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return '--:--';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function VideoDetail() {
  const [match, params] = useRoute('/video/:id');
  const [videoData, setVideoData] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [creatorUsername, setCreatorUsername] = useState<string>('');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('default');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // For development - use a test email if no user is authenticated
  const testEmail = "aguilera209@gmail.com";
  const effectiveEmail = user?.email || testEmail;
  
  // Fetch user's purchases to check if they own this video
  const { data: purchasesData } = useQuery({
    queryKey: ['purchases', effectiveEmail],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/purchases?email=${encodeURIComponent(effectiveEmail)}`);
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const purchases = purchasesData?.purchases || [];
  
  // Check if user has purchased this video
  const hasPurchased = videoData ? purchases.some((p: any) => p.video_id === videoData.id) : false;
  
  // Also check URL parameters for recent purchases (to handle immediate post-purchase access)
  const urlParams = new URLSearchParams(window.location.search);
  const recentPurchase = urlParams.get('purchased') === 'true';
  const purchasedVideoId = urlParams.get('videoId');
  const hasRecentPurchase = recentPurchase && purchasedVideoId && parseInt(purchasedVideoId) === videoData?.id;
  

  const isOwnVideo = profile?.role === 'creator' && profile?.email === 'maya@example.com'; // Mock check

  // Fetch real video data from API
  const { data: videoApiData, isLoading: videoLoading, error: videoError } = useQuery({
    queryKey: ['video', params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      const response = await apiRequest('GET', `/api/video/${params.id}`);
      if (!response.ok) {
        throw new Error('Video not found');
      }
      return response.json();
    },
    enabled: !!params?.id
  });

  // Update local state when API data changes
  useEffect(() => {
    if (videoApiData?.video) {
      setVideoData(videoApiData.video);
      // For now, use empty array for related videos since we don't have that API yet
      setRelatedVideos([]);
      setCreatorUsername('creator'); // Will be set properly when we have creator info
    }
  }, [videoApiData]);

  // Show video access controls based on user status
  const canWatchVideo = () => {
    if (!videoData) return false;
    if (videoData.price === 0) return true; // Free videos
    if (isOwnVideo) return true; // Creator's own videos
    if (hasPurchased) return true; // Purchased videos from database
    if (hasRecentPurchase) return true; // Recent purchase from URL
    return false;
  };

  const handleWatchAction = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase and watch videos.",
        variant: "destructive",
      });
      return;
    }

    if (canWatchVideo()) {
      setIsPlaying(!isPlaying);
    } else {
      // Start Stripe Checkout flow
      await handleStripeCheckout();
    }
  };

  const handleStripeCheckout = async () => {
    if (!videoData || videoData.price === 0) return;

    setIsProcessingPayment(true);
    
    try {
      // Call backend to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: videoData.id.toString() }),
      });

      const data = await response.json();
      console.log('Checkout session response:', data);

      if (response.ok && data.sessionId) {
        console.log('Redirecting to checkout with sessionId:', data.sessionId);
        // Use session URL if provided, otherwise fallback to constructed URL
        const checkoutUrl = data.url || `https://checkout.stripe.com/c/pay/${data.sessionId}`;
        console.log('Opening checkout URL:', checkoutUrl);
        window.open(checkoutUrl, '_blank');
        
        // Show success message
        toast({
          title: "Checkout Opened",
          description: "Complete your payment in the new tab. You'll be redirected back when done.",
        });
      } else {
        console.error('Failed to create checkout session:', data);
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // If video not found, show error
  if (!videoData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
            <p className="text-muted-foreground mb-6">The video you're looking for doesn't exist.</p>
            <div className="flex space-x-4 justify-center">
              <Link href="/creator/maya">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Back to Creator Page
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline">
                  Explore Other Creators
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleRelatedVideoClick = (video: Video) => {
    window.location.href = `/video/${video.id}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoClick = () => {
    if (canWatchVideo()) {
      togglePlayPause();
    } else {
      handleWatchAction();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const getVideoContainerClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'w-full max-w-6xl mx-auto';
      case 'fullscreen':
        return 'fixed inset-0 z-50 bg-black flex items-center justify-center';
      default:
        return 'w-full max-w-4xl mx-auto';
    }
  };

  const getVideoClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'w-full aspect-video rounded-lg';
      case 'fullscreen':
        return 'w-full h-full object-contain';
      default:
        return 'w-full aspect-video rounded-lg';
    }
  };

  const getPageClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'min-h-screen bg-background text-foreground';
      case 'fullscreen':
        return 'min-h-screen bg-background text-foreground overflow-hidden';
      default:
        return 'min-h-screen bg-background text-foreground';
    }
  };

  return (
    <div className={getPageClasses()}>
      {/* Header - hidden in fullscreen */}
      {playbackMode !== 'fullscreen' && (
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Logo showText={true} className="text-2xl" />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <div className={`${playbackMode === 'theater' ? 'bg-gray-900' : ''} ${playbackMode === 'fullscreen' ? '' : 'px-6 py-8'}`}>


        {/* Video Player Section */}
        <div className={getVideoContainerClasses()}>
          <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onClick={handleVideoClick}
          >
            {/* Video Poster/Thumbnail */}
            <div className={`${getVideoClasses()} bg-gray-900 flex items-center justify-center relative`}>
              {videoData.thumbnail_url ? (
                <img
                  src={videoData.thumbnail_url}
                  alt={videoData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Play className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Overlay for purchased vs non-purchased */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {hasPurchased ? (
                  // Play Button for purchased videos
                  <div className="bg-white/90 hover:bg-white transition-colors rounded-full p-4">
                    <Play className="w-8 h-8 text-black ml-1" />
                  </div>
                ) : (
                  // Purchase Button for non-purchased videos
                  <div className={`${isProcessingPayment ? 'bg-primary/70' : 'bg-primary hover:bg-primary/90'} transition-colors rounded-lg px-6 py-3 flex items-center space-x-2`}>
                    {isProcessingPayment && (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    )}
                    <span className="text-white font-semibold">
                      {isProcessingPayment ? 'Processing...' : videoData.is_free ? 'Watch Free' : `Buy for $${(videoData.price / 100).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* YouTube-style Video Controls Overlay - only show for purchased videos */}
            {hasPurchased && (
              <div className={`absolute inset-0 transition-opacity duration-300 ${showControls || playbackMode === 'fullscreen' ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Progress Bar - positioned at bottom edge */}
              <div className="absolute bottom-12 left-0 right-0 px-3">
                <div className="w-full bg-white/30 h-1 rounded-full cursor-pointer group">
                  <div className="bg-red-600 h-1 rounded-full w-1/2 relative">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between px-3 py-2">
                  {/* Left Controls */}
                  <div className="flex items-center space-x-3">
                    {/* Play/Pause Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPause();
                      }}
                      size="sm"
                      className="bg-transparent hover:bg-white/20 text-white p-1 h-8 w-8"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    {/* Skip Forward */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      size="sm"
                      className="bg-transparent hover:bg-white/20 text-white p-1 h-8 w-8"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                      </svg>
                    </Button>
                    
                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVolumeChange(volume === 0 ? 100 : 0);
                        }}
                        size="sm"
                        className="bg-transparent hover:bg-white/20 text-white p-1 h-8 w-8"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <div className="w-16 bg-white/30 h-1 rounded-full cursor-pointer group">
                        <div 
                          className="bg-white h-1 rounded-full relative" 
                          style={{ width: `${volume}%` }}
                        >
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time Display */}
                    <span className="text-white text-sm font-medium">
                      0:00 / {formatDuration(videoData.duration)}
                    </span>
                  </div>
                  
                  {/* Right Controls */}
                  <div className="flex items-center space-x-1">
                    {/* CC/Subtitles */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      size="sm"
                      className="bg-transparent hover:bg-white/20 text-white p-1 h-8 w-8"
                      title="Closed Captions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
                      </svg>
                    </Button>
                    
                    {/* Settings */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      size="sm"
                      className="bg-transparent hover:bg-white/20 text-white p-1 h-8 w-8"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    {/* Picture in Picture */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaybackMode('default');
                      }}
                      size="sm"
                      className={`${
                        playbackMode === 'default'
                          ? 'bg-white/20'
                          : 'bg-transparent hover:bg-white/20'
                      } text-white p-1 h-8 w-8`}
                      title="Picture in Picture"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"/>
                      </svg>
                    </Button>
                    
                    {/* Theater Mode */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaybackMode('theater');
                      }}
                      size="sm"
                      className={`${
                        playbackMode === 'theater'
                          ? 'bg-white/20'
                          : 'bg-transparent hover:bg-white/20'
                      } text-white p-1 h-8 w-8`}
                      title="Theater Mode"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"/>
                      </svg>
                    </Button>
                    
                    {/* Fullscreen */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaybackMode('fullscreen');
                      }}
                      size="sm"
                      className={`${
                        playbackMode === 'fullscreen'
                          ? 'bg-white/20'
                          : 'bg-transparent hover:bg-white/20'
                      } text-white p-1 h-8 w-8`}
                      title="Fullscreen"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Theater Mode Indicator */}
              {playbackMode === 'theater' && (
                <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-2 py-1 rounded">
                  Theater mode (t)
                </div>
              )}
            </div>
            )}
            
            {/* Exit Fullscreen Button (only shown in fullscreen) */}
            {playbackMode === 'fullscreen' && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaybackMode('default');
                }}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white z-10"
                size="sm"
              >
                Exit Fullscreen
              </Button>
            )}
          </div>
        </div>

        {/* Video Info and Content - hidden in fullscreen */}
        {playbackMode !== 'fullscreen' && (
          <div className="max-w-4xl mx-auto mt-8 space-y-8">
            {/* Video Information */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {videoData.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4 text-gray-300">
                  <span className="text-amber-400 font-semibold">
                    Duration: {formatDuration(videoData.duration)}
                  </span>
                  <span>by Creator</span>
                </div>
                
                {!hasPurchased && !videoData.is_free && videoData.price > 0 && (
                  <Button
                    onClick={handleStripeCheckout}
                    disabled={isProcessingPayment}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 w-fit flex items-center space-x-2"
                  >
                    {isProcessingPayment && (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    )}
                    <span>
                      {isProcessingPayment ? 'Processing...' : `Buy for $${(videoData.price / 100).toFixed(2)}`}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Description</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {videoData.description}
              </p>
            </div>

            {/* More from Creator Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                More from Creator
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="group bg-card border-border hover:bg-muted transition-all duration-200 hover:scale-105 cursor-pointer"
                    onClick={() => handleRelatedVideoClick(video)}
                  >
                    <CardContent className="p-0">
                      {/* Video Thumbnail */}
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-t-lg" />
                        
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/80 group-hover:text-amber-400 transition-colors" />
                        </div>
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="text-amber-400 font-semibold text-sm">
                          {video.price === 0 ? 'Free' : `$${video.price.toFixed(2)}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - hidden in fullscreen */}
      {playbackMode !== 'fullscreen' && (
        <footer className="border-t border-gray-800 py-8 px-6 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <p className="text-gray-400">
                Powered by <span className="text-amber-400 font-semibold">Mosswood</span>
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Terms
                </a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Explore Creators
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}


    </div>
  );
}