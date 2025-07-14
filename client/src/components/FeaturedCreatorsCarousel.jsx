import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Star, Users } from 'lucide-react';

export function FeaturedCreatorsCarousel({ creators = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3;
  const maxIndex = Math.max(0, creators.length - cardsPerView);
  const showNavigation = creators.length > cardsPerView;

  // Calculate total pages for pagination dots
  const totalPages = Math.ceil(creators.length / cardsPerView);
  const currentPage = Math.floor(currentIndex / cardsPerView);

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const goToPage = (pageIndex) => {
    setCurrentIndex(pageIndex * cardsPerView);
  };

  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No creators to display</p>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Main carousel container */}
      <div className="relative mx-12">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              width: `${creators.length * (100 / cardsPerView)}%`
            }}
          >
            {creators.map((creator, index) => (
              <div
                key={creator.username || index}
                className="flex-shrink-0 px-3"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <Card className="bg-card border border-border rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow duration-300">
                  {/* Thumbnail with hover overlay */}
                  <div className="relative aspect-video bg-muted">
                    <img 
                      src={`https://picsum.photos/300/200?random=${index + 1}`}
                      alt={`${creator.displayName || creator.name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Creator info overlay */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-sm">{creator.displayName || creator.name}</h3>
                        {creator.isVerified && (
                          <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-200 line-clamp-1">
                        {creator.description || 'Creative content creator'}
                      </p>
                    </div>
                    
                    {/* Video count badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/60 text-white text-xs px-2 py-1">
                        <Play className="w-3 h-3 mr-1" />
                        {creator.videoCount || 0} videos
                      </Badge>
                    </div>
                    
                    {/* Hover play button - only shows on individual card hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-cyan-500 rounded-full p-4 shadow-xl">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Card content */}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{creator.rating || '4.8'}</span>
                        <Users className="w-4 h-4 ml-2" />
                        <span>{creator.followers || '1.2k'} followers</span>
                      </div>
                    </div>
                    
                    <Link href={`/creator/${creator.username}`}>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-medium">
                        Visit Storefront
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
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
              className={`absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border-2 ${
                currentIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-background hover:shadow-md'
              }`}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous creators"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border-2 ${
                currentIndex === maxIndex 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-background hover:shadow-md'
              }`}
              onClick={goToNext}
              disabled={currentIndex === maxIndex}
              aria-label="Next creators"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Pagination dots */}
      {showNavigation && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              className={`h-2 rounded-full transition-all duration-300 ${
                pageIndex === currentPage
                  ? 'bg-cyan-500 w-8' 
                  : 'bg-gray-400 w-2 hover:bg-cyan-400'
              }`}
              onClick={() => goToPage(pageIndex)}
              aria-label={`Go to page ${pageIndex + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedCreatorsCarousel;