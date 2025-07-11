import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Monitor, Maximize, Users } from 'lucide-react';
import { Logo } from '@/components/Logo';

// Mock video data
const videoData = {
  id: 1,
  title: "How I Shot This Scene",
  duration: "12:34",
  price: 9.99,
  creator: "Maya Lee",
  description: "In this behind-the-scenes documentary, I break down the cinematography techniques and creative decisions that went into capturing one of my most challenging scenes. From camera angles to lighting setups, discover the artistic process behind creating compelling visual narratives that connect with audiences on an emotional level.",
  videoUrl: "https://placehold.co/800x450/1a1a1a/white?text=Video+Player", // Placeholder video frame
};

// Mock related videos
const relatedVideos = [
  {
    id: 2,
    title: "My Creative Process",
    duration: "08:15",
    price: 0,
    thumbnail: "https://placehold.co/400x200/2a2a2a/white?text=Creative+Process"
  },
  {
    id: 3,
    title: "Documentary BTS",
    duration: "15:22", 
    price: 4.99,
    thumbnail: "https://placehold.co/400x200/2a2a2a/white?text=Documentary+BTS"
  },
  {
    id: 4,
    title: "Behind the Camera",
    duration: "06:45",
    price: 0,
    thumbnail: "https://placehold.co/400x200/2a2a2a/white?text=Behind+Camera"
  }
];

type PlaybackMode = 'default' | 'theater' | 'fullscreen';

export default function VideoDetail() {
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('default');

  const handlePurchase = () => {
    console.log(`Purchasing video: ${videoData.title} for $${videoData.price}`);
  };

  const handleRelatedVideoClick = (video: typeof relatedVideos[0]) => {
    if (video.price === 0) {
      console.log(`Playing free video: ${video.title}`);
    } else {
      console.log(`Viewing video: ${video.title} ($${video.price})`);
    }
  };

  const getVideoContainerClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'w-full max-w-6xl mx-auto';
      case 'fullscreen':
        return 'fixed inset-0 z-50 bg-black flex items-center justify-center';
      default:
        return 'w-full max-w-4xl mx-auto';
    }
  };

  const getVideoClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'w-full aspect-video rounded-lg';
      case 'fullscreen':
        return 'w-full h-full object-contain';
      default:
        return 'w-full aspect-video rounded-lg';
    }
  };

  const getPageClasses = () => {
    switch (playbackMode) {
      case 'theater':
        return 'min-h-screen bg-black text-white';
      case 'fullscreen':
        return 'min-h-screen bg-black text-white overflow-hidden';
      default:
        return 'min-h-screen bg-black text-white';
    }
  };

  return (
    <div className={getPageClasses()}>
      {/* Header - hidden in fullscreen */}
      {playbackMode !== 'fullscreen' && (
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Logo showText={true} className="text-2xl" />
            <nav className="flex space-x-6">
              <a href="/dashboard" className="text-gray-300 hover:text-amber-400 transition-colors">
                Dashboard
              </a>
              <a href="/creator/maya-lee" className="text-gray-300 hover:text-amber-400 transition-colors">
                Maya's Store
              </a>
            </nav>
          </div>
        </header>
      )}

      <div className={`${playbackMode === 'theater' ? 'bg-gray-900' : ''} ${playbackMode === 'fullscreen' ? '' : 'px-6 py-8'}`}>
        {/* Playback Mode Controls - hidden in fullscreen */}
        {playbackMode !== 'fullscreen' && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex space-x-2">
              <Button
                onClick={() => setPlaybackMode('default')}
                variant={playbackMode === 'default' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  playbackMode === 'default'
                    ? 'bg-amber-600 hover:bg-amber-700 text-black'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Default
              </Button>
              <Button
                onClick={() => setPlaybackMode('theater')}
                variant={playbackMode === 'theater' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  playbackMode === 'theater'
                    ? 'bg-amber-600 hover:bg-amber-700 text-black'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Theater
              </Button>
              <Button
                onClick={() => setPlaybackMode('fullscreen')}
                variant={playbackMode === 'fullscreen' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  playbackMode === 'fullscreen'
                    ? 'bg-amber-600 hover:bg-amber-700 text-black'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Maximize className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        )}

        {/* Video Player Section */}
        <div className={getVideoContainerClasses()}>
          <div className="relative group">
            <img
              src={videoData.videoUrl}
              alt={videoData.title}
              className={getVideoClasses()}
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handlePurchase}
                className="bg-amber-600 hover:bg-amber-700 text-black font-semibold px-8 py-4 text-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Buy & Watch for ${videoData.price.toFixed(2)}
              </Button>
            </div>
            
            {/* Exit Fullscreen Button (only shown in fullscreen) */}
            {playbackMode === 'fullscreen' && (
              <Button
                onClick={() => setPlaybackMode('default')}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white"
                size="sm"
              >
                Exit Fullscreen
              </Button>
            )}
          </div>
        </div>

        {/* Video Info and Content - hidden in fullscreen */}
        {playbackMode !== 'fullscreen' && (
          <div className="max-w-4xl mx-auto mt-8 space-y-8">
            {/* Video Information */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {videoData.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4 text-gray-300">
                  <span className="text-amber-400 font-semibold">
                    Duration: {videoData.duration}
                  </span>
                  <span>by {videoData.creator}</span>
                </div>
                
                <Button
                  onClick={handlePurchase}
                  className="bg-amber-600 hover:bg-amber-700 text-black font-semibold px-6 py-2 w-fit"
                >
                  Buy for ${videoData.price.toFixed(2)}
                </Button>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Description</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {videoData.description}
              </p>
            </div>

            {/* More from Creator Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                More from {videoData.creator}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="group bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-200 hover:scale-105 cursor-pointer"
                    onClick={() => handleRelatedVideoClick(video)}
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
                          <Play className="w-8 h-8 text-white/80 group-hover:text-amber-400 transition-colors" />
                        </div>
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="text-amber-400 font-semibold text-sm">
                          {video.price === 0 ? 'Free' : `$${video.price.toFixed(2)}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - hidden in fullscreen */}
      {playbackMode !== 'fullscreen' && (
        <footer className="border-t border-gray-800 py-8 px-6 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <p className="text-gray-400">
                Powered by <span className="text-amber-400 font-semibold">Mosswood</span>
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Terms
                </a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  Explore Creators
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}