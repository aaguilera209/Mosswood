import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

export function Header() {
  const { user, profile } = useAuth();

  return (
    <header className="relative z-50 px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo showText={true} />
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Link href="/explore">
              <Button variant="outline" size="sm">
                Explore
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" size="sm">
                My Library
              </Button>
            </Link>
            {user ? (
              <>
                {profile?.role === 'creator' && (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  {profile?.email || user.email}
                </span>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
