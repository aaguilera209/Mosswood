import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';
import { User, Settings, LogOut, ChevronDown, BarChart3, Eye } from 'lucide-react';
import { useLocation } from 'wouter';

export function Header() {
  const { user, profile } = useAuth();
  const [location] = useLocation();
  
  // Check if we're on the storefront page to hide the storefront button
  const isOnStorefront = location.startsWith('/creator/');
  


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
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    {!isOnStorefront && (
                      <Link href={`/creator/${(profile?.display_name || profile?.email?.split('@')[0] || 'creator').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Storefront
                        </Button>
                      </Link>
                    )}
                    
                    {/* Debug: Always show storefront button for testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <Link href={`/creator/alex-aguilera`}>
                        <Button variant="outline" size="sm" className="bg-red-100 dark:bg-red-900">
                          <Eye className="w-4 h-4 mr-2" />
                          DEBUG Storefront
                        </Button>
                      </Link>
                    )}
                  </>
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
                        {profile?.email || user.email} • {profile?.role === 'creator' ? 'Creator' : 'Viewer'}
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
                    {profile?.role === 'creator' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/creator/${profile?.display_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'creator'}`} className="flex items-center w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View Storefront
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
