import { Link } from 'wouter';
import { Play } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  return (
    <header className="relative z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <Play className="text-white text-sm fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">Mosswood</span>
          </div>
        </Link>
        
        <ThemeToggle />
      </nav>
    </header>
  );
}
