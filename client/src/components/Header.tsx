import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';

export function Header() {
  return (
    <header className="relative z-50 px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo showText={true} />
        
        <ThemeToggle />
      </nav>
    </header>
  );
}
