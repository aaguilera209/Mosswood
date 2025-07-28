import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';
import { User, Settings, LogOut, ChevronDown, BarChart3 } from 'lucide-react';

export function Header() {
  const { user, profile } = useAuth();
  
  console.log('🎯 Header render - profile:', profile);
  console.log('🎯 Header render - display_name:', profile?.display_name);
  console.log('🎯 Header render - role:', profile?.role);

  const handleLogout = async () => {
    try {
      // Simple logout - clear auth and redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2 hover:bg-muted/50 transition-colors duration-200 text-foreground hover:text-foreground !outline-none !ring-0 focus-visible:ring-0 focus-visible:outline-none"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-foreground">
                          {profile?.display_name || profile?.email || user.email}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email || user.email} • {profile?.role || 'viewer'}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {profile?.role === 'creator' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center w-full">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/edit-profile" className="flex items-center w-full">
                        <User className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === 'viewer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/library" className="flex items-center w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          My Library
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
