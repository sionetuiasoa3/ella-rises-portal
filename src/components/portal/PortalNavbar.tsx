import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Calendar,
  Award,
  LogOut,
  Heart,
  Menu,
  X,
  Home,
  ExternalLink,
} from 'lucide-react';
import ellaRisesLogo from '@/assets/ella-rises-logo.png';

const PortalNavbar: React.FC = () => {
  const { participant, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: Home },
    { href: '/portal/events', label: 'Events', icon: Calendar },
    { href: '/portal/milestones', label: 'Milestones', icon: Award },
    { href: '/portal/donate', label: 'Donate', icon: Heart },
  ];

  const handleLogout = () => {
    logout();
    navigate('/portal/auth');
  };

  const getInitials = () => {
    if (!participant) return 'U';
    return `${participant.ParticipantFirstName?.[0] || ''}${participant.ParticipantLastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 bg-ella-warm-cream/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link to="/portal/dashboard" className="flex items-center gap-2">
            <img src={ellaRisesLogo} alt="Ella Rises" className="h-10" />
            <span className="font-semibold text-foreground hidden sm:inline">Portal</span>
          </Link>

          {/* Centered Navigation */}
          <div className="hidden md:flex items-center justify-center gap-6 flex-1">
            {/* Home link */}
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Home
            </Link>
            
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={participant?.ParticipantPhotoPath || undefined}
                      alt={participant?.ParticipantFirstName || 'User'}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant?.ParticipantPhotoPath || undefined} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {participant?.ParticipantFirstName} {participant?.ParticipantLastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {participant?.ParticipantEmail}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/portal/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/portal/events" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted mt-2 border-t border-border pt-4"
              >
                <ExternalLink className="h-5 w-5" />
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PortalNavbar;
