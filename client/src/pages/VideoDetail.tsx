import React, { useState, useEffect, useRef } from 'react';
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
import { useVideoTracking } from '@/hooks/useVideoTracking';

type PlaybackMode = 'default' | 'theater' | 'fullscreen';

// Helper function to format duration from seconds to MM:SS
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60); // Remove decimals
  
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
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoPlaybackError, setVideoPlaybackError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [useSmoothAnimation, setUseSmoothAnimation] = useState(false);
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

  // Initialize video tracking
  const { trackView, trackTimeUpdate } = useVideoTracking({
    videoId: videoData?.id || 0,
    videoDuration: videoDuration || undefined
  });
  
  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Also check URL parameters for recent purchases (to handle immediate post-purchase access)
  const urlParams = new URLSearchParams(window.location.search);
  const recentPurchase = urlParams.get('purchased') === 'true';
  const purchasedVideoId = urlParams.get('videoId');
  const hasRecentPurchase = recentPurchase && purchasedVideoId && parseInt(purchasedVideoId) === videoData?.id;
  

  const isOwnVideo = profile?.role === 'creator' && profile?.email === 'maya@example.com'; // Mock check

  // Fetch real video data from API
  const { data: videoApiData, isLoading: videoLoading, error: videoFetchError } = useQuery({
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
      
      // Set creator username from profile data returned with video
      const creatorName = videoApiData.video.profiles?.display_name || 'Unknown Creator';
      setCreatorUsername(creatorName);
    }
  }, [videoApiData]);

  // Get creator's Stripe Connect status from video data
  const creatorProfile = videoApiData?.video?.profiles;
  const hasStripeSetup = creatorProfile?.stripe_account_id && creatorProfile?.stripe_charges_enabled;

  // Fetch more videos from this creator
  const { data: moreFromCreatorVideos = [] } = useQuery({
    queryKey: ['creator-videos', videoData?.creator_id, videoData?.id],
    queryFn: async () => {
      if (!videoData?.creator_id) return [];
      
      const response = await apiRequest('GET', `/api/creators/${videoData.creator_id}/videos?exclude=${videoData.id}`);
      if (!response.ok) throw new Error('Failed to fetch creator videos');
      return response.json();
    },
    enabled: !!videoData?.creator_id
  });

  // Clean up animation frame on unmount and handle smooth animation
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle smooth animation updates
  useEffect(() => {
    const startProgressAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const updateProgress = () => {
        if (videoElement && !videoElement.paused) {
          const newTime = videoElement.currentTime;
          setCurrentTime(newTime);
          // Smooth 60fps progress tracking working correctly
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const stopProgressAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    if (isPlaying && videoElement) {
      startProgressAnimation();
    } else {
      stopProgressAnimation();
    }

    return () => {
      stopProgressAnimation();
    };
  }, [useSmoothAnimation, isPlaying, videoElement]);



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
        
        // Handle Stripe Connect setup errors specifically
        if (data.code === 'STRIPE_NOT_SETUP') {
          toast({
            title: "Creator Payment Setup Required",
            description: data.message || "This creator has not completed payment setup yet.",
            variant: "destructive",
          });
          return;
        }
        
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

  // Show loading state while fetching data
  if (videoLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
        <Footer />
      </div>
    );
  }

  // If video not found after loading, show error
  if (videoFetchError || !videoData) {
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
    // Don't toggle play/pause if volume is being dragged
    if (isDraggingRef.current) {
      console.log('Ignoring video click - volume drag in progress');
      return;
    }
    
    if (canWatchVideo()) {
      // Force loading state off for mobile compatibility
      if (isVideoLoading) {
        console.log('Force clearing loading state on click');
        setIsVideoLoading(false);
      }
      
      if (videoElement) {
        if (isPlaying) {
          videoElement.pause();
        } else {
          // Use play() with promise handling for better mobile support
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('Play failed:', error);
              setVideoPlaybackError('Video playback failed. Try again.');
            });
          }
        }
      }
    } else {
      handleWatchAction();
    }
  };

  const handleVideoRef = (video: HTMLVideoElement | null) => {
    if (video && video !== videoElement) {
      setVideoElement(video);
      
      // Video event listeners
      const handleLoadStart = () => {
        console.log('Video load start');
        setIsVideoLoading(true);
      };
      
      // Use canplaythrough for better mobile compatibility instead of loadeddata
      const handleCanPlayThrough = () => {
        console.log('Video can play through');
        setIsVideoLoading(false);
        setVideoPlaybackError(null);
        // Always get duration from actual video metadata for accuracy
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          const realDuration = Math.floor(video.duration);
          setVideoDuration(realDuration);
          console.log('Video duration loaded:', realDuration, 'seconds');
        }
      };
      
      // Also listen to loadedmetadata as a fallback
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        if (isVideoLoading) {
          setIsVideoLoading(false);
          setVideoPlaybackError(null);
        }
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          const realDuration = Math.floor(video.duration);
          setVideoDuration(realDuration);
        }
      };
      
      const handleTimeUpdate = () => {
        // Always track video time updates for analytics
        trackTimeUpdate(video.currentTime);
        // Only update time from timeupdate when video is paused (smooth animation handles it when playing)
        if (video.paused) {
          setCurrentTime(video.currentTime);
        }
      };
      const handleProgress = () => {
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1));
        }
      };
      const handlePlay = () => {
        console.log('Video play started');
        setIsPlaying(true);
        setIsVideoLoading(false); // Ensure loading is off when playing
        // Track video view when user starts playing
        if (videoData?.id) {
          trackView(0);
        }
        // Enable smooth animation
        setUseSmoothAnimation(true);
      };
      const handlePause = () => {
        console.log('Video paused');
        setIsPlaying(false);
        // Disable smooth animation and update current time
        setUseSmoothAnimation(false);
        setCurrentTime(video.currentTime);
      };
      const handleError = (event: Event) => {
        console.error('Video playback error:', event);
        const target = event.target as HTMLVideoElement;
        if (target?.error) {
          console.error('Video error details:', {
            code: target.error.code,
            message: target.error.message,
            networkState: target.networkState,
            readyState: target.readyState
          });
        }
        setVideoPlaybackError('Failed to load video. Please try again later.');
        setIsVideoLoading(false);
      };

      // Add event listeners with better mobile support
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('progress', handleProgress);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);

      // Set volume
      video.volume = volume / 100;
      
      // Set initial loading state based on ready state
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
        setIsVideoLoading(false);
      }
      
      // Aggressive mobile fallback: Force loading state to false much sooner
      const mobileLoadTimeout = setTimeout(() => {
        console.log('Mobile fallback: Forcing loading state to false');
        setIsVideoLoading(false);
        setVideoPlaybackError(null);
      }, isMobile ? 1000 : 3000); // 1 second for mobile, 3 seconds for desktop

      // Store cleanup function to be called later if needed
      // (Note: Not returned to avoid React ref callback warning)
    }
  };

  const handleSeek = (time: number) => {
    if (videoElement) {
      videoElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    if (videoElement) {
      videoElement.volume = clampedVolume / 100;
    }
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
        // Better mobile responsiveness with min-height
        return 'w-full aspect-video rounded-lg min-h-[200px] md:min-h-[300px]';
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
        <header className="border-b border-border px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Logo showText={false} className="text-xl md:text-2xl md:block" />
              <Logo showText={true} className="hidden md:block text-xl md:text-2xl" />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <div className={`bg-background ${playbackMode === 'fullscreen' ? '' : 'px-2 md:px-6 py-4 md:py-8'}`}>


        {/* Video Player Section */}
        <div className={`${getVideoContainerClasses()} ${playbackMode === 'theater' ? 'bg-black rounded-lg overflow-hidden' : ''}`}>
          <div 
            className="relative group cursor-pointer touch-manipulation"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onTouchStart={() => setShowControls(true)}
            onClick={(e) => {
              // Don't toggle play/pause if volume is being dragged
              if (isDraggingRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              handleVideoClick();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!isDraggingRef.current) {
                handleVideoClick();
              }
            }}
          >
            {/* HTML5 Video Player or Access Control */}
            <div className={`${getVideoClasses()} bg-gray-900 flex items-center justify-center relative overflow-hidden`}>
              {canWatchVideo() ? (
                <>
                  {/* Actual HTML5 Video Element */}
                  <video
                    ref={handleVideoRef}
                    className="w-full h-full object-contain"
                    poster={videoData.thumbnail || undefined}
                    controls={false} // We'll use custom controls
                    preload="auto" // Changed from metadata to auto for mobile
                    playsInline // Essential for mobile playback
                    webkit-playsinline="true" // iOS compatibility
                    x-webkit-airplay="allow"
                    muted={isMuted} // Some browsers require muted for autoplay
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <source src={videoData.video_url} type="video/mp4" />
                    <source src={videoData.video_url} type="video/webm" />
                    <source src={videoData.video_url} type="video/quicktime" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Video Loading State with mobile optimization */}
                  {isVideoLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm md:text-base">{isMobile ? 'Tap to play' : 'Loading video...'}</p>
                        {isMobile && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Mobile force play button clicked');
                              setIsVideoLoading(false);
                              handleVideoClick();
                            }}
                            className="mt-2 bg-primary hover:bg-primary/90"
                            size="sm"
                          >
                            Play Video
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Video Error State */}
                  {videoPlaybackError && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <div className="mb-4">
                          <svg className="w-16 h-16 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
                        <p className="text-gray-300 mb-4">{videoPlaybackError}</p>
                        <Button 
                          onClick={() => {
                            setVideoPlaybackError(null);
                            setIsVideoLoading(true);
                            if (videoElement) {
                              videoElement.load();
                            }
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Play Button Overlay (shown when video is paused and not loading) */}
                  {!isPlaying && !isVideoLoading && !videoPlaybackError && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 hover:bg-white transition-colors rounded-full p-4 cursor-pointer">
                        <Play className="w-8 h-8 text-black ml-1" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Thumbnail/Poster for locked videos */}
                  {videoData.thumbnail ? (
                    <img
                      src={videoData.thumbnail}
                      alt={videoData.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Play className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Lock Screen Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <div className="mb-4">
                        <Lock className="w-16 h-16 mx-auto text-amber-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {videoData.price === 0 ? 'Sign in to Watch' : 'Purchase Required'}
                      </h3>
                      <p className="text-gray-300 mb-6">
                        {videoData.price === 0 
                          ? 'This free video requires you to sign in to watch.'
                          : `Purchase this video for $${(videoData.price / 100).toFixed(2)} to start watching.`
                        }
                      </p>
                      <div className={`${isProcessingPayment ? 'bg-primary/70' : 'bg-primary hover:bg-primary/90'} transition-colors rounded-lg px-6 py-3 flex items-center space-x-2 cursor-pointer`}>
                        {isProcessingPayment && (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        )}
                        <span className="text-white font-semibold">
                          {isProcessingPayment ? 'Processing...' : videoData.price === 0 ? 'Watch Free' : `Buy for $${(videoData.price / 100).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Custom Video Controls Overlay - only show for accessible videos */}
            {canWatchVideo() && videoElement && (
              <div className={`absolute inset-0 transition-opacity duration-300 ${showControls || playbackMode === 'fullscreen' ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Progress Bar - positioned at bottom edge */}
              <div className="absolute bottom-12 left-0 right-0 px-3">
                <div 
                  className="w-full bg-white/30 h-1 rounded-full cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * (videoDuration || Number(videoData?.duration) || 0);
                    handleSeek(newTime);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startElement = e.currentTarget;
                    let isDragging = true;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      if (isDragging && startElement) {
                        moveEvent.preventDefault();
                        const rect = startElement.getBoundingClientRect();
                        const clickX = moveEvent.clientX - rect.left;
                        const newTime = (clickX / rect.width) * (videoDuration || Number(videoData?.duration) || 0);
                        handleSeek(newTime);
                      }
                    };
                    
                    const handleMouseUp = (upEvent: MouseEvent) => {
                      upEvent.preventDefault();
                      isDragging = false;
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div 
                    className="h-1 rounded-full relative"
                    style={{ 
                      width: videoDuration && videoDuration > 0 ? `${Math.min((currentTime / videoDuration) * 100, 100)}%` : '0%',
                      backgroundColor: '#dc2626',
                      transition: 'none'
                    }}
                  >
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
                        handleVideoClick();
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
                      <div 
                        className="w-16 bg-white/30 h-1 rounded-full cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newVolume = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                          handleVolumeChange(newVolume);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          
                          // Set both state and ref for immediate and persistent tracking
                          setIsDraggingVolume(true);
                          isDraggingRef.current = true;
                          
                          const updateVolume = (clientX: number) => {
                            const clickX = clientX - rect.left;
                            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                            const newVolume = percentage * 100;
                            setVolume(newVolume);
                            if (videoElement) {
                              videoElement.volume = newVolume / 100;
                            }
                          };
                          
                          // Set initial position
                          updateVolume(e.clientX);
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            moveEvent.preventDefault();
                            moveEvent.stopPropagation();
                            updateVolume(moveEvent.clientX);
                          };
                          
                          const handleMouseUp = (upEvent: MouseEvent) => {
                            upEvent.preventDefault();
                            upEvent.stopPropagation();
                            
                            // Clear both state and ref
                            setIsDraggingVolume(false);
                            
                            // Use setTimeout to ensure the click event doesn't fire immediately
                            setTimeout(() => {
                              isDraggingRef.current = false;
                            }, 50);
                            
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      >
                        <div 
                          className="bg-white h-1 rounded-full relative" 
                          style={{ width: `${volume}%` }}
                        >
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time Display - YouTube Style */}
                    <span className="text-white text-sm font-medium">
                      {formatDuration(currentTime)} / {formatDuration(videoDuration || Number(videoData?.duration))}
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
                {videoData.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4 text-muted-foreground dark:text-gray-300">
                  <span className="text-amber-400 font-semibold">
                    Duration: {formatDuration(videoDuration || Number(videoData?.duration))}
                  </span>
                  <span>by {creatorUsername || 'Creator'}</span>
                </div>
                
                {!hasPurchased && videoData.price > 0 && (
                  <div className="flex flex-col gap-2">
                    {hasStripeSetup ? (
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
                    ) : (
                      <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                          Payment Setup in Progress
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
                          This creator is still setting up payments. Purchase will be available once setup is complete.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Description</h2>
              <p className="text-muted-foreground dark:text-gray-300 text-lg leading-relaxed">
                {videoData.description}
              </p>
            </div>

            {/* More from Creator Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">
                More from Creator
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {moreFromCreatorVideos?.map((video: any) => (
                  <Card
                    key={video.id}
                    className="group bg-card border-border hover:bg-muted transition-all duration-200 hover:scale-105 cursor-pointer"
                    onClick={() => handleRelatedVideoClick(video)}
                  >
                    <CardContent className="p-0">
                      {/* Video Thumbnail */}
                      <div className="relative">
                        <img
                          src={`/api/video-thumbnail/${video.id}.jpg?t=${Date.now()}`}
                          alt={video.title}
                          className="w-full aspect-video object-cover rounded-t-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-t-lg">
                                  <div class="text-center">
                                    <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                      </svg>
                                    </div>
                                    <p class="text-xs text-muted-foreground">No thumbnail</p>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-t-lg" />
                        
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/80 group-hover:text-amber-400 transition-colors" />
                        </div>
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="text-amber-400 font-semibold text-sm">
                          {video.price === 0 ? 'Free' : `$${(video.price / 100).toFixed(2)}`}
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