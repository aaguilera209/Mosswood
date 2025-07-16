import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, Lock, Star, DollarSign } from 'lucide-react';
import { FaTwitter, FaYoutube, FaGlobe } from 'react-icons/fa';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { useAuth } from '@/contexts/AuthContext';
import { getVideosByCreator, getCreatorByUsername, type Video, type Creator } from '@/../../shared/videoData';

export default function CreatorStorefront() {
  const { user, profile } = useAuth();
  const params = useParams();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorVideos, setCreatorVideos] = useState<Video[]>([]);
  
  // Load creator data based on URL parameter
  useEffect(() => {
    if (params?.username) {
      const creatorData = getCreatorByUsername(params.username);
      if (creatorData) {
        setCreator(creatorData);
        setCreatorVideos(getVideosByCreator(creatorData.name));
      }
    }
  }, [params?.username]);
  
  // Mock purchased videos - in real app, this would come from API
  const purchasedVideoIds = [1, 3]; // Mock user has purchased videos 1 and 3
  
  // Check if current user is the creator viewing their own page
  const isOwnPage = profile?.role === 'creator' && creator && profile?.email === `${creator.username}@example.com`;

  const handleVideoAction = (video: Video) => {
    // Always navigate to video detail page for better UX
    // The video detail page will handle purchase flow
    window.location.href = `/video/${video.id}`;
  };



  const handleFollow = () => {
    console.log('Following creator:', creator?.name);
  };

  // Show loading state or 404 if creator not found
  if (!creator) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
            <p className="text-muted-foreground mb-6">The creator you're looking for doesn't exist.</p>
            <Button 
              onClick={() => window.location.href = '/explore'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Explore Other Creators
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div 
          className="w-full h-80 md:h-96 bg-cover bg-center bg-gray-800"
          style={{ backgroundImage: `url(${creator.banner})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Creator Name Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow-lg">
            {creator.name}
          </h1>
        </div>
      </div>

      {/* Creator Profile Section */}
      <div className="relative px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Avatar (overlapping banner) */}
          <div className="flex justify-center -mt-14 mb-6">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-[180px] h-[180px] rounded-full ring-4 ring-white bg-gray-800"
            />
          </div>

          {/* Follow Button & Social Links */}
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Button
              onClick={handleFollow}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2 transition-colors"
            >
              Follow
            </Button>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a 
                href={creator.socialLinks.twitter} 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a 
                href={creator.socialLinks.youtube} 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
              <a 
                href={creator.socialLinks.website} 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Website"
              >
                <FaGlobe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Bio Section */}
          <div className="text-center mb-12">
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
              {creator.bio}
            </p>
          </div>
        </div>
      </div>

      {/* Videos Grid Section */}
      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Videos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorVideos.map((video) => (
              <Card 
                key={video.id} 
                className="group bg-card border-border hover:bg-muted transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer"
                onClick={() => handleVideoAction(video)}
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
                      <Play className="w-12 h-12 text-white/80 group-hover:text-primary transition-colors" />
                    </div>
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-3 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      {/* Price */}
                      <div className="text-primary font-semibold">
                        {video.price === 0 ? 'Free' : `$${video.price.toFixed(2)}`}
                      </div>
                      
                      {/* Action Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoAction(video);
                        }}
                        size="sm"
                        className={`${
                          (() => {
                            const isPurchased = purchasedVideoIds.includes(video.id);
                            if (isOwnPage) return 'bg-blue-600 hover:bg-blue-700 text-white';
                            if (isPurchased || video.price === 0) return 'bg-green-600 hover:bg-green-700 text-white';
                            return 'bg-primary hover:bg-primary/90 text-primary-foreground';
                          })()
                        } transition-colors font-medium`}
                      >
                        {(() => {
                          const isPurchased = purchasedVideoIds.includes(video.id);
                          if (isOwnPage) return 'Edit';
                          if (isPurchased || video.price === 0) return 'Watch';
                          return 'View Details';
                        })()}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      

    </div>
  );
}