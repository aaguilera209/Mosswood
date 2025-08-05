import React from 'react';
import { Link } from 'wouter';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Play, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const FeaturedCreatorsCarousel = ({ creators = [] }) => {
  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No creators to display</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header with View All button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Featured Creators</h2>
          <p className="text-muted-foreground mt-1">Discover amazing talent from our community</p>
        </div>
        <Link href="/explore">
          <Button variant="outline" className="text-sm">
            View All
          </Button>
        </Link>
      </div>

      {/* Swiper Carousel */}
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={3}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
        }}
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
        }}
        className="featured-creators-swiper"
      >
        {creators.map((creator, index) => (
          <SwiperSlide key={creator.username || creator.id || index} className="flex-shrink-0 w-80 h-[400px]">
            <Link href={`/creator/${creator.username}`} className="block h-full">
              <div className="flex flex-col h-full bg-card border border-gray-600 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer group">
                {/* Image container */}
                <div className="relative flex-shrink-0 h-48 bg-muted">
                  <img 
                    src={`https://picsum.photos/400/300?random=${index + 1}`} 
                    alt={`${creator.displayName || creator.name} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  
                  {/* Video count badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      {creator.videoCount || creator.videos || 0} videos
                    </Badge>
                  </div>
                  
                  {/* Play button - only shows on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-cyan-500 rounded-full p-4 shadow-xl">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                </div>
                
                {/* Card content */}
                <div className="flex-grow flex flex-col p-4">
                  {/* Creator name and verified badge */}
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{creator.displayName || creator.name}</h3>
                    {(creator.isVerified || creator.verified) && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
                    {creator.description || 'Creative content creator'}
                  </p>
                  
                  {/* Stats - only show if authentic data exists */}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    {creator.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{creator.rating}</span>
                      </div>
                    )}
                    {creator.followers && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{creator.followers} followers</span>
                      </div>
                    )}
                    {!creator.rating && !creator.followers && (
                      <span className="text-muted-foreground">New creator</span>
                    )}
                  </div>
                  
                  {/* Visit Storefront button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/creator/${creator.username}`;
                    }}
                  >
                    Visit Storefront
                  </Button>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom navigation buttons */}
      <div className="swiper-button-prev !text-foreground !w-10 !h-10 !mt-0 !left-2 !top-1/2 !-translate-y-1/2 after:!text-lg after:!font-bold"></div>
      <div className="swiper-button-next !text-foreground !w-10 !h-10 !mt-0 !right-2 !top-1/2 !-translate-y-1/2 after:!text-lg after:!font-bold"></div>

      {/* Custom pagination */}
      <div className="swiper-pagination !bottom-0 !relative !mt-6"></div>
    </div>
  );
};

export default FeaturedCreatorsCarousel;