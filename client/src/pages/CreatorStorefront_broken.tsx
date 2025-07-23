import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, Lock, Star, DollarSign, MapPin, Globe, User, Clock, Mail } from 'lucide-react';
import { FaTwitter, FaYoutube, FaGlobe, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Profile } from '@/../../shared/schema';

export default function CreatorStorefront() {
  const { user, profile } = useAuth();
  const params = useParams();
  
  // Fetch creator profile data
  const { data: creatorData, isLoading: creatorLoading } = useQuery({
    queryKey: ['/api/profile', params?.username],
    queryFn: () => apiRequest('GET', `/api/profile/${encodeURIComponent(params?.username || '')}`),
    enabled: !!params?.username,
  });

  // Fetch creator's videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: () => apiRequest('GET', '/api/videos'),
  });

  // Fetch user's purchases
  const { data: purchasesData } = useQuery({
    queryKey: ['/api/purchases', user?.email],
    queryFn: () => apiRequest('GET', `/api/purchases?email=${encodeURIComponent(user?.email || '')}`),
    enabled: !!user?.email,
  });

  const creatorProfile = creatorData?.profile as Profile | null;
  const creatorVideos = videosData?.videos?.filter((video: any) => 
    video.creator_id === creatorProfile?.id
  ) || [];
  const purchasedVideoIds = purchasesData?.purchases?.map((p: any) => p.video_id) || [];
  
  // Check if current user is the creator viewing their own page
  const isOwnPage = profile?.role === 'creator' && creatorProfile && profile?.id === creatorProfile.id;

  const handleVideoAction = (video: any) => {
    // Always navigate to video detail page for better UX
    // The video detail page will handle purchase flow
    window.location.href = `/video/${video.id}`;
  };

  const handleFollow = () => {
    console.log('Following creator:', creatorProfile?.display_name);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <FaTwitter className="w-5 h-5" />;
      case 'instagram': return <FaInstagram className="w-5 h-5" />;
      case 'youtube': return <FaYoutube className="w-5 h-5" />;
      case 'tiktok': return <FaTiktok className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  // Show loading state
  if (creatorLoading || videosLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  // Show 404 if creator not found
  if (!creatorProfile) {
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
        {/* Banner Image - use default gradient if no custom banner */}
        <div className="w-full h-80 md:h-96 bg-gradient-to-br from-primary/20 to-primary/40 dark:from-primary/10 dark:to-primary/20">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Creator Name Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-2">
              {creatorProfile.display_name || 'Creator'}
            </h1>
            {creatorProfile.tagline && (
              <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
                {creatorProfile.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Creator Profile Section */}
      <div className="relative px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Avatar (overlapping banner) */}
          <div className="flex justify-center -mt-14 mb-6">
            <div className="w-[180px] h-[180px] rounded-full ring-4 ring-background bg-muted flex items-center justify-center overflow-hidden">
              {creatorProfile.avatar_url ? (
                <img
                  src={creatorProfile.avatar_url}
                  alt={creatorProfile.display_name || 'Creator'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{creatorProfile.display_name || 'Creator'}</h2>
            {creatorProfile.bio && (
              <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
                {creatorProfile.bio}
              </p>
            )}
            
            {/* Location and other details */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
              {creatorProfile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{creatorProfile.location}</span>
                </div>
              )}
              {creatorProfile.timezone && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{creatorProfile.timezone}</span>
                </div>
              )}
            </div>

            {/* Follow Button */}
            <Button
              onClick={handleFollow}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2 transition-colors mb-6"
            >
              Follow
            </Button>
            
            {/* Links and Social Media */}
            <div className="flex flex-wrap justify-center gap-4">
              {creatorProfile.website && (
                <a 
                  href={creatorProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              
              {creatorProfile.contact_email && (
                <a 
                  href={`mailto:${creatorProfile.contact_email}`}
                  className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </a>
              )}
              
              {/* Social Links */}
              {creatorProfile.social_links && Object.entries(creatorProfile.social_links).map(([platform, url]) => 
                url && (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={platform}
                  >
                    {getSocialIcon(platform)}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Creator Stats - can be expanded later */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{creatorVideos.length}</div>
                <div className="text-sm text-muted-foreground">Videos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">-</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">-</div>
                <div className="text-sm text-muted-foreground">Views</div>
              </CardContent>
            </Card>
          </div>

          {/* Videos Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Videos</h3>
              {isOwnPage && (
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  size="sm"
                >
                  Manage Videos
                </Button>
              )}
            </div>

            {creatorVideos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No videos uploaded yet.</p>
                  {isOwnPage && (
                    <Button
                      onClick={() => window.location.href = '/dashboard'}
                      className="mt-4"
                    >
                      Upload Your First Video
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creatorVideos.map((video: any) => {
                  const isPurchased = purchasedVideoIds.includes(video.id);
                  const isFree = video.price === 0;
                  const canWatch = isFree || isPurchased || isOwnPage;

                  return (
                    <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Play className="w-12 h-12 text-primary/60" />
                          </div>
                        )}
                        
                        {/* Price Badge */}
                        <div className="absolute top-2 right-2">
                          {isFree ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">
                              Free
                            </Badge>
                          ) : canWatch ? (
                            <Badge className="bg-primary hover:bg-primary/90">
                              <Star className="w-3 h-3 mr-1" />
                              Owned
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${(video.price / 100).toFixed(2)}
                            </Badge>
                          )}
                        </div>

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {canWatch ? (
                              <Play className="w-6 h-6 text-black ml-1" />
                            ) : (
                              <Lock className="w-6 h-6 text-black" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <CardContent 
                        className="p-4"
                        onClick={() => handleVideoAction(video)}
                      >
                        <h4 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {video.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant={canWatch ? "default" : "secondary"}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoAction(video);
                            }}
                          >
                            {canWatch ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Watch Now
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                View Details
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
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