import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Creator {
  username: string;
  displayName: string;
  description: string;
  videoCount: number;
  rating: number;
  thumbnail: string;
  isVerified: boolean;
}

interface FeaturedCreatorsCarouselProps {
  creators: Creator[];
}

export function FeaturedCreatorsCarousel({ creators }: FeaturedCreatorsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // Responsive cards per view
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    return 3; // Desktop
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView);
  
  // Calculate maxIndex after cardsPerView is set
  const maxIndex = Math.max(0, creators.length - cardsPerView);

  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && currentIndex < maxIndex) {
        goToNext();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, maxIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && creators.length > cardsPerView) {
      autoPlayRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, maxIndex, cardsPerView, creators.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - dragStart;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (diff < 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => prev + 1);
      }
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - dragStart;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (diff < 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  // Wheel scroll support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsAutoPlaying(false);
    
    // Support both horizontal and vertical wheel scrolling
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    
    if (delta > 50 && currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    } else if (delta < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Progress dots
  const totalDots = Math.max(1, Math.ceil((creators.length - cardsPerView + 1)));
  const activeDot = Math.min(currentIndex, totalDots - 1);

  return (
    <div className="relative py-4" role="region" aria-label="Featured Creators Carousel">
      {/* Carousel Container - Allow overflow for hover effects */}
      <div 
        ref={carouselRef}
        className="relative overflow-x-hidden overflow-y-visible cursor-grab active:cursor-grabbing focus:outline-none"
        tabIndex={0}
        role="tablist"
        aria-live="polite"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            width: `${(creators.length / cardsPerView) * 100}%`
          }}
        >
          {creators.map((creator, index) => (
            <div
              key={creator.username}
              className="flex-shrink-0 px-3 transition-all duration-300"
              style={{ width: `${100 / cardsPerView}%` }}
            >
              <Card 
                className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:z-20 relative cursor-pointer bg-card border border-border hover:border-cyan-400/50"
                role="tabpanel"
                aria-label={`Creator: ${creator.displayName}`}
                style={{
                  boxShadow: 'var(--group-hover-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty('--group-hover-shadow', '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(30 203 225 / 0.3)');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('--group-hover-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');
                }}
              >
                <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{creator.displayName}</h3>
                      {creator.isVerified && (
                        <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-200 line-clamp-2">{creator.description}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Play className="w-3 h-3 mr-1" />
                      {creator.videoCount} videos
                    </Badge>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-cyan-500 rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{creator.rating}</span>
                      <Users className="w-4 h-4 ml-2" />
                      <span>1.2k followers</span>
                    </div>
                  </div>
                  
                  <Link href={`/creator/${creator.username}`}>
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white border-0 transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl">
                      Visit Storefront
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {creators.length > cardsPerView && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-sm border-2 border-cyan-500/20 hover:border-cyan-500",
              "transition-all duration-300 opacity-80 hover:opacity-100 shadow-lg hover:shadow-xl",
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-110 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
            )}
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-sm border-2 border-cyan-500/20 hover:border-cyan-500",
              "transition-all duration-300 opacity-80 hover:opacity-100 shadow-lg hover:shadow-xl",
              currentIndex === maxIndex ? "opacity-30 cursor-not-allowed" : "hover:scale-110 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
            )}
            onClick={goToNext}
            disabled={currentIndex === maxIndex}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Progress Indicator Dots */}
      {creators.length > cardsPerView && totalDots > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeDot 
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 w-8 shadow-lg" 
                  : "bg-muted-foreground/30 hover:bg-cyan-500/50"
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Autoplay Indicator & Controls Info */}
      {isAutoPlaying && creators.length > cardsPerView && (
        <div className="absolute top-4 left-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" title="Auto-playing" />
        </div>
      )}
      
      {/* Keyboard Hint (only show on focus) */}
      <div className="sr-only focus-within:not-sr-only absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded">
        Use ← → arrow keys to navigate
      </div>
    </div>
  );
}