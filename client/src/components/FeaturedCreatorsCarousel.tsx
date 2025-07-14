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
    <div className="relative" role="region" aria-label="Featured Creators Carousel">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing focus:outline-none"
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
                className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 cursor-pointer"
                role="tabpanel"
                aria-label={`Creator: ${creator.displayName}`}
              >
                <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{creator.displayName}</h3>
                      {creator.isVerified && (
                        <Badge variant="verified">
                          <Star className="w-3 h-3 mr-1" />
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
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white opacity-80" />
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
                    <Button className="w-full group-hover:bg-primary/90 transition-all duration-300 transform group-hover:scale-105">
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
              "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background",
              "transition-all duration-300 opacity-70 hover:opacity-100",
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
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
              "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background",
              "transition-all duration-300 opacity-70 hover:opacity-100",
              currentIndex === maxIndex ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
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
                  ? "bg-primary w-8" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
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