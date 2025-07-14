import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Star, Users } from 'lucide-react';

const FeaturedCreatorsCarousel = ({ creators = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef();

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
  
  // Show navigation if we have more creators than can fit in view
  const showNavigation = creators.length > cardsPerView;

  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };

    const handleKeyDown = (e) => {
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
    if (isAutoPlaying && showNavigation) {
      autoPlayRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, maxIndex, showNavigation]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  // Mouse drag functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e) => {
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

  // Touch support for mobile swipe
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchEnd = (e) => {
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
  const handleWheel = (e) => {
    e.preventDefault();
    setIsAutoPlaying(false);
    
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    
    if (delta > 50 && currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    } else if (delta < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Progress dots calculation
  const totalDots = Math.max(1, Math.ceil((creators.length - cardsPerView + 1)));
  const activeDot = Math.min(currentIndex, totalDots - 1);

  // Handle empty creators array
  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No creators to display</p>
      </div>
    );
  }

  return (
    <div className="relative py-4 overflow-visible" role="region" aria-label="Featured Creators Carousel">
      {/* Carousel Container with proper scrolling */}
      <div 
        ref={carouselRef}
        className="relative overflow-x-auto overflow-y-visible cursor-grab active:cursor-grabbing focus:outline-none snap-x snap-mandatory scrollbar-hide md:overflow-visible"
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
              key={creator.username || index}
              className="flex-shrink-0 px-3 snap-start"
              style={{ width: `${100 / cardsPerView}%` }}
            >
              {/* Individual card with isolated hover effects using separate group */}
              <div className="group/card hover:scale-[1.02] hover:z-20 transition-all duration-300 ease-in-out">
                <Card 
                  className="relative cursor-pointer bg-card border border-border hover:border-cyan-400/30 hover:shadow-2xl overflow-hidden"
                  role="tabpanel"
                  aria-label={`Creator: ${creator.displayName || creator.name}`}
                >
                  {/* Thumbnail with isolated hover overlay */}
                  <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                    <img 
                      src={creator.thumbnail || '/api/placeholder/300/200'} 
                      alt={`${creator.displayName || creator.name} thumbnail`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center" style={{ display: 'none' }}>
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Creator Info Overlay */}
                    <div className="absolute bottom-4 left-4 text-white z-10">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{creator.displayName || creator.name}</h3>
                        {creator.isVerified && (
                          <Badge className="bg-blue-500 text-white text-xs border-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 line-clamp-2 opacity-90">
                        {creator.description || 'Creative content creator'}
                      </p>
                    </div>
                    
                    {/* Video Count Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                        <Play className="w-3 h-3 mr-1" />
                        {creator.videoCount || 0} videos
                      </Badge>
                    </div>
                    
                    {/* Hover play button - ONLY on this specific card using group/card modifier */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10">
                      <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                        <div className="bg-cyan-500 rounded-full p-3 shadow-xl">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{creator.rating || '4.8'}</span>
                        <Users className="w-4 h-4 ml-2" />
                        <span>{creator.followers || '1.2k'} followers</span>
                      </div>
                    </div>
                    
                    <Link href={`/creator/${creator.username || creator.slug}`}>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white border-0 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium">
                        Visit Storefront
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-sm border-2 border-gray-300/20 hover:border-cyan-500/50 transition-all duration-300 opacity-80 hover:opacity-100 shadow-lg hover:shadow-xl ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
            }`}
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            aria-label="Previous creators"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-sm border-2 border-gray-300/20 hover:border-cyan-500/50 transition-all duration-300 opacity-80 hover:opacity-100 shadow-lg hover:shadow-xl ${
              currentIndex === maxIndex ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
            }`}
            onClick={goToNext}
            disabled={currentIndex === maxIndex}
            aria-label="Next creators"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Progress Indicator Dots */}
      {showNavigation && totalDots > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                index === activeDot 
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 w-8 shadow-lg' 
                  : 'bg-muted-foreground/30 hover:bg-cyan-500/50 w-2'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Autoplay Indicator */}
      {isAutoPlaying && showNavigation && (
        <div className="absolute top-4 left-4 z-20">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" title="Auto-playing" />
        </div>
      )}
      
      {/* Keyboard Navigation Hint */}
      <div className="sr-only focus-within:not-sr-only absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded border border-border z-20">
        Use ← → arrow keys to navigate
      </div>
    </div>
  );
};

export default FeaturedCreatorsCarousel;