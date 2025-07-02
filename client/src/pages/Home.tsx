import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VideoSection } from '@/components/VideoSection';
import { MissionSection } from '@/components/MissionSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <HeroSection />
      <VideoSection />
      <MissionSection />
      <Footer />
    </div>
  );
}
