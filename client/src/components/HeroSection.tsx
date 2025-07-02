import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <main className="relative">
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            The platform layer for{' '}
            <span className="text-accent-primary">creative ownership.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-light">
            Host. Sell. Monetize. Your content, your audience, your terms.
          </p>
          
          <div className="space-y-6">
            <Link href="/signup">
              <Button 
                size="lg"
                className="bg-accent-primary hover:bg-accent-hover text-white px-8 py-4 text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Creating
              </Button>
            </Link>
            
            <div className="text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login">
                <span className="text-accent-primary hover:text-accent-hover transition-colors duration-200 underline decoration-1 underline-offset-2 cursor-pointer">
                  Log in
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
