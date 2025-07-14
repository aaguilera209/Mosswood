import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Star, Users } from 'lucide-react';

const FeaturedCreatorsCarousel = ({ creators = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Simple responsive setup
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView);

  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, creators.length - cardsPerView);
  const showNavigation = creators.length > cardsPerView;

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No creators to display</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible py-4">
      {/* Container with margin for arrows */}
      <div className="mx-12 relative">
        {/* Cards container */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              width: `${Math.ceil(creators.length / cardsPerView) * 100}%`
            }}
          >
            {creators.map((creator, index) => (
              <div
                key={creator.username || index}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                {/* Individual card with hover effects */}
                <div className="group hover:scale-105 transition-transform duration-300">
                  <Card className="relative cursor-pointer bg-card border border-border hover:border-cyan-400/50 hover:shadow-xl overflow-hidden">
                    {/* Thumbnail */}
                    <div className="aspect-[3/2] bg-muted rounded-t-lg relative overflow-hidden">
                      <img 
                        src={creator.thumbnail || '/api/placeholder/300/200'} 
                        alt={`${creator.displayName || creator.name} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Creator info */}
                      <div className="absolute bottom-2 left-3 text-white">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-base">{creator.displayName || creator.name}</h3>
                          {creator.isVerified && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-200 line-clamp-1">
                          {creator.description || 'Creative content creator'}
                        </p>
                      </div>
                      
                      {/* Video count */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                          <Play className="w-3 h-3 mr-1" />
                          {creator.videoCount || 0} videos
                        </Badge>
                      </div>
                      
                      {/* Hover play button - only shows on this card */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-cyan-500 rounded-full p-4 shadow-xl">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Card content */}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{creator.rating || '4.8'}</span>
                          <Users className="w-4 h-4 ml-2" />
                          <span>{creator.followers || '1.2k'} followers</span>
                        </div>
                      </div>
                      
                      <Link href={`/creator/${creator.username}`}>
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white">
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

        {/* Navigation arrows */}
        {showNavigation && (
          <>
            <Button
              variant="outline"
              size="icon"
              className={`absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm ${
                currentIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
              }`}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm ${
                currentIndex === maxIndex 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
              }`}
              onClick={goToNext}
              disabled={currentIndex === maxIndex}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {showNavigation && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-cyan-500 w-8' 
                  : 'bg-gray-400 w-2 hover:bg-cyan-400'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCreatorsCarousel;