import { Play } from 'lucide-react';

export function VideoSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Video Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary via-gray-900 to-background dark:from-secondary dark:via-gray-900 dark:to-background">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 dark:bg-opacity-60"></div>
        
        {/* Video placeholder content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white space-y-4 opacity-30">
            <Play className="text-8xl mx-auto" />
            <p className="text-lg">Background Video Placeholder</p>
            <p className="text-sm">Cinematic creator content will play here</p>
          </div>
        </div>
        
        {/* Future video element - replace placeholder above with:
        <video 
          autoPlay 
          muted 
          loop 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="your-video-url.mp4" type="video/mp4" />
        </video>
        */}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Your vision.
            <br />
            <span className="text-amber-300">Your platform.</span>
          </h2>
          <p className="text-xl text-gray-200 font-light">
            Break free from algorithms and intermediaries
          </p>
        </div>
      </div>
    </section>
  );
}
