
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lightbulb, 
  Menu, 
  X, 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  LogOut,
  User,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileMenuRef = useClickOutside<HTMLDivElement>({
    onClickOutside: () => setMobileMenuOpen(false),
    enabled: mobileMenuOpen
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
      )}

      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                <span className="text-lg sm:text-xl font-bold text-gray-900">Planorama</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:ml-8 md:flex space-x-4 lg:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActivePath(item.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:block">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary-100 text-primary-700 text-xs sm:text-sm">
                        {user?.user_metadata?.full_name 
                          ? getInitials(user.user_metadata.full_name)
                          : user?.email?.charAt(0).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 w-8 p-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden border-t border-gray-200 bg-white shadow-lg z-50 transform transition-transform duration-200 ease-in-out"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Improved mobile layout */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center">
              <p className="text-sm text-gray-500 text-center sm:text-left">
                © 2024 Planorama. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link to="/help" className="text-sm text-gray-500 hover:text-gray-700">
                Help
              </Link>
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
