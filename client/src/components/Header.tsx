import { Link } from 'wouter';
import { Play } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  return (
    <header className="relative z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-amber-700 dark:bg-amber-300 rounded-lg flex items-center justify-center">
              <Play className="text-white dark:text-gray-900 text-sm fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Mosswood</span>
          </div>
        </Link>
        
        <ThemeToggle />
      </nav>
    </header>
  );
}
