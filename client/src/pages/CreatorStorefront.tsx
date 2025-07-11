import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, ExternalLink } from 'lucide-react';
import { FaTwitter, FaYoutube, FaGlobe } from 'react-icons/fa';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { mockVideos, mockCreator, type Video } from '@/../../shared/videoData';

export default function CreatorStorefront() {
  // TODO: Use useParams to get username from URL when implementing dynamic creator loading
  // const { username } = useParams();

  const handleVideoAction = (video: Video) => {
    // Navigate to video detail page
    window.location.href = `/video/${video.id}`;
  };

  const handleFollow = () => {
    console.log('Following creator:', mockCreator.name);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="relative z-50 px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo showText={true} />
          <ThemeToggle />
        </nav>
      </header>

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
                      <Play className="w-12 h-12 text-white/80 group-hover:text-amber-400 transition-colors" />
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
                          video.price === 0
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        } transition-colors font-medium`}
                      >
                        {video.price === 0 ? 'Watch Now' : 'View'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Powered by <span className="text-primary font-semibold">Mosswood</span>
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Explore Creators
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}