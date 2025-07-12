import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, Lock, Star, DollarSign } from 'lucide-react';
import { FaTwitter, FaYoutube, FaGlobe } from 'react-icons/fa';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PaymentModal } from '@/components/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { mockVideos, mockCreator, type Video } from '@/../../shared/videoData';

export default function CreatorStorefront() {
  const { user, profile } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Mock purchased videos - in real app, this would come from API
  const purchasedVideoIds = [1, 3]; // Mock user has purchased videos 1 and 3
  
  // Check if current user is the creator viewing their own page
  const isOwnPage = profile?.role === 'creator' && profile?.email === 'maya@example.com'; // Mock check

  const handleVideoAction = (video: Video) => {
    const isPurchased = purchasedVideoIds.includes(video.id);
    
    if (isPurchased || video.isFree || isOwnPage) {
      // Navigate to video detail page
      window.location.href = `/video/${video.id}`;
    } else {
      // Show payment modal for purchase
      setSelectedVideo(video);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    if (selectedVideo) {
      window.location.href = `/video/${selectedVideo.id}`;
    }
  };

  const handleFollow = () => {
    console.log('Following creator:', mockCreator.name);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div 
          className="w-full h-80 md:h-96 bg-cover bg-center bg-gray-800"
          style={{ backgroundImage: `url(${mockCreator.banner})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Creator Name Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow-lg">
            {mockCreator.name}
          </h1>
        </div>
      </div>

      {/* Creator Profile Section */}
      <div className="relative px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Avatar (overlapping banner) */}
          <div className="flex justify-center -mt-14 mb-6">
            <img
              src={mockCreator.avatar}
              alt={mockCreator.name}
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
                href={mockCreator.socialLinks.twitter} 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a 
                href={mockCreator.socialLinks.youtube} 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
              <a 
                href={mockCreator.socialLinks.website} 
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
              {mockCreator.bio}
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
            {mockVideos.map((video) => (
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
                          return 'Buy';
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
      
      {/* Payment Modal */}
      {selectedVideo && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          videoTitle={selectedVideo.title}
          videoPrice={selectedVideo.price}
          videoId={selectedVideo.id}
        />
      )}
    </div>
  );
}